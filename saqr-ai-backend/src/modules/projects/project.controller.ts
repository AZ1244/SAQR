import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/api-response';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { LightingEngineeringService } from '../../services/engineering/lighting.service';
import { PowerEngineeringService } from '../../services/engineering/power.service';
import { ElvEngineeringService } from '../../services/engineering/elv.service';
import { BoqGenerationService } from '../../services/engineering/boq-generation.service';
import { RagService } from '../../services/ai/rag.service';
import { VisionInspectionService } from '../../services/ai/vision-inspection.service';
import { AIReportService } from '../../services/ai/ai-report.service';
import { DocumentIngestionService } from '../../services/ai/document-ingestion.service';
import { EmbeddingService } from '../../services/ai/embedding.service';
import { SystemCategory, Confidence, DesignLevel, ProjectStatus, FileCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export class ProjectsController {
  
  // Helper check to verify project workspace company matches user company
  private static async checkProjectAccess(projectId: string, userCompanyId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: true }
    });
    if (!project) throw new NotFoundError('Project not found');
    if (project.workspace.companyId !== userCompanyId) {
      throw new ForbiddenError('Access to this project is restricted');
    }
    return project;
  }

  public static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const projects = await prisma.project.findMany({
        where: { workspace: { companyId: req.user.companyId } },
        include: { workspace: true }
      });
      return sendSuccess(res, { projects }, 'Projects list retrieved');
    } catch (error) {
      next(error);
    }
  };

  public static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { name, client, country, city, location, projectType, areaSqm, ceilingHeight, designLevel, workspaceId } = req.body;

      // Access verification
      const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
      if (!workspace) throw new NotFoundError('Workspace not found');
      if (workspace.companyId !== req.user.companyId) throw new ForbiddenError('Unauthorized workspace access');

      const project = await prisma.project.create({
        data: {
          name,
          client,
          country,
          city,
          location,
          projectType,
          areaSqm: parseFloat(areaSqm || '100'),
          ceilingHeight: parseFloat(ceilingHeight || '3.0'),
          designLevel: designLevel || DesignLevel.STANDARD,
          workspaceId,
          createdById: req.user.id
        }
      });

      return sendSuccess(res, { project }, 'Project created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public static getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;
      const project = await this.checkProjectAccess(id, req.user.companyId);

      const detailedProject = await prisma.project.findUnique({
        where: { id },
        include: {
          rooms: true,
          files: true,
          boqItems: true,
          powerRequirements: true,
          elvRequirements: true,
          reports: true,
          sitePhotos: {
            include: { findings: true }
          },
          variationClaims: true,
          assets: {
            include: { warranty: true, maintenanceSchedule: true }
          }
        }
      });

      return sendSuccess(res, { project: detailedProject }, 'Project details retrieved');
    } catch (error) {
      next(error);
    }
  };

  public static update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;
      await this.checkProjectAccess(id, req.user.companyId);

      const { name, client, country, city, location, projectType, areaSqm, ceilingHeight, designLevel, status } = req.body;

      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          client,
          country,
          city,
          location,
          projectType,
          areaSqm: areaSqm ? parseFloat(areaSqm) : undefined,
          ceilingHeight: ceilingHeight ? parseFloat(ceilingHeight) : undefined,
          designLevel,
          status
        }
      });

      return sendSuccess(res, { project }, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public static delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;
      await this.checkProjectAccess(id, req.user.companyId);

      await prisma.project.delete({ where: { id } });
      return sendSuccess(res, null, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // ENGINEERING CALCULATIONS & GENERATION
  // ----------------------------------------------------

  public static generateDesign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const project = await this.checkProjectAccess(projectId, req.user.companyId);

      // Fetch all rooms in this project
      const rooms = await prisma.room.findMany({ where: { projectId } });
      if (rooms.length === 0) {
        throw new Error('Please add at least one room to compile spatial calculations');
      }

      // Clear previous calculations
      await prisma.lightingCalculation.deleteMany({ where: { room: { projectId } } });
      await prisma.powerRequirement.deleteMany({ where: { projectId } });
      await prisma.eLVRequirement.deleteMany({ where: { projectId } });

      for (const room of rooms) {
        // 1. Lighting calculation
        const lighting = LightingEngineeringService.calculate({
          roomType: room.type,
          area: room.area,
          ceilingHeight: room.ceilingHeight,
          targetLux: room.luxTarget
        });

        await prisma.lightingCalculation.create({
          data: {
            roomId: room.id,
            targetLux: lighting.targetLux,
            fixtureLumens: lighting.fixtureLumens,
            utilizationFactor: lighting.utilizationFactor,
            maintenanceFactor: lighting.maintenanceFactor,
            fixtureWattage: 36,
            calculatedQty: lighting.roundedQty,
            estimatedWatts: lighting.estimatedWatts,
            fixtureType: lighting.fixtureType,
            confidenceLevel: lighting.confidenceLevel,
            warningsJson: JSON.stringify(lighting.warnings)
          }
        });

        // 2. Power Requirements
        const power = PowerEngineeringService.calculate({
          roomType: room.type,
          area: room.area,
          occupancy: room.occupancy
        });

        await prisma.powerRequirement.create({
          data: {
            projectId,
            roomName: room.name,
            roomType: room.type,
            socketCount: power.socketCount,
            dedicatedCircuits: power.dedicatedCircuits,
            estimatedLoadKw: power.estimatedLoadKw,
            upsRequired: power.upsRequired,
            notes: power.notes,
            confidenceLevel: power.confidenceLevel
          }
        });

        // 3. ELV Requirements
        const elv = ElvEngineeringService.calculate({
          roomType: room.type,
          area: room.area,
          occupancy: room.occupancy
        });

        await prisma.eLVRequirement.create({
          data: {
            projectId,
            roomName: room.name,
            roomType: room.type,
            dataPoints: elv.dataPoints,
            wifiPoints: elv.wifiPoints,
            cctvPoints: elv.cctvPoints,
            accessPoints: elv.accessPoints,
            bmsSensors: elv.bmsSensors,
            rackRequired: elv.rackRequired,
            notes: elv.notes,
            confidenceLevel: elv.confidenceLevel
          }
        });

        // Update Room model counts
        await prisma.room.update({
          where: { id: room.id },
          data: {
            lightingPoints: lighting.roundedQty,
            socketPoints: power.socketCount,
            dataPoints: elv.dataPoints,
            cctvPoints: elv.cctvPoints,
            wifiPoints: elv.wifiPoints,
            accessPoints: elv.accessPoints,
            bmsSensors: elv.bmsSensors
          }
        });
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.DESIGN_IN_PROGRESS }
      });

      // Build rich summary for frontend
      const updatedRooms = await prisma.room.findMany({
        where: { projectId },
        include: { calculations: true },
        orderBy: { name: 'asc' }
      });

      const roomSummaries = updatedRooms.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        area: r.area,
        lightingPoints: r.lightingPoints,
        socketPoints: r.socketPoints,
        dataPoints: r.dataPoints,
        cctvPoints: r.cctvPoints,
        wifiPoints: r.wifiPoints,
        accessPoints: r.accessPoints,
        bmsSensors: r.bmsSensors,
        formula: `N = (E × A) / (Φ × UF × MF) | E=${r.luxTarget}lux, A=${r.area}m²`,
        confidenceLevel: r.calculations[0]?.confidenceLevel ?? 'HIGH',
        warnings: JSON.parse((r.calculations[0]?.warningsJson as string) ?? '[]'),
        engineerReviewRequired: r.type === 'Server Room' || r.luxTarget > 450
      }));

      const warnings = roomSummaries.flatMap(r => r.warnings as string[]);

      return sendSuccess(res, {
        roomsCount: rooms.length,
        rooms: roomSummaries,
        warnings,
        engineerReviewRequired: warnings.length > 0
      }, 'Design calculations compiled successfully for all rooms');
    } catch (error) {
      next(error);
    }
  };

  public static generateBOQ = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const rooms = await prisma.room.findMany({ where: { projectId } });
      if (rooms.length === 0) {
        throw new Error('No rooms found. Run generate-design before compiling the BOQ.');
      }

      // Generate BOQ Items via service compiler
      const compiledItems = BoqGenerationService.compile(rooms);

      // Clear old BOQ items
      await prisma.bOQItem.deleteMany({ where: { projectId } });

      // Save to database
      for (const item of compiledItems) {
        await prisma.bOQItem.create({
          data: {
            projectId,
            category: item.category,
            itemCode: item.itemCode,
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unitRate: item.unitRate,
            total: item.total,
            confidenceLevel: item.confidenceLevel,
            notes: item.notes
          }
        });
      }

      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.BOQ_READY }
      });

      const boqItems = await prisma.bOQItem.findMany({
        where: { projectId },
        orderBy: { itemCode: 'asc' }
      });
      const totalAmount = boqItems.reduce((acc, b) => acc + Number(b.total), 0);

      return sendSuccess(res, {
        itemsCount: boqItems.length,
        boqItems,
        totalAmount
      }, 'BOQ compiled and updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public static getBOQ = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const boqItems = await prisma.bOQItem.findMany({
        where: { projectId },
        orderBy: { itemCode: 'asc' }
      });

      return sendSuccess(res, { boqItems }, 'BOQ items list retrieved');
    } catch (error) {
      next(error);
    }
  };

  public static generateReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const reportData = await AIReportService.generate(projectId);

      const report = await prisma.report.create({
        data: {
          projectId,
          title: reportData.projectSpecs.name + ' Concept Estimate Report',
          type: 'AI_CONCEPT_DOCUMENT',
          contentJson: JSON.stringify(reportData)
        }
      });

      return sendSuccess(res, { report }, 'Concept engineering report generated successfully');
    } catch (error) {
      next(error);
    }
  };

  public static getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const reports = await prisma.report.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });

      return sendSuccess(res, { reports }, 'Reports list retrieved');
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // AI PROJECT BRAIN CHAT
  // ----------------------------------------------------

  public static chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const { question, conversationId } = req.body;

      await this.checkProjectAccess(projectId, req.user.companyId);

      if (!question) throw new Error('Query question parameter is required');

      let activeConvId = conversationId;
      if (!activeConvId) {
        const conv = await prisma.aIConversation.create({
          data: {
            projectId,
            title: question.substring(0, 40) + '...'
          }
        });
        activeConvId = conv.id;
      }

      // 1. Save user query message
      await prisma.aIMessage.create({
        data: {
          conversationId: activeConvId,
          role: 'user',
          content: question,
          userId: req.user.id
        }
      });

      // 2. Query simulated RAG system
      const reply = await RagService.query(projectId, question);

      // 3. Save assistant reply
      const replyMessage = await prisma.aIMessage.create({
        data: {
          conversationId: activeConvId,
          role: 'assistant',
          content: reply
        }
      });

      return sendSuccess(res, { 
        answer: reply,
        message: replyMessage, 
        conversationId: activeConvId 
      }, 'AI reply received');
    } catch (error) {
      next(error);
    }
  };

  public static getConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const conversations = await prisma.aIConversation.findMany({
        where: { projectId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return sendSuccess(res, { conversations }, 'AI conversations retrieved');
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // SITE VALIDATION
  // ----------------------------------------------------

  public static uploadSitePhoto = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const { roomName, systemType } = req.body;
      await this.checkProjectAccess(projectId, req.user.companyId);

      if (!req.file) {
        throw new Error('Image file is missing in upload multipart request');
      }

      const photoUrl = `/uploads/${req.file.filename}`;

      // Create site photo record
      const sitePhoto = await prisma.sitePhoto.create({
        data: {
          projectId,
          uploadedById: req.user.id,
          photoUrl,
          roomName,
          systemType: systemType as SystemCategory
        }
      });

      // Run inspection simulation
      const mockFindings = VisionInspectionService.inspect(systemType as SystemCategory, roomName);
      
      for (const finding of mockFindings) {
        await prisma.inspectionFinding.create({
          data: {
            photoId: sitePhoto.id,
            category: finding.category,
            description: finding.description,
            severity: finding.severity,
            status: 'Open'
          }
        });
      }

      const completePhoto = await prisma.sitePhoto.findUnique({
        where: { id: sitePhoto.id },
        include: { findings: true }
      });

      return sendSuccess(res, { sitePhoto: completePhoto }, 'Site photo uploaded and inspected by Vision Agent');
    } catch (error) {
      next(error);
    }
  };

  public static getSitePhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const sitePhotos = await prisma.sitePhoto.findMany({
        where: { projectId },
        include: { findings: true },
        orderBy: { uploadedAt: 'desc' }
      });

      return sendSuccess(res, { sitePhotos }, 'Site validation photos retrieved');
    } catch (error) {
      next(error);
    }
  };

  public static runInspection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;

      const sitePhoto = await prisma.sitePhoto.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!sitePhoto) throw new NotFoundError('Site photo not found');
      await this.checkProjectAccess(sitePhoto.projectId, req.user.companyId);

      // Re-run inspection simulation (delete old findings, create new)
      await prisma.inspectionFinding.deleteMany({ where: { photoId: id } });

      const mockFindings = VisionInspectionService.inspect(sitePhoto.systemType, sitePhoto.roomName);
      for (const finding of mockFindings) {
        await prisma.inspectionFinding.create({
          data: {
            photoId: id,
            category: finding.category,
            description: finding.description,
            severity: finding.severity,
            status: 'Open'
          }
        });
      }

      const updatedPhoto = await prisma.sitePhoto.findUnique({
        where: { id },
        include: { findings: true }
      });

      return sendSuccess(res, { sitePhoto: updatedPhoto }, 'Vision inspection re-run completed');
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // VARIATION CLAIMS
  // ----------------------------------------------------

  public static getClaims = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const claims = await prisma.variationClaim.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' }
      });

      return sendSuccess(res, { claims }, 'Variation claims retrieved');
    } catch (error) {
      next(error);
    }
  };

  public static createClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const { title, description, estimatedValue } = req.body;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const claimLetter = `Dear Consultant,\n\nWe submit variation claim for "${title}". Sized and calculated to comply with the project standards.\n\nDescription: ${description}\nEstimated Valuation: QAR ${Number(estimatedValue).toLocaleString()}\n\nBest Regards,\nSAQR AI Claim Agent`;

      const claim = await prisma.variationClaim.create({
        data: {
          projectId,
          title,
          description,
          estimatedValue: parseFloat(estimatedValue || '0'),
          status: 'Draft',
          claimLetter
        }
      });

      return sendSuccess(res, { claim }, 'Variation claim created successfully');
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // FACILITY DIGITAL TWIN
  // ----------------------------------------------------

  public static getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const assets = await prisma.asset.findMany({
        where: { projectId },
        include: { warranty: true, maintenanceSchedule: true },
        orderBy: { createdAt: 'desc' }
      });

      return sendSuccess(res, { assets }, 'Digital twin assets retrieved');
    } catch (error) {
      next(error);
    }
  };

  public static createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const { name, modelNumber, serialNumber, systemCategory, location, qrCode, warrantyProvider, warrantyDurationMonths, maintenanceTask, maintenanceFrequency } = req.body;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const asset = await prisma.asset.create({
        data: {
          projectId,
          name,
          modelNumber,
          serialNumber,
          systemCategory: systemCategory as SystemCategory,
          location,
          qrCode: qrCode || `QR-${name.toUpperCase().substring(0, 3)}-${Date.now()}`
        }
      });

      if (warrantyProvider && warrantyDurationMonths) {
        await prisma.warranty.create({
          data: {
            assetId: asset.id,
            startDate: new Date(),
            durationMonths: parseInt(warrantyDurationMonths, 10),
            provider: warrantyProvider
          }
        });
      }

      if (maintenanceTask && maintenanceFrequency) {
        await prisma.maintenanceSchedule.create({
          data: {
            assetId: asset.id,
            taskName: maintenanceTask,
            frequency: maintenanceFrequency,
            nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
          }
        });
      }

      const completeAsset = await prisma.asset.findUnique({
        where: { id: asset.id },
        include: { warranty: true, maintenanceSchedule: true }
      });

      return sendSuccess(res, { asset: completeAsset }, 'Twin asset registered in system databases');
    } catch (error) {
      next(error);
    }
  };

  // ----------------------------------------------------
  // DOCUMENT INGESTION
  // ----------------------------------------------------

  public static uploadProjectFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      const { category, notes } = req.body;
      await this.checkProjectAccess(projectId, req.user.companyId);

      if (!req.file) {
        throw new Error('Upload file parameter is missing');
      }

      // 1. Create file record
      const projectFile = await prisma.projectFile.create({
        data: {
          projectId,
          uploadedById: req.user.id,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
          storagePath: `/uploads/${req.file.filename}`,
          category: (category as FileCategory) || FileCategory.OTHER,
          notes: notes || null
        }
      });

      // 2. Perform ingestion processing
      const ingested = DocumentIngestionService.ingest(req.file.filename, req.file.originalname);
      const embedded = EmbeddingService.generateMockVector(ingested.text);

      // 3. Update processing results
      const updatedFile = await prisma.projectFile.update({
        where: { id: projectFile.id },
        data: {
          processingStatus: ingested.status,
          extractedText: ingested.text,
          embeddingStatus: embedded.embeddingStatus,
          notes: ingested.notes
        }
      });

      return sendSuccess(res, { projectFile: updatedFile }, 'Document uploaded and ingested successfully');
    } catch (error) {
      next(error);
    }
  };

  public static getProjectFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const files = await prisma.projectFile.findMany({
        where: { projectId },
        orderBy: { uploadedAt: 'desc' }
      });

      return sendSuccess(res, { files }, 'Project files retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public static deleteProjectFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;

      const file = await prisma.projectFile.findUnique({
        where: { id },
        include: { project: true }
      });

      if (!file) throw new NotFoundError('Project file not found');
      await this.checkProjectAccess(file.projectId, req.user.companyId);

      // Delete database record
      await prisma.projectFile.delete({ where: { id } });

      const localPath = path.join(__dirname, '../../../uploads', file.fileName);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }

      return sendSuccess(res, null, 'Project file deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
