import { Confidence } from '@prisma/client';

export interface LightingCalcInput {
  roomType: string;
  area: number;
  ceilingHeight?: number;
  targetLux?: number;
  fixtureLumens?: number;
  utilizationFactor?: number;
  maintenanceFactor?: number;
  fixtureWattage?: number;
}

export interface LightingCalcResult {
  targetLux: number;
  fixtureLumens: number;
  utilizationFactor: number;
  maintenanceFactor: number;
  calculatedQty: number;
  roundedQty: number;
  estimatedWatts: number;
  fixtureType: string;
  confidenceLevel: Confidence;
  warnings: string[];
}

export class LightingEngineeringService {
  private static DEFAULT_LUX: Record<string, number> = {
    'Open Office': 450,
    'Server Room': 400,
    'Meeting Room': 400,
    'Reception': 300,
    'Pantry': 250,
    'Corridor': 120,
    'Washroom': 150,
    'Storage': 150,
    'Prayer Room': 250,
  };

  public static calculate(input: LightingCalcInput): LightingCalcResult {
    const warnings: string[] = [];
    
    // Fallbacks
    const normalizedType = input.roomType.trim();
    const targetLux = input.targetLux || this.DEFAULT_LUX[normalizedType] || 300;
    const fixtureLumens = input.fixtureLumens || 3200;
    const uf = input.utilizationFactor || 0.6;
    const mf = input.maintenanceFactor || 0.8;
    const wattage = input.fixtureWattage || 36;
    
    if (!input.area || input.area <= 0) {
      warnings.push('Room area is missing or zero. Defaulting to 10 sqm for safety calculation.');
    }
    
    const area = input.area && input.area > 0 ? input.area : 10;
    
    if (input.ceilingHeight && (input.ceilingHeight < 2.2 || input.ceilingHeight > 6)) {
      warnings.push(`Abnormal ceiling height detected: ${input.ceilingHeight}m. High-bay fixtures or specialized optics may be required.`);
    }

    // Formula: Qty = (Lux * Area) / (Lumens * UF * MF)
    const rawQty = (targetLux * area) / (fixtureLumens * uf * mf);
    const roundedQty = Math.ceil(rawQty);
    
    const estimatedWatts = roundedQty * wattage;
    
    let confidenceLevel: Confidence = Confidence.HIGH;
    if (warnings.length > 0) {
      confidenceLevel = Confidence.REVIEW_REQUIRED;
    } else if (rawQty < 1) {
      confidenceLevel = Confidence.MEDIUM;
      warnings.push('Calculated fixture count is extremely low. At least 1-2 fixtures are required for uniform distribution.');
    }

    return {
      targetLux,
      fixtureLumens,
      utilizationFactor: uf,
      maintenanceFactor: mf,
      calculatedQty: roundedQty,
      roundedQty,
      estimatedWatts,
      fixtureType: targetLux > 350 ? '60x60 LED Panel (Premium)' : 'LED Recessed Downlight',
      confidenceLevel,
      warnings,
    };
  }
}
