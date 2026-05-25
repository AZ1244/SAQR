import { Confidence } from '@prisma/client';

export interface ElvCalcInput {
  roomType: string;
  area: number;
  occupancy?: number;
}

export interface ElvCalcResult {
  dataPoints: number;
  wifiPoints: number;
  cctvPoints: number;
  accessPoints: number;
  bmsSensors: number;
  rackRequired: boolean;
  notes: string;
  confidenceLevel: Confidence;
  warnings: string[];
}

export class ElvEngineeringService {
  public static calculate(input: ElvCalcInput): ElvCalcResult {
    const warnings: string[] = [];
    const roomType = input.roomType.trim();
    const area = input.area || 10;
    const occupancy = input.occupancy || 1;

    let dataPoints = 0;
    let wifiPoints = 0;
    let cctvPoints = 0;
    let accessPoints = 0;
    let bmsSensors = 0;
    let rackRequired = false;
    let notes = 'Standard network points layout.';

    if (roomType === 'Open Office') {
      const workstationCount = Math.max(occupancy, Math.ceil(area / 8));
      dataPoints = workstationCount * 2; // Dual drops per desk
      wifiPoints = Math.ceil(area / 150); // Coverage density
      cctvPoints = Math.max(2, Math.ceil(area / 200)); // Corner coverage
      notes = `Includes structured network drops for ${workstationCount} desks + Wi-Fi coverage.`;
    } else if (roomType === 'Server Room') {
      dataPoints = 24; // patch panel backbone links
      cctvPoints = 1;
      accessPoints = 1; // Secure entry lock
      bmsSensors = 2; // Temperature + flood detection
      rackRequired = true;
      notes = 'Main Distribution Frame (MDF) rack location with active environmental sensors.';
    } else if (roomType === 'Meeting Room') {
      dataPoints = 4; // Table floor box + screen drop
      wifiPoints = 1; // Dedicated meeting AP
      notes = 'Includes AV and Telepresence integration drop points.';
    } else if (roomType === 'Reception') {
      dataPoints = 4;
      cctvPoints = 1;
      accessPoints = 1;
      notes = 'Reception desk network drop and main office entry door control.';
    } else if (roomType === 'Corridor') {
      cctvPoints = Math.max(1, Math.ceil(area / 50)); // Security pathing
      wifiPoints = Math.max(1, Math.ceil(area / 100));
      notes = 'Wayfinding CCTV security and corridor Wi-Fi handoff coverage.';
    } else if (roomType === 'Manager Office') {
      dataPoints = 4; // Desk + visitor drops
      notes = 'Executive desk network drops.';
    } else {
      dataPoints = 2;
    }

    if (roomType === 'Server Room' && dataPoints < 12) {
      warnings.push('Low patch capacity estimated for server room backbone cabling. Verify count.');
    }

    return {
      dataPoints,
      wifiPoints,
      cctvPoints,
      accessPoints,
      bmsSensors,
      rackRequired,
      notes,
      confidenceLevel: warnings.length > 0 ? Confidence.MEDIUM : Confidence.HIGH,
      warnings,
    };
  }
}
