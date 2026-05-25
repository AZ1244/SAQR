import { Confidence } from '@prisma/client';

export interface PowerCalcInput {
  roomType: string;
  area: number;
  occupancy?: number;
}

export interface PowerCalcResult {
  socketCount: number;
  dedicatedCircuits: number;
  estimatedLoadKw: number;
  upsRequired: boolean;
  notes: string;
  confidenceLevel: Confidence;
  warnings: string[];
}

export class PowerEngineeringService {
  public static calculate(input: PowerCalcInput): PowerCalcResult {
    const warnings: string[] = [];
    const roomType = input.roomType.trim();
    const area = input.area || 10;
    const occupancy = input.occupancy || 1;

    let socketCount = 2;
    let dedicatedCircuits = 0;
    let estimatedLoadKw = 0.5;
    let upsRequired = false;
    let notes = 'Standard general purpose circuits.';

    if (roomType === 'Open Office') {
      // Workstations + peripheral service sockets
      const workstationCount = Math.max(occupancy, Math.ceil(area / 8));
      socketCount = (workstationCount * 2) + Math.ceil(area / 50);
      estimatedLoadKw = (workstationCount * 0.3) + (area * 0.05); // 300W per workstation + service load
      notes = `Includes dedicated dual-outlets for ${workstationCount} workstations.`;
    } else if (roomType === 'Server Room') {
      socketCount = 8;
      dedicatedCircuits = 4; // Dual power feeds + cooling + UPS
      estimatedLoadKw = 25.0; // Server stack + specialized Precision A/C units
      upsRequired = true;
      notes = 'Mission-critical design with dual rack feeds, precision HVAC, and online UPS backup.';
    } else if (roomType === 'Meeting Room') {
      socketCount = Math.max(6, Math.ceil(area / 6) * 2);
      dedicatedCircuits = 1; // Dedicated A/V table floor box
      estimatedLoadKw = 2.5;
      notes = 'A/V floor-box supply + perimeter utility outlets.';
    } else if (roomType === 'Pantry') {
      socketCount = 8;
      dedicatedCircuits = 3; // Microwave, Fridge, Dishwasher
      estimatedLoadKw = 8.5;
      notes = 'Includes high-current circuits for pantry appliances.';
    } else if (roomType === 'Reception') {
      socketCount = 6;
      estimatedLoadKw = 1.5;
      notes = 'Desk power + display screen feeds.';
    } else if (roomType === 'Corridor') {
      socketCount = Math.max(2, Math.ceil(area / 50));
      estimatedLoadKw = 1.0;
      notes = 'Service outlets for cleaning equipment.';
    } else if (roomType === 'Washroom') {
      socketCount = 2; // GFI outlets near vanity mirror
      estimatedLoadKw = 0.5;
      notes = 'IP44 rated waterproof socket outlets only.';
    } else {
      socketCount = Math.max(2, Math.ceil(area / 30) * 2);
      estimatedLoadKw = area * 0.05;
    }

    if (estimatedLoadKw > 15.0 && !upsRequired && roomType !== 'Server Room') {
      warnings.push(`High load density (${estimatedLoadKw} kW) detected. Verify if backup power distribution is necessary.`);
    }

    return {
      socketCount,
      dedicatedCircuits,
      estimatedLoadKw: parseFloat(estimatedLoadKw.toFixed(2)),
      upsRequired,
      notes,
      confidenceLevel: warnings.length > 0 ? Confidence.MEDIUM : Confidence.HIGH,
      warnings,
    };
  }
}
