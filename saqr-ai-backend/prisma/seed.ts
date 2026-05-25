import { PrismaClient, Role, DesignLevel, SystemCategory, Confidence, ProjectStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SAQR AI Database...');

  // Clean all
  await prisma.auditLog.deleteMany({});
  await prisma.maintenanceSchedule.deleteMany({});
  await prisma.warranty.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.inspectionFinding.deleteMany({});
  await prisma.sitePhoto.deleteMany({});
  await prisma.variationClaim.deleteMany({});
  await prisma.bOQItem.deleteMany({});
  await prisma.eLVRequirement.deleteMany({});
  await prisma.powerRequirement.deleteMany({});
  await prisma.lightingCalculation.deleteMany({});
  await prisma.designRequirement.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.aIMessage.deleteMany({});
  await prisma.aIConversation.deleteMany({});
  await prisma.projectFile.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.engineeringTemplate.deleteMany({});

  const company = await prisma.company.create({
    data: { name: 'SAQR AI Solutions / Isterlab Demo', country: 'Qatar', logoUrl: 'https://saqr.ai/logo.png' },
  });

  const passwordHash = await bcrypt.hash('Demo123456', 10);
  const user = await prisma.user.create({
    data: { email: 'demo@saqr.ai', name: 'Demo Engineer', passwordHash, role: Role.COMPANY_ADMIN, companyId: company.id },
  });

  const workspace = await prisma.workspace.create({
    data: { name: 'Qatar Pilot Projects', companyId: company.id },
  });

  // ─── PROJECT 1: Doha Smart Office ──────────────────────────────────────────
  const p1 = await prisma.project.create({
    data: {
      name: 'Doha Smart Office Fit-Out',
      client: 'Confidential Corporate Client',
      country: 'Qatar', city: 'Doha', location: 'Lusail Marina, Tower A',
      projectType: 'Office', areaSqm: 1000, ceilingHeight: 3.0,
      designLevel: DesignLevel.PREMIUM, status: ProjectStatus.BOQ_READY,
      workspaceId: workspace.id, createdById: user.id,
    },
  });

  const p1Rooms = [
    { name: 'Open Office Zone A', type: 'Open Office', area: 250, ceilingHeight: 3.0, occupancy: 25, luxTarget: 450, lightingPoints: 24, socketPoints: 50, dataPoints: 50, cctvPoints: 3, wifiPoints: 3, accessPoints: 0, bmsSensors: 2, notes: 'Main workstation area' },
    { name: 'Open Office Zone B', type: 'Open Office', area: 180, ceilingHeight: 3.0, occupancy: 18, luxTarget: 450, lightingPoints: 17, socketPoints: 36, dataPoints: 36, cctvPoints: 2, wifiPoints: 2, accessPoints: 0, bmsSensors: 1, notes: 'Secondary workstation zone' },
    { name: 'Meeting Room A', type: 'Meeting Room', area: 35, ceilingHeight: 3.0, occupancy: 10, luxTarget: 400, lightingPoints: 6, socketPoints: 8, dataPoints: 6, cctvPoints: 1, wifiPoints: 1, accessPoints: 1, bmsSensors: 1, notes: 'Board-level meeting room' },
    { name: 'Meeting Room B', type: 'Meeting Room', area: 25, ceilingHeight: 3.0, occupancy: 8, luxTarget: 400, lightingPoints: 4, socketPoints: 6, dataPoints: 4, cctvPoints: 1, wifiPoints: 1, accessPoints: 1, bmsSensors: 1, notes: 'Small team meeting room' },
    { name: 'Server Room', type: 'Server Room', area: 20, ceilingHeight: 2.8, occupancy: 2, luxTarget: 400, lightingPoints: 4, socketPoints: 8, dataPoints: 12, cctvPoints: 2, wifiPoints: 0, accessPoints: 1, bmsSensors: 3, notes: 'Critical IT infrastructure room' },
    { name: 'Reception', type: 'Reception', area: 60, ceilingHeight: 3.5, occupancy: 4, luxTarget: 350, lightingPoints: 10, socketPoints: 8, dataPoints: 6, cctvPoints: 2, wifiPoints: 1, accessPoints: 1, bmsSensors: 1, notes: 'Client-facing entrance area' },
    { name: 'Manager Office', type: 'Manager Room', area: 30, ceilingHeight: 3.0, occupancy: 3, luxTarget: 450, lightingPoints: 5, socketPoints: 6, dataPoints: 4, cctvPoints: 1, wifiPoints: 1, accessPoints: 1, bmsSensors: 1, notes: 'Senior management office' },
    { name: 'Pantry', type: 'Pantry', area: 25, ceilingHeight: 2.8, occupancy: 6, luxTarget: 250, lightingPoints: 4, socketPoints: 10, dataPoints: 2, cctvPoints: 1, wifiPoints: 1, accessPoints: 0, bmsSensors: 0, notes: 'Staff kitchen area' },
    { name: 'Prayer Room', type: 'Prayer Room', area: 20, ceilingHeight: 3.0, occupancy: 10, luxTarget: 250, lightingPoints: 3, socketPoints: 2, dataPoints: 0, cctvPoints: 0, wifiPoints: 1, accessPoints: 0, bmsSensors: 0, notes: 'Staff prayer/wellness room' },
    { name: 'Corridor Main', type: 'Corridor', area: 180, ceilingHeight: 3.0, occupancy: 0, luxTarget: 120, lightingPoints: 14, socketPoints: 4, dataPoints: 2, cctvPoints: 4, wifiPoints: 2, accessPoints: 0, bmsSensors: 0, notes: 'Main circulation corridor' },
    { name: 'Storage Room', type: 'Storage', area: 15, ceilingHeight: 2.8, occupancy: 1, luxTarget: 150, lightingPoints: 2, socketPoints: 2, dataPoints: 0, cctvPoints: 1, wifiPoints: 0, accessPoints: 1, bmsSensors: 0, notes: 'Stationery and equipment storage' },
    { name: 'Washrooms', type: 'Washroom', area: 35, ceilingHeight: 2.8, occupancy: 0, luxTarget: 150, lightingPoints: 6, socketPoints: 2, dataPoints: 0, cctvPoints: 0, wifiPoints: 0, accessPoints: 0, bmsSensors: 0, notes: 'Male and female WC facilities' },
  ];

  for (const r of p1Rooms) {
    await prisma.room.create({ data: { projectId: p1.id, ...r } });
  }

  const p1BoqItems = [
    { category: SystemCategory.LIGHTING, itemCode: 'EL-LT-001', description: '60x60 LED Panel Fixture 36W 4000K Dimmable', unit: 'Pcs', quantity: 99, unitRate: 280, total: 27720, confidenceLevel: Confidence.HIGH, notes: 'Calculated from room lux targets' },
    { category: SystemCategory.LIGHTING, itemCode: 'EL-LT-002', description: '3W Emergency Exit Sign Luminaire self-contained battery', unit: 'Pcs', quantity: 17, unitRate: 150, total: 2550, confidenceLevel: Confidence.MEDIUM, notes: 'Qatar Civil Defense spacing rules' },
    { category: SystemCategory.LIGHTING, itemCode: 'EL-LT-003', description: '1-Gang 2-Way Lighting Control Switch gold plate', unit: 'Pcs', quantity: 25, unitRate: 65, total: 1625, confidenceLevel: Confidence.HIGH, notes: 'Switch loop estimate' },
    { category: SystemCategory.POWER, itemCode: 'EL-PW-001', description: '13A Double Switched Socket Outlet gold faceplate', unit: 'Pcs', quantity: 142, unitRate: 85, total: 12070, confidenceLevel: Confidence.HIGH, notes: 'Outlet count from design' },
    { category: SystemCategory.POWER, itemCode: 'EL-PW-002', description: 'Dedicated Appliance Circuit 4mm2 in 25mm conduit', unit: 'Runs', quantity: 7, unitRate: 450, total: 3150, confidenceLevel: Confidence.HIGH, notes: 'Server Room and Pantry feeds' },
    { category: SystemCategory.DATA, itemCode: 'ELV-DT-001', description: 'Cat6 U/UTP LSZH data cable run terminated on faceplate', unit: 'Runs', quantity: 122, unitRate: 350, total: 42700, confidenceLevel: Confidence.HIGH, notes: 'Structured copper runs' },
    { category: SystemCategory.CCTV, itemCode: 'ELV-CC-001', description: 'IP Dome Camera 4MP IR QCDD approved', unit: 'Pcs', quantity: 18, unitRate: 650, total: 11700, confidenceLevel: Confidence.HIGH, notes: 'Security visual coverage' },
    { category: SystemCategory.WIFI, itemCode: 'ELV-WF-001', description: 'Wi-Fi 6 Access Point ceiling mounted enterprise', unit: 'Pcs', quantity: 13, unitRate: 950, total: 12350, confidenceLevel: Confidence.HIGH, notes: 'Wireless workspace access' },
    { category: SystemCategory.ACCESS_CONTROL, itemCode: 'ELV-AC-001', description: 'Access Control RFID Reader + Magnetic Lock Set', unit: 'Set', quantity: 6, unitRate: 3800, total: 22800, confidenceLevel: Confidence.HIGH, notes: 'Door secure reader kits' },
  ];

  for (const b of p1BoqItems) {
    await prisma.bOQItem.create({ data: { projectId: p1.id, ...b } });
  }

  const p1Photo = await prisma.sitePhoto.create({
    data: {
      projectId: p1.id, roomName: 'Server Room', systemType: SystemCategory.CCTV,
      photoUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',

    },
  });
  await prisma.inspectionFinding.create({
    data: { photoId: p1Photo.id, category: 'Compliance', description: 'Cable trays aligned with MEP layout drawings.', severity: 'NONE', status: 'Resolved' },
  });

  await prisma.variationClaim.create({
    data: { projectId: p1.id, title: 'Additional CCTV Coverage in Lobby', description: 'Client requested 2 extra cameras after design freeze.', estimatedValue: 4200, status: 'PENDING' },
  });

  const p1Asset = await prisma.asset.create({
    data: { projectId: p1.id, name: '42U Server Rack Cabinet', modelNumber: 'SR-42U-GL', systemCategory: SystemCategory.SERVER_ROOM, location: 'Server Room', qrCode: 'SAQR-ASSET-SR-001' },
  });
  await prisma.warranty.create({
    data: { assetId: p1Asset.id, provider: 'RackTech Gulf', startDate: new Date('2026-05-01'), durationMonths: 36 },
  });

  console.log(`✓ Project 1: ${p1.name}`);

  // ─── PROJECT 2: Lusail Clinic ELV Upgrade ──────────────────────────────────
  const p2 = await prisma.project.create({
    data: {
      name: 'Lusail Clinic ELV Upgrade',
      client: 'Gulf Medical Holdings WLL',
      country: 'Qatar', city: 'Lusail', location: 'Lusail City, Block 12',
      projectType: 'Healthcare', areaSqm: 450, ceilingHeight: 2.8,
      designLevel: DesignLevel.STANDARD, status: ProjectStatus.DESIGN_IN_PROGRESS,
      workspaceId: workspace.id, createdById: user.id,
    },
  });

  const p2Rooms = [
    { name: 'GP Consultation Room 1', type: 'Meeting Room', area: 18, ceilingHeight: 2.8, occupancy: 3, luxTarget: 500, lightingPoints: 4, socketPoints: 8, dataPoints: 4, cctvPoints: 0, wifiPoints: 1, accessPoints: 1, bmsSensors: 1, notes: 'General practitioner room' },
    { name: 'GP Consultation Room 2', type: 'Meeting Room', area: 18, ceilingHeight: 2.8, occupancy: 3, luxTarget: 500, lightingPoints: 4, socketPoints: 8, dataPoints: 4, cctvPoints: 0, wifiPoints: 1, accessPoints: 1, bmsSensors: 1, notes: 'GP consultation' },
    { name: 'Waiting Area', type: 'Reception', area: 80, ceilingHeight: 3.0, occupancy: 20, luxTarget: 300, lightingPoints: 12, socketPoints: 10, dataPoints: 4, cctvPoints: 3, wifiPoints: 2, accessPoints: 0, bmsSensors: 1, notes: 'Patient waiting zone' },
    { name: 'Nurses Station', type: 'Open Office', area: 25, ceilingHeight: 2.8, occupancy: 4, luxTarget: 450, lightingPoints: 5, socketPoints: 10, dataPoints: 8, cctvPoints: 1, wifiPoints: 1, accessPoints: 1, bmsSensors: 1, notes: 'Clinical admin hub' },
    { name: 'Pharmacy', type: 'Storage', area: 30, ceilingHeight: 2.8, occupancy: 3, luxTarget: 400, lightingPoints: 6, socketPoints: 6, dataPoints: 4, cctvPoints: 2, wifiPoints: 1, accessPoints: 1, bmsSensors: 0, notes: 'Dispensary and cold storage' },
    { name: 'IT/Data Closet', type: 'Server Room', area: 8, ceilingHeight: 2.5, occupancy: 1, luxTarget: 400, lightingPoints: 2, socketPoints: 4, dataPoints: 8, cctvPoints: 1, wifiPoints: 0, accessPoints: 1, bmsSensors: 2, notes: 'Telecom data closet with patch panel' },
    { name: 'Main Corridor', type: 'Corridor', area: 120, ceilingHeight: 2.8, occupancy: 0, luxTarget: 150, lightingPoints: 10, socketPoints: 4, dataPoints: 0, cctvPoints: 3, wifiPoints: 2, accessPoints: 0, bmsSensors: 0, notes: 'Clinical circulation corridor' },
    { name: 'Washrooms', type: 'Washroom', area: 20, ceilingHeight: 2.5, occupancy: 0, luxTarget: 150, lightingPoints: 4, socketPoints: 2, dataPoints: 0, cctvPoints: 0, wifiPoints: 0, accessPoints: 0, bmsSensors: 0, notes: 'Patient and staff WC' },
  ];

  for (const r of p2Rooms) {
    await prisma.room.create({ data: { projectId: p2.id, ...r } });
  }

  await prisma.bOQItem.createMany({
    data: [
      { projectId: p2.id, category: SystemCategory.LIGHTING, itemCode: 'EL-LT-001', description: 'LED Panel 600x600 36W 4000K', unit: 'Pcs', quantity: 47, unitRate: 280, total: 13160, confidenceLevel: Confidence.HIGH, notes: '' },
      { projectId: p2.id, category: SystemCategory.DATA, itemCode: 'ELV-DT-001', description: 'Cat6 data cable run LSZH', unit: 'Runs', quantity: 32, unitRate: 350, total: 11200, confidenceLevel: Confidence.HIGH, notes: '' },
      { projectId: p2.id, category: SystemCategory.CCTV, itemCode: 'ELV-CC-001', description: 'IP Dome Camera 4MP IR', unit: 'Pcs', quantity: 10, unitRate: 650, total: 6500, confidenceLevel: Confidence.HIGH, notes: '' },
      { projectId: p2.id, category: SystemCategory.ACCESS_CONTROL, itemCode: 'ELV-AC-001', description: 'RFID Reader + Magnetic Lock Set', unit: 'Set', quantity: 5, unitRate: 3800, total: 19000, confidenceLevel: Confidence.HIGH, notes: '' },
    ],
  });

  await prisma.variationClaim.create({
    data: { projectId: p2.id, title: 'Nurse Call System Addition', description: 'Client added nurse call buttons post-scope.', estimatedValue: 8500, status: 'APPROVED' },
  });
  await prisma.variationClaim.create({
    data: { projectId: p2.id, title: 'IPTV Point in Waiting Area', description: '3x IPTV outlets requested after design sign-off.', estimatedValue: 1800, status: 'PENDING' },
  });

  const p2Photo = await prisma.sitePhoto.create({
    data: {
      projectId: p2.id, roomName: 'Main Corridor', systemType: SystemCategory.CCTV,
      photoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',

    },
  });
  await prisma.inspectionFinding.create({
    data: { photoId: p2Photo.id, category: 'Anomaly', description: 'CCTV camera mounting height 2.4m — verify coverage angle.', severity: 'MODERATE', status: 'Open' },
  });

  console.log(`✓ Project 2: ${p2.name}`);

  // ─── PROJECT 3: West Bay Data Room Fit-Out ─────────────────────────────────
  const p3 = await prisma.project.create({
    data: {
      name: 'West Bay Data Room Fit-Out',
      client: 'Qatar Financial Hub Authority',
      country: 'Qatar', city: 'West Bay', location: 'QFC Tower, Floor 22',
      projectType: 'Data Center', areaSqm: 120, ceilingHeight: 3.5,
      designLevel: DesignLevel.MISSION_CRITICAL, status: ProjectStatus.DRAFT,
      workspaceId: workspace.id, createdById: user.id,
    },
  });

  const p3Rooms = [
    { name: 'Main Data Hall', type: 'Server Room', area: 60, ceilingHeight: 3.5, occupancy: 4, luxTarget: 500, lightingPoints: 12, socketPoints: 16, dataPoints: 48, cctvPoints: 4, wifiPoints: 0, accessPoints: 2, bmsSensors: 8, notes: 'Primary server cage area — Tier III design' },
    { name: 'UPS Room', type: 'Server Room', area: 20, ceilingHeight: 3.5, occupancy: 2, luxTarget: 400, lightingPoints: 4, socketPoints: 8, dataPoints: 4, cctvPoints: 2, wifiPoints: 0, accessPoints: 1, bmsSensors: 4, notes: 'N+1 UPS battery room' },
    { name: 'Operations NOC', type: 'Open Office', area: 25, ceilingHeight: 3.0, occupancy: 6, luxTarget: 450, lightingPoints: 5, socketPoints: 12, dataPoints: 12, cctvPoints: 2, wifiPoints: 1, accessPoints: 1, bmsSensors: 2, notes: 'Network Operations Center' },
    { name: 'Airlock / Security Lobby', type: 'Corridor', area: 15, ceilingHeight: 3.0, occupancy: 2, luxTarget: 300, lightingPoints: 3, socketPoints: 2, dataPoints: 2, cctvPoints: 4, wifiPoints: 0, accessPoints: 2, bmsSensors: 1, notes: 'Mantrap dual-access entry' },
  ];

  for (const r of p3Rooms) {
    await prisma.room.create({ data: { projectId: p3.id, ...r } });
  }

  await prisma.bOQItem.createMany({
    data: [
      { projectId: p3.id, category: SystemCategory.LIGHTING, itemCode: 'EL-LT-MC', description: 'High-bay LED 60W IP65 Data Hall rated', unit: 'Pcs', quantity: 24, unitRate: 650, total: 15600, confidenceLevel: Confidence.HIGH, notes: 'Mission critical rated fixtures' },
      { projectId: p3.id, category: SystemCategory.POWER, itemCode: 'EL-PW-UPS', description: '60kVA Online UPS N+1 configuration with 30min battery', unit: 'Set', quantity: 2, unitRate: 45000, total: 90000, confidenceLevel: Confidence.HIGH, notes: 'Dual UPS for redundancy' },
      { projectId: p3.id, category: SystemCategory.DATA, itemCode: 'ELV-DT-FO', description: 'OM4 Fiber Optic backbone cable per run', unit: 'Runs', quantity: 24, unitRate: 1200, total: 28800, confidenceLevel: Confidence.HIGH, notes: 'High-speed fiber backbone' },
      { projectId: p3.id, category: SystemCategory.ACCESS_CONTROL, itemCode: 'ELV-AC-MT', description: 'Biometric Mantrap Door Controller with anti-passback', unit: 'Set', quantity: 2, unitRate: 18000, total: 36000, confidenceLevel: Confidence.HIGH, notes: 'Dual-factor access for data hall' },
      { projectId: p3.id, category: SystemCategory.CCTV, itemCode: 'ELV-CC-4K', description: 'IP 4K CCTV Fisheye Camera with AI analytics', unit: 'Pcs', quantity: 12, unitRate: 2200, total: 26400, confidenceLevel: Confidence.HIGH, notes: '360-degree coverage' },
    ],
  });

  const p3Asset1 = await prisma.asset.create({
    data: { projectId: p3.id, name: '60kVA Online UPS Unit A', modelNumber: 'APC-SURT60KRMXLI', systemCategory: SystemCategory.POWER, location: 'UPS Room', qrCode: 'SAQR-ASSET-UPS-A' },
  });
  await prisma.warranty.create({
    data: { assetId: p3Asset1.id, provider: 'Schneider Electric Gulf', startDate: new Date('2026-04-01'), durationMonths: 60 },
  });
  await prisma.maintenanceSchedule.create({
    data: { assetId: p3Asset1.id, taskName: 'Battery health check and load test', frequency: 'Quarterly', nextDueDate: new Date('2026-08-01') },
  });

  await prisma.variationClaim.create({
    data: { projectId: p3.id, title: 'Extended Battery Runtime 60 min', description: 'Client upgraded from 30min to 60min UPS battery backup.', estimatedValue: 28000, status: 'APPROVED' },
  });

  const p3Photo = await prisma.sitePhoto.create({
    data: {
      projectId: p3.id, roomName: 'Main Data Hall', systemType: SystemCategory.POWER,
      photoUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',

    },
  });
  await prisma.inspectionFinding.create({
    data: { photoId: p3Photo.id, category: 'Critical Safety', description: 'Cable management tray needs grounding strap — critical non-conformance.', severity: 'CRITICAL', status: 'Open' },
  });

  console.log(`✓ Project 3: ${p3.name}`);
  console.log('✅ SAQR AI Database seeded successfully with 3 projects.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
