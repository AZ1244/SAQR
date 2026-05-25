import { SystemCategory, Confidence } from '@prisma/client';

export interface BOQGeneratorInputRoom {
  area: number;
  type: string;
  lightingPoints: number;
  socketPoints: number;
  dataPoints: number;
  cctvPoints: number;
  wifiPoints: number;
  accessPoints: number;
  bmsSensors: number;
}

export interface GeneratedBOQItem {
  category: SystemCategory;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  total: number;
  confidenceLevel: Confidence;
  notes: string;
}

export class BoqGenerationService {
  public static compile(rooms: BOQGeneratorInputRoom[]): GeneratedBOQItem[] {
    const items: GeneratedBOQItem[] = [];

    // Aggregates
    let totalArea = 0;
    let totalLightingPoints = 0;
    let totalSocketPoints = 0;
    let totalDedicatedCircuits = 0;
    let totalDataPoints = 0;
    let totalCctvPoints = 0;
    let totalWifiPoints = 0;
    let totalAccessPoints = 0;
    let totalBmsSensors = 0;
    let requiresUPS = false;
    let requiresRack = false;

    rooms.forEach((r) => {
      totalArea += r.area;
      totalLightingPoints += r.lightingPoints;
      totalSocketPoints += r.socketPoints;
      totalDataPoints += r.dataPoints;
      totalCctvPoints += r.cctvPoints;
      totalWifiPoints += r.wifiPoints;
      totalAccessPoints += r.accessPoints;
      totalBmsSensors += r.bmsSensors;

      if (r.type === 'Server Room') {
        requiresUPS = true;
        requiresRack = true;
        totalDedicatedCircuits += 4;
      } else if (r.type === 'Pantry') {
        totalDedicatedCircuits += 3;
      } else if (r.type === 'Meeting Room') {
        totalDedicatedCircuits += 1;
      }
    });

    // 1. LIGHTING
    if (totalLightingPoints > 0) {
      items.push({
        category: SystemCategory.LIGHTING,
        itemCode: 'EL-LT-001',
        description: '60x60 LED Panel Fixture, 36W, 4000K, Premium Dimmable',
        unit: 'Pcs',
        quantity: totalLightingPoints,
        unitRate: 280,
        total: totalLightingPoints * 280,
        confidenceLevel: Confidence.HIGH,
        notes: 'Calculated directly from room targets.',
      });

      const emergencyLights = Math.ceil(totalArea / 60);
      items.push({
        category: SystemCategory.LIGHTING,
        itemCode: 'EL-LT-002',
        description: '3W Emergency exit sign luminaire, self-contained battery pack',
        unit: 'Pcs',
        quantity: emergencyLights,
        unitRate: 150,
        total: emergencyLights * 150,
        confidenceLevel: Confidence.MEDIUM,
        notes: 'Based on standard Qatar Civil Defense exit spacing rules.',
      });

      const switches = Math.ceil(totalLightingPoints / 4);
      items.push({
        category: SystemCategory.LIGHTING,
        itemCode: 'EL-LT-003',
        description: '1-Gang 2-Way lighting control switch, premium gold plate',
        unit: 'Pcs',
        quantity: switches,
        unitRate: 65,
        total: switches * 65,
        confidenceLevel: Confidence.HIGH,
        notes: 'Estimated switch loops.',
      });
    }

    // 2. POWER
    if (totalSocketPoints > 0) {
      items.push({
        category: SystemCategory.POWER,
        itemCode: 'EL-PW-001',
        description: '13A Double Switched Socket Outlet, Gold finish faceplate',
        unit: 'Pcs',
        quantity: totalSocketPoints,
        unitRate: 85,
        total: totalSocketPoints * 85,
        confidenceLevel: Confidence.HIGH,
        notes: 'Outlets counted from design parameters.',
      });
    }

    if (totalDedicatedCircuits > 0) {
      items.push({
        category: SystemCategory.POWER,
        itemCode: 'EL-PW-002',
        description: 'Dedicated Appliance circuit supply 4mm2 cable in 25mm conduit',
        unit: 'Runs',
        quantity: totalDedicatedCircuits,
        unitRate: 450,
        total: totalDedicatedCircuits * 450,
        confidenceLevel: Confidence.HIGH,
        notes: 'Sized for Pantry appliances and Server Room feeds.',
      });
    }

    if (requiresUPS) {
      items.push({
        category: SystemCategory.UPS,
        itemCode: 'EL-PW-UPS',
        description: '15kVA Online UPS system with 30-min external battery cabinet',
        unit: 'Set',
        quantity: 1,
        unitRate: 15000,
        total: 15000,
        confidenceLevel: Confidence.HIGH,
        notes: 'Sized for Server Room infrastructure support.',
      });
    }

    // 3. DATA
    if (totalDataPoints > 0) {
      items.push({
        category: SystemCategory.DATA,
        itemCode: 'ELV-DT-001',
        description: 'Category 6 U/UTP LSZH data cable run terminated on faceplate',
        unit: 'Runs',
        quantity: totalDataPoints,
        unitRate: 350,
        total: totalDataPoints * 350,
        confidenceLevel: Confidence.HIGH,
        notes: 'Includes structured copper runs.',
      });

      const patchPanels = Math.ceil(totalDataPoints / 24);
      items.push({
        category: SystemCategory.DATA,
        itemCode: 'ELV-DT-002',
        description: '24-Port Category 6 RJ45 Unshielded Patch Panel',
        unit: 'Pcs',
        quantity: patchPanels,
        unitRate: 1200,
        total: patchPanels * 1200,
        confidenceLevel: Confidence.HIGH,
        notes: 'MDF patch panel mapping.',
      });
    }

    if (requiresRack) {
      items.push({
        category: SystemCategory.SERVER_ROOM,
        itemCode: 'ELV-RK-01',
        description: '42U Floor Standing Server Rack Cabinet with cable management',
        unit: 'Pcs',
        quantity: 1,
        unitRate: 4500,
        total: 4500,
        confidenceLevel: Confidence.HIGH,
        notes: 'Central Server Room equipment enclosure.',
      });
    }

    // 4. CCTV
    if (totalCctvPoints > 0) {
      items.push({
        category: SystemCategory.CCTV,
        itemCode: 'ELV-CC-001',
        description: 'IP Dome CCTV Camera, 4MP, infrared, QCDD approved vendor',
        unit: 'Pcs',
        quantity: totalCctvPoints,
        unitRate: 650,
        total: totalCctvPoints * 650,
        confidenceLevel: Confidence.HIGH,
        notes: 'Calculated from security visual coverage standards.',
      });

      items.push({
        category: SystemCategory.CCTV,
        itemCode: 'ELV-CC-NVR',
        description: '32-Channel Network Video Recorder (NVR) with 8TB storage',
        unit: 'Pcs',
        quantity: 1,
        unitRate: 5500,
        total: 5500,
        confidenceLevel: Confidence.HIGH,
        notes: 'Central NVR unit with standard storage capacity.',
      });
    }

    // 5. WIFI
    if (totalWifiPoints > 0) {
      items.push({
        category: SystemCategory.WIFI,
        itemCode: 'ELV-WF-001',
        description: 'Wi-Fi 6 Access Point, ceiling mounted, enterprise controller based',
        unit: 'Pcs',
        quantity: totalWifiPoints,
        unitRate: 950,
        total: totalWifiPoints * 950,
        confidenceLevel: Confidence.HIGH,
        notes: 'Wireless workspace access.',
      });
    }

    // 6. ACCESS CONTROL
    if (totalAccessPoints > 0) {
      items.push({
        category: SystemCategory.ACCESS_CONTROL,
        itemCode: 'ELV-AC-001',
        description: 'Access control keypad & RFID card reader, door lock controller & magnetic lock',
        unit: 'Set',
        quantity: totalAccessPoints,
        unitRate: 3800,
        total: totalAccessPoints * 3800,
        confidenceLevel: Confidence.HIGH,
        notes: 'Door secure reader kits.',
      });
    }

    // 7. BMS SENSORS
    if (totalBmsSensors > 0) {
      items.push({
        category: SystemCategory.BMS,
        itemCode: 'ELV-BM-001',
        description: 'Digital Temperature and Humidity smart sensor connected to central DDC',
        unit: 'Pcs',
        quantity: totalBmsSensors,
        unitRate: 1200,
        total: totalBmsSensors * 1200,
        confidenceLevel: Confidence.HIGH,
        notes: 'Integrated smart bms drops.',
      });
    }

    // 8. OTHER (Project Containment & Overhead)
    const containmentCost = totalArea * 35;
    items.push({
      category: SystemCategory.CABLE_CONTAINMENT,
      itemCode: 'EL-CM-001',
      description: 'Structured cabling containment, PVC conduit & trunking distribution system',
      unit: 'Lot',
      quantity: 1,
      unitRate: containmentCost,
      total: containmentCost,
      confidenceLevel: Confidence.MEDIUM,
      notes: 'Containment cost placeholder based on area.',
    });

    // 9. LABOR & TESTING
    const totalMaterialsCost = items.reduce((acc, it) => acc + it.total, 0);
    const laborCost = Math.ceil(totalMaterialsCost * 0.25);
    items.push({
      category: SystemCategory.OTHER,
      itemCode: 'MEP-LB-01',
      description: 'MEP/ELV Installation labor, testing & commissioning services',
      unit: 'Lot',
      quantity: 1,
      unitRate: laborCost,
      total: laborCost,
      confidenceLevel: Confidence.MEDIUM,
      notes: 'Standard 25% project installation markup.',
    });

    return items;
  }
}
