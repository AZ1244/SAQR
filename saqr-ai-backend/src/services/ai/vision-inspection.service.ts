import { SystemCategory } from '@prisma/client';

export interface InspectionFindingMock {
  category: string;
  description: string;
  status: string;
  severity: 'CRITICAL' | 'MODERATE' | 'INFO';
}

export class VisionInspectionService {
  public static inspect(systemType: SystemCategory | null, roomName: string | null): InspectionFindingMock[] {
    const findings: InspectionFindingMock[] = [];

    const normType = systemType || SystemCategory.OTHER;
    const room = roomName || 'General';

    if (normType === SystemCategory.POWER) {
      findings.push({
        category: 'Conduit installation validation',
        description: `Bending radius of flexible PVC conduit entering distribution boards in ${room} is lower than 6x diameter. Re-route required.`,
        status: 'Open',
        severity: 'MODERATE'
      });
      findings.push({
        category: 'GFI safety compliance',
        description: 'IP44 waterproof socket outlets lack correct insulation barriers near wet outlets.',
        status: 'Open',
        severity: 'CRITICAL'
      });
    } else if (normType === SystemCategory.LIGHTING) {
      findings.push({
        category: 'Fixture alignment check',
        description: `Visual line deviation detected on 60x60 ceiling grid panels in ${room}. Alignment should be within 2mm.`,
        status: 'Open',
        severity: 'INFO'
      });
    } else if (normType === SystemCategory.DATA || normType === SystemCategory.CCTV) {
      findings.push({
        category: 'Cabling Labeling compliance',
        description: `Unlabeled Cat6 data drops discovered inside cabinet in ${room}. Outlets must match patch panel schedule codes.`,
        status: 'Open',
        severity: 'MODERATE'
      });
    } else {
      findings.push({
        category: 'Containment installation',
        description: 'Galvanised iron cable tray lacks copper earthing link bridging across section joints.',
        status: 'Open',
        severity: 'MODERATE'
      });
    }

    return findings;
  }
}
