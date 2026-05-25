import { useState, useMemo } from 'react';
import {
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  Shield,
  Flame,
  Activity,
  Wind,
} from 'lucide-react';

/* ============================================================
   TYPES & INTERFACES
   ============================================================ */

type PhaseType = 'SINGLE' | 'THREE';
type Material = 'COPPER' | 'ALUMINUM';
type LoadUnit = 'W' | 'kW' | 'VA' | 'kVA' | 'HP';
type MechanicalRisk = 'LOW' | 'MEDIUM' | 'HIGH';
type EMIRisk = 'LOW' | 'MEDIUM' | 'HIGH';
type RouteEnvironment =
  | 'indoor'
  | 'outdoor'
  | 'underground'
  | 'exposed'
  | 'public_building'
  | 'industrial'
  | 'data_room';
type Insulation = 'PVC' | 'XLPE' | 'LSZH' | 'EPR';
type LoadType =
  | 'lighting'
  | 'socket'
  | 'hvac'
  | 'motor'
  | 'ups'
  | 'server'
  | 'panel_feeder'
  | 'general';
type InstallMethod =
  | 'free_air'
  | 'perforated_tray'
  | 'conduit'
  | 'trunking'
  | 'underground_duct'
  | 'thermal_insulation';
type RouteType =
  | 'cable_tray'
  | 'cable_ladder'
  | 'conduit'
  | 'underground'
  | 'trunking'
  | 'direct';

interface CableInputs {
  // Context
  equipmentName: string;
  // Load
  loadType: LoadType;
  loadValue: number;
  loadUnit: LoadUnit;
  powerFactor: number;
  efficiency: number;
  demandFactor: number;
  diversityFactor: number;
  safetyMarginPct: number;
  // Supply
  phaseType: PhaseType;
  voltagePreset: string;
  customVoltage: number;
  frequency: number;
  isDC: boolean;
  // Route
  cableLengthM: number;
  routeType: RouteType;
  installMethod: InstallMethod;
  parallelRuns: number;
  numCores: number;
  ambientTempC: number;
  soilTempC: number;
  groupingCount: number;
  // Environment & Risk
  routeEnvironment: RouteEnvironment;
  mechanicalRisk: MechanicalRisk;
  emiRisk: EMIRisk;
  lifeSafetyCircuit: boolean;
  // Cable specs
  material: Material;
  insulation: Insulation;
  cableConstruction: string[];
  singleCore: boolean;
  // Limits
  maxVoltageDropPct: number;
  minCableSizeMm2: number;
}

interface CableRecommendation {
  armored: 'REQUIRED' | 'RECOMMENDED' | 'NOT_REQUIRED';
  armoredReason: string;
  shielded: 'REQUIRED' | 'RECOMMENDED' | 'NOT_REQUIRED';
  shieldedReason: string;
  lszh: 'REQUIRED' | 'RECOMMENDED' | 'NOT_REQUIRED';
  lszhReason: string;
  fireRated: 'REQUIRED' | 'RECOMMENDED' | 'NOT_REQUIRED';
  fireRatedReason: string;
}

interface DeratingBreakdown {
  tempFactor: number;
  tempLabel: string;
  groupFactor: number;
  groupLabel: string;
  installFactor: number;
  installLabel: string;
  soilFactor: number;
  soilLabel: string;
  total: number;
}

interface SelectionExplanation {
  designCurrent: number;
  deratingFactor: number;
  requiredAmpacity: number;
  selectedCableAmpacity: number;
  voltageDropV: number;
  voltageDropPct: number;
  voltageDropLimit: number;
  sizeRule: string;
  ampacityPass: boolean;
  voltageDropPass: boolean;
  minSizePass: boolean;
}

interface CableResult {
  designLoadWatts: number;
  calculatedCurrentA: number;
  designCurrentA: number;
  derating: DeratingBreakdown;
  requiredAmpacityA: number;
  selectedCableSizeMm2: number;
  selectedCableAmpacity: number;
  voltageDropV: number;
  voltageDropPct: number;
  resistanceOhm: number;
  resistanceOhmPerKm: number;
  recommendation: CableRecommendation;
  explanation: SelectionExplanation;
  warnings: string[];
  boqItem: CableBOQItem;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'REVIEW_REQUIRED';
}

interface CableBOQItem {
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: string;
  total: string;
  confidenceLevel: string;
  notes: string;
}

/* ---- Backend-ready payload shape ---- */
export interface CableCalculationPayload {
  projectId: string | null;
  equipmentName: string;
  loadType: string;
  loadValue: number;
  loadUnit: string;
  powerFactor: number;
  efficiency: number;
  demandFactor: number;
  diversityFactor: number;
  safetyMargin: number;
  phaseType: PhaseType;
  voltage: number;
  frequency: number;
  isDC: boolean;
  cableLength: number;
  routeType: string;
  installationMethod: string;
  ambientTemperature: number;
  groupingCount: number;
  parallelRuns: number;
  routeEnvironment: string;
  mechanicalRisk: MechanicalRisk;
  emiRisk: EMIRisk;
  lifeSafetyCircuit: boolean;
  material: Material;
  insulation: string;
  cableConstruction: string[];
  maxVoltageDropPercent: number;
  minCableSize: number;
  designLoadWatts: number;
  calculatedCurrent: number;
  designCurrent: number;
  deratingFactor: number;
  requiredAmpacity: number;
  selectedCableSize: number;
  voltageDrop: number;
  voltageDropPercent: number;
  resistance: number;
  recommendationJson: string;
  warningsJson: string;
  confidenceLevel: string;
}

/* ============================================================
   CABLE DATA TABLES
   ============================================================ */

interface CableSizeEntry {
  sizeMm2: number;
  cuAmpacity: number;
  alAmpacity: number | null;
  cuResistanceOhmPerKm: number;
  alResistanceOhmPerKm: number | null;
  typicalUse: string;
}

const CABLE_TABLE: CableSizeEntry[] = [
  { sizeMm2: 1.5, cuAmpacity: 18, alAmpacity: null, cuResistanceOhmPerKm: 12.10, alResistanceOhmPerKm: null, typicalUse: 'Lighting control, small lighting circuits' },
  { sizeMm2: 2.5, cuAmpacity: 25, alAmpacity: null, cuResistanceOhmPerKm: 7.41, alResistanceOhmPerKm: null, typicalUse: 'Socket/power circuits, small loads' },
  { sizeMm2: 4, cuAmpacity: 33, alAmpacity: null, cuResistanceOhmPerKm: 4.61, alResistanceOhmPerKm: null, typicalUse: 'Dedicated small equipment' },
  { sizeMm2: 6, cuAmpacity: 43, alAmpacity: null, cuResistanceOhmPerKm: 3.08, alResistanceOhmPerKm: null, typicalUse: 'Small feeder circuits' },
  { sizeMm2: 10, cuAmpacity: 60, alAmpacity: 46, cuResistanceOhmPerKm: 1.83, alResistanceOhmPerKm: 3.08, typicalUse: 'Feeder/load circuits' },
  { sizeMm2: 16, cuAmpacity: 80, alAmpacity: 61, cuResistanceOhmPerKm: 1.15, alResistanceOhmPerKm: 1.91, typicalUse: 'Sub-panel feeder' },
  { sizeMm2: 25, cuAmpacity: 107, alAmpacity: 82, cuResistanceOhmPerKm: 0.727, alResistanceOhmPerKm: 1.20, typicalUse: 'Medium feeder' },
  { sizeMm2: 35, cuAmpacity: 131, alAmpacity: 100, cuResistanceOhmPerKm: 0.524, alResistanceOhmPerKm: 0.868, typicalUse: 'Medium-large feeder' },
  { sizeMm2: 50, cuAmpacity: 159, alAmpacity: 121, cuResistanceOhmPerKm: 0.387, alResistanceOhmPerKm: 0.641, typicalUse: 'Large feeder' },
  { sizeMm2: 70, cuAmpacity: 202, alAmpacity: 154, cuResistanceOhmPerKm: 0.268, alResistanceOhmPerKm: 0.443, typicalUse: 'Main feeder' },
  { sizeMm2: 95, cuAmpacity: 244, alAmpacity: 186, cuResistanceOhmPerKm: 0.193, alResistanceOhmPerKm: 0.320, typicalUse: 'Main feeder / riser' },
  { sizeMm2: 120, cuAmpacity: 281, alAmpacity: 215, cuResistanceOhmPerKm: 0.153, alResistanceOhmPerKm: 0.253, typicalUse: 'Main feeder / riser' },
  { sizeMm2: 150, cuAmpacity: 316, alAmpacity: 241, cuResistanceOhmPerKm: 0.124, alResistanceOhmPerKm: 0.206, typicalUse: 'Large panel feed' },
  { sizeMm2: 185, cuAmpacity: 354, alAmpacity: 271, cuResistanceOhmPerKm: 0.0991, alResistanceOhmPerKm: 0.164, typicalUse: 'HV / large panels' },
  { sizeMm2: 240, cuAmpacity: 407, alAmpacity: 311, cuResistanceOhmPerKm: 0.0754, alResistanceOhmPerKm: 0.125, typicalUse: 'Transformer / main LV' },
  { sizeMm2: 300, cuAmpacity: 457, alAmpacity: 349, cuResistanceOhmPerKm: 0.0601, alResistanceOhmPerKm: 0.100, typicalUse: 'Transformer / main LV' },
  { sizeMm2: 400, cuAmpacity: 526, alAmpacity: 402, cuResistanceOhmPerKm: 0.0470, alResistanceOhmPerKm: 0.0778, typicalUse: 'Main LV busbar feeds' },
  { sizeMm2: 500, cuAmpacity: 590, alAmpacity: 451, cuResistanceOhmPerKm: 0.0366, alResistanceOhmPerKm: 0.0605, typicalUse: 'Main LV busbar feeds' },
];

// Ambient temperature derating (reference 30°C)
const AMBIENT_TEMP_FACTORS: { temp: number; factor: number }[] = [
  { temp: 25, factor: 1.04 },
  { temp: 30, factor: 1.00 },
  { temp: 35, factor: 0.94 },
  { temp: 40, factor: 0.87 },
  { temp: 45, factor: 0.79 },
  { temp: 50, factor: 0.71 },
  { temp: 55, factor: 0.61 },
];

const GROUPING_FACTORS: { count: number; label: string; factor: number }[] = [
  { count: 1, label: '1 circuit', factor: 1.00 },
  { count: 2, label: '2 circuits', factor: 0.80 },
  { count: 3, label: '3 circuits', factor: 0.70 },
  { count: 5, label: '4–5 circuits', factor: 0.65 },
  { count: 9, label: '6–9 circuits', factor: 0.60 },
  { count: 999, label: '10+ circuits', factor: 0.55 },
];

const INSTALL_METHOD_FACTORS: { method: InstallMethod; label: string; factor: number }[] = [
  { method: 'free_air', label: 'In free air / cable tray', factor: 1.00 },
  { method: 'perforated_tray', label: 'On perforated tray', factor: 0.97 },
  { method: 'conduit', label: 'In conduit', factor: 0.90 },
  { method: 'trunking', label: 'In trunking', factor: 0.85 },
  { method: 'underground_duct', label: 'In underground duct', factor: 0.80 },
  { method: 'thermal_insulation', label: 'In thermal insulation', factor: 0.70 },
];

/* ============================================================
   CALCULATION ENGINE
   ============================================================ */

function getVoltage(inputs: CableInputs): number {
  if (inputs.voltagePreset === 'custom') return inputs.customVoltage || 230;
  return parseFloat(inputs.voltagePreset) || 230;
}

function loadToWatts(value: number, unit: LoadUnit, pf: number, efficiency: number): number {
  switch (unit) {
    case 'W': return value;
    case 'kW': return value * 1000;
    case 'VA': return value * pf;
    case 'kVA': return value * 1000 * pf;
    case 'HP': return value * 745.7 * efficiency;
    default: return value;
  }
}

function calculateDesignLoad(inputs: CableInputs): number {
  const rawWatts = loadToWatts(inputs.loadValue, inputs.loadUnit, inputs.powerFactor, inputs.efficiency);
  const safetyMultiplier = 1 + inputs.safetyMarginPct / 100;
  return rawWatts * inputs.demandFactor * inputs.diversityFactor * safetyMultiplier;
}

function calculateCurrent(designWatts: number, inputs: CableInputs): number {
  const V = getVoltage(inputs);
  const pf = inputs.powerFactor;
  const eff = inputs.efficiency;
  const SQRT3 = Math.sqrt(3);

  if (inputs.loadUnit === 'VA' || inputs.loadUnit === 'kVA') {
    // Apparent power — use VA directly
    const va = inputs.loadUnit === 'kVA' ? inputs.loadValue * 1000 : inputs.loadValue;
    if (inputs.phaseType === 'SINGLE') return va / V;
    return va / (SQRT3 * V);
  }

  if (inputs.loadType === 'motor') {
    const watts = loadToWatts(inputs.loadValue, inputs.loadUnit, pf, eff);
    if (inputs.phaseType === 'SINGLE') return watts / (V * pf * eff);
    return watts / (SQRT3 * V * pf * eff);
  }

  if (inputs.phaseType === 'SINGLE') return designWatts / (V * pf);
  return designWatts / (SQRT3 * V * pf);
}

function getAmbientTempFactor(tempC: number): { factor: number; label: string } {
  // Find nearest in table (or interpolate linearly)
  const sorted = [...AMBIENT_TEMP_FACTORS].sort((a, b) => a.temp - b.temp);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (tempC <= sorted[i + 1].temp) {
      if (tempC <= sorted[i].temp) return { factor: sorted[i].factor, label: `${sorted[i].temp}°C → ${sorted[i].factor}` };
      // Linear interpolation
      const t = (tempC - sorted[i].temp) / (sorted[i + 1].temp - sorted[i].temp);
      const f = sorted[i].factor + t * (sorted[i + 1].factor - sorted[i].factor);
      return { factor: parseFloat(f.toFixed(3)), label: `${tempC}°C (interpolated) → ${f.toFixed(3)}` };
    }
  }
  const last = sorted[sorted.length - 1];
  return { factor: last.factor, label: `${last.temp}°C+ → ${last.factor}` };
}

function getGroupingFactor(count: number): { factor: number; label: string } {
  const match = GROUPING_FACTORS.slice().reverse().find(g => count <= g.count);
  const entry = match || GROUPING_FACTORS[GROUPING_FACTORS.length - 1];
  return { factor: entry.factor, label: `${entry.label} → ${entry.factor}` };
}

function getInstallMethodFactor(method: InstallMethod): { factor: number; label: string } {
  const entry = INSTALL_METHOD_FACTORS.find(m => m.method === method) || INSTALL_METHOD_FACTORS[0];
  return { factor: entry.factor, label: `${entry.label} → ${entry.factor}` };
}

function getSoilFactor(routeType: RouteType, soilTempC: number): { factor: number; label: string } {
  if (routeType !== 'underground') return { factor: 1.00, label: 'N/A (not underground) → 1.00' };
  if (soilTempC <= 15) return { factor: 1.00, label: 'Normal soil → 1.00' };
  if (soilTempC <= 25) return { factor: 0.90, label: 'Moderate resistivity → 0.90' };
  if (soilTempC <= 35) return { factor: 0.85, label: 'High resistivity → 0.85' };
  return { factor: 0.80, label: 'Unknown / very high → 0.80' };
}

function calculateDerating(inputs: CableInputs): DeratingBreakdown {
  const temp = getAmbientTempFactor(inputs.ambientTempC);
  const group = getGroupingFactor(inputs.groupingCount);
  const install = getInstallMethodFactor(inputs.installMethod);
  const soil = getSoilFactor(inputs.routeType, inputs.soilTempC);
  const total = parseFloat((temp.factor * group.factor * install.factor * soil.factor).toFixed(4));
  return {
    tempFactor: temp.factor, tempLabel: temp.label,
    groupFactor: group.factor, groupLabel: group.label,
    installFactor: install.factor, installLabel: install.label,
    soilFactor: soil.factor, soilLabel: soil.label,
    total,
  };
}

function getResistancePerKm(material: Material, sizeMm2: number): number {
  const entry = CABLE_TABLE.find(c => c.sizeMm2 === sizeMm2);
  if (!entry) {
    // Fallback: calculate via resistivity
    const rho = material === 'COPPER' ? 0.0175 : 0.0282;
    return (rho * 1000) / sizeMm2;
  }
  return material === 'COPPER' ? entry.cuResistanceOhmPerKm : (entry.alResistanceOhmPerKm ?? entry.cuResistanceOhmPerKm * 1.6);
}

function calculateVoltageDrop(
  inputs: CableInputs,
  currentA: number,
  sizeMm2: number,
): { vdV: number; vdPct: number; resistanceOhm: number } {
  const V = getVoltage(inputs);
  const L = inputs.cableLengthM;
  const pf = inputs.powerFactor;
  const sin_phi = Math.sqrt(1 - pf * pf);
  const rOhmPerKm = getResistancePerKm(inputs.material, sizeMm2);
  // X approximate 0.08 Ω/km for typical cables — not critical for preliminary
  const xOhmPerKm = 0.08;

  let vdV: number;

  if (inputs.isDC || inputs.phaseType === 'SINGLE') {
    // Vd = 2 × I × L × (R·cosφ + X·sinφ) / 1000
    vdV = 2 * currentA * L * (rOhmPerKm * pf + xOhmPerKm * sin_phi) / 1000;
  } else {
    // Three-phase: Vd = √3 × I × L × (R·cosφ + X·sinφ) / 1000
    vdV = Math.sqrt(3) * currentA * L * (rOhmPerKm * pf + xOhmPerKm * sin_phi) / 1000;
  }

  const vdPct = (vdV / V) * 100;
  const resistanceOhm = (rOhmPerKm * L) / 1000;

  return { vdV, vdPct, resistanceOhm };
}

function getAmpacity(entry: CableSizeEntry, material: Material): number {
  return material === 'COPPER' ? entry.cuAmpacity : (entry.alAmpacity ?? 0);
}

function selectCableSize(
  inputs: CableInputs,
  designCurrentA: number,
  deratingFactor: number,
): { sizeMm2: number; ampacity: number } {
  const requiredAmpacity = designCurrentA / deratingFactor;
  const minSizeMm2 = inputs.minCableSizeMm2;

  for (const entry of CABLE_TABLE) {
    if (entry.sizeMm2 < minSizeMm2) continue;
    const ampacity = getAmpacity(entry, inputs.material);
    if (ampacity === 0) continue;
    if (ampacity < requiredAmpacity) continue;

    // Check voltage drop with this size
    const { vdPct } = calculateVoltageDrop(inputs, designCurrentA, entry.sizeMm2);
    if (vdPct <= inputs.maxVoltageDropPct) {
      return { sizeMm2: entry.sizeMm2, ampacity };
    }
  }

  // Return largest if nothing satisfies (with warning)
  const largest = CABLE_TABLE[CABLE_TABLE.length - 1];
  return { sizeMm2: largest.sizeMm2, ampacity: getAmpacity(largest, inputs.material) };
}

function generateRecommendation(inputs: CableInputs): CableRecommendation {
  const env = inputs.routeEnvironment;
  const mech = inputs.mechanicalRisk;
  const emi = inputs.emiRisk;
  const ls = inputs.lifeSafetyCircuit;
  const lt = inputs.loadType;

  // Armoring
  let armored: CableRecommendation['armored'] = 'NOT_REQUIRED';
  let armoredReason = 'Indoor protected route with low mechanical risk — unarmored cable is acceptable.';
  if (env === 'underground' || env === 'exposed' || env === 'industrial' || mech === 'HIGH') {
    armored = 'REQUIRED';
    armoredReason = 'Armored cable (SWA/AWA) is required for underground installation, exposed routes, industrial environments, or high mechanical risk areas.';
  } else if (env === 'outdoor' || mech === 'MEDIUM') {
    armored = 'RECOMMENDED';
    armoredReason = 'Armored cable is recommended for outdoor or moderate mechanical risk environments to protect against physical damage.';
  }

  // Shielding
  let shielded: CableRecommendation['shielded'] = 'NOT_REQUIRED';
  let shieldedReason = 'No significant EMI risk or sensitive signal type detected — shielding is not required.';
  if (emi === 'HIGH' || lt === 'motor') {
    shielded = 'REQUIRED';
    shieldedReason = 'Shielded/screened cable is required due to high EMI environment or motor/VFD circuit — prevents electromagnetic interference with adjacent control and signal cables.';
  } else if (emi === 'MEDIUM' || lt === 'server' || lt === 'ups') {
    shielded = 'RECOMMENDED';
    shieldedReason = 'Shielded cable is recommended for medium EMI risk, UPS, or server room circuits to improve signal integrity and reduce interference.';
  }

  // LSZH
  let lszh: CableRecommendation['lszh'] = 'NOT_REQUIRED';
  let lszhReason = 'LSZH sheath is not mandated for this route environment.';
  if (env === 'public_building' || env === 'data_room') {
    lszh = 'REQUIRED';
    lszhReason = 'LSZH (Low Smoke Zero Halogen) cable is required in public buildings, data rooms, hospitals, schools, malls, and enclosed occupied spaces to limit toxic smoke emission in the event of fire.';
  } else if (env === 'indoor') {
    lszh = 'RECOMMENDED';
    lszhReason = 'LSZH is recommended for indoor occupied areas as best practice for occupant safety.';
  }

  // Fire-rated
  let fireRated: CableRecommendation['fireRated'] = 'NOT_REQUIRED';
  let fireRatedReason = 'Fire-rated cable is not required for this circuit type.';
  if (ls || lt === 'lighting') {
    // Only fire-rated if explicitly life-safety
    if (ls) {
      fireRated = 'REQUIRED';
      fireRatedReason = 'Fire-rated cable is required for life-safety circuits including fire alarm, emergency lighting, smoke control, and evacuation systems — cable must maintain circuit integrity under fire conditions as per IEC 60331 / BS 6387.';
    }
  }

  return { armored, armoredReason, shielded, shieldedReason, lszh, lszhReason, fireRated, fireRatedReason };
}

function buildWarnings(inputs: CableInputs, result: { designCurrentA: number; selectedCableSizeMm2: number; derating: DeratingBreakdown; parallelRuns?: number }): string[] {
  const warnings: string[] = [];
  const { vdPct } = calculateVoltageDrop(inputs, result.designCurrentA, result.selectedCableSizeMm2);

  if (inputs.material === 'ALUMINUM' && result.selectedCableSizeMm2 < 10) {
    warnings.push('Aluminum conductors are not recommended below 10 mm². Consider switching to copper.');
  }
  if (vdPct > inputs.maxVoltageDropPct) {
    warnings.push(`Voltage drop (${vdPct.toFixed(2)}%) exceeds the set limit of ${inputs.maxVoltageDropPct}%. Consider increasing cable size or reducing cable length.`);
  }
  if (result.selectedCableSizeMm2 === 500) {
    warnings.push('Maximum cable size (500 mm²) reached. Consider parallel runs or reviewing load/voltage drop criteria.');
  }
  if (result.derating.total < 0.5) {
    warnings.push('Combined derating factor is below 0.50 — significant capacity reduction. Verify installation conditions carefully.');
  }
  if (inputs.parallelRuns > 1) {
    warnings.push(`Parallel runs (×${inputs.parallelRuns}) assumed. Ensure equal cable lengths, identical installation conditions, and coordinated protection for all parallel conductors.`);
  }
  if (inputs.lifeSafetyCircuit) {
    warnings.push('Life-safety circuit: Cable selection, routing, and protection must comply with local fire safety authority requirements and site-specific specifications.');
  }
  if (inputs.powerFactor < 0.7) {
    warnings.push('Low power factor detected. Power factor correction may be required. Verify with project electrical engineer.');
  }
  warnings.push('All outputs are preliminary estimates. Final cable sizing requires engineer review against IEC, Kahramaa, and project specifications.');
  return warnings;
}

function buildBOQItem(inputs: CableInputs, result: { selectedCableSizeMm2: number }): CableBOQItem {
  const size = result.selectedCableSizeMm2;
  const mat = inputs.material === 'COPPER' ? 'Cu' : 'Al';
  const cores = inputs.numCores;
  const ins = inputs.insulation;
  const construction: string[] = [];
  if (inputs.cableConstruction.includes('armored')) construction.push('SWA');
  if (inputs.cableConstruction.includes('shielded')) construction.push('Screened');
  if (inputs.cableConstruction.includes('fire_rated')) construction.push('Fire-Rated');
  if (inputs.cableConstruction.includes('lszh') || inputs.insulation === 'LSZH') construction.push('LSZH');
  const constructionStr = construction.length > 0 ? ` ${construction.join('/')}` : '';

  const qty = inputs.cableLengthM * inputs.parallelRuns;
  const codeNum = String(size).replace('.', '');
  const code = `CABLE-PWR-${mat.toUpperCase()}-${codeNum}`;
  const description = `Supply and install ${size} mm² ${cores}-core ${inputs.material === 'COPPER' ? 'Copper' : 'Aluminum'} ${ins}${constructionStr} power cable — preliminary cable sizing estimate. Engineer review required before construction.`;

  return {
    itemCode: code,
    description,
    unit: 'm',
    quantity: qty,
    unitRate: 'TBC',
    total: 'TBC',
    confidenceLevel: 'LOW — Preliminary',
    notes: 'Rate pending engineer review. Cable size is a preliminary estimate only. Verify against approved cable schedules, protection coordination study, and manufacturer data.',
  };
}

function runCalculation(inputs: CableInputs): CableResult {
  const designLoadWatts = calculateDesignLoad(inputs);
  const calculatedCurrentA = calculateCurrent(designLoadWatts, inputs);
  const designCurrentA = calculatedCurrentA; // same at this stage; could differ if separately adjusted
  const derating = calculateDerating(inputs);
  const requiredAmpacityA = designCurrentA / derating.total;

  const { sizeMm2, ampacity } = selectCableSize(inputs, designCurrentA, derating.total);
  const { vdV, vdPct, resistanceOhm } = calculateVoltageDrop(inputs, designCurrentA, sizeMm2);
  const resistanceOhmPerKm = getResistancePerKm(inputs.material, sizeMm2);

  const recommendation = generateRecommendation(inputs);

  const explanation: SelectionExplanation = {
    designCurrent: designCurrentA,
    deratingFactor: derating.total,
    requiredAmpacity: requiredAmpacityA,
    selectedCableAmpacity: ampacity,
    voltageDropV: vdV,
    voltageDropPct: vdPct,
    voltageDropLimit: inputs.maxVoltageDropPct,
    sizeRule: `Smallest size where derated ampacity ≥ ${requiredAmpacityA.toFixed(1)} A AND voltage drop ≤ ${inputs.maxVoltageDropPct}% AND size ≥ ${inputs.minCableSizeMm2} mm²`,
    ampacityPass: ampacity >= requiredAmpacityA,
    voltageDropPass: vdPct <= inputs.maxVoltageDropPct,
    minSizePass: sizeMm2 >= inputs.minCableSizeMm2,
  };

  const partialResult = {
    designLoadWatts, calculatedCurrentA, designCurrentA,
    derating, requiredAmpacityA, selectedCableSizeMm2: sizeMm2,
    selectedCableAmpacity: ampacity, voltageDropV: vdV, voltageDropPct: vdPct,
    resistanceOhm, resistanceOhmPerKm, recommendation, explanation,
  };

  const warnings = buildWarnings(inputs, { designCurrentA, selectedCableSizeMm2: sizeMm2, derating, parallelRuns: inputs.parallelRuns });
  const boqItem = buildBOQItem(inputs, { selectedCableSizeMm2: sizeMm2 });

  const passes = explanation.ampacityPass && explanation.voltageDropPass && explanation.minSizePass;
  const confidenceLevel = passes ? (derating.total > 0.7 ? 'MEDIUM' : 'LOW') : 'REVIEW_REQUIRED';

  return { ...partialResult, warnings, boqItem, confidenceLevel };
}

function buildPayload(inputs: CableInputs, result: CableResult, activeProjectId: string | null): CableCalculationPayload {
  return {
    projectId: activeProjectId,
    equipmentName: inputs.equipmentName,
    loadType: inputs.loadType,
    loadValue: inputs.loadValue,
    loadUnit: inputs.loadUnit,
    powerFactor: inputs.powerFactor,
    efficiency: inputs.efficiency,
    demandFactor: inputs.demandFactor,
    diversityFactor: inputs.diversityFactor,
    safetyMargin: inputs.safetyMarginPct,
    phaseType: inputs.phaseType,
    voltage: getVoltage(inputs),
    frequency: inputs.frequency,
    isDC: inputs.isDC,
    cableLength: inputs.cableLengthM,
    routeType: inputs.routeType,
    installationMethod: inputs.installMethod,
    ambientTemperature: inputs.ambientTempC,
    groupingCount: inputs.groupingCount,
    parallelRuns: inputs.parallelRuns,
    routeEnvironment: inputs.routeEnvironment,
    mechanicalRisk: inputs.mechanicalRisk,
    emiRisk: inputs.emiRisk,
    lifeSafetyCircuit: inputs.lifeSafetyCircuit,
    material: inputs.material,
    insulation: inputs.insulation,
    cableConstruction: inputs.cableConstruction,
    maxVoltageDropPercent: inputs.maxVoltageDropPct,
    minCableSize: inputs.minCableSizeMm2,
    designLoadWatts: result.designLoadWatts,
    calculatedCurrent: result.calculatedCurrentA,
    designCurrent: result.designCurrentA,
    deratingFactor: result.derating.total,
    requiredAmpacity: result.requiredAmpacityA,
    selectedCableSize: result.selectedCableSizeMm2,
    voltageDrop: result.voltageDropV,
    voltageDropPercent: result.voltageDropPct,
    resistance: result.resistanceOhm,
    recommendationJson: JSON.stringify(result.recommendation),
    warningsJson: JSON.stringify(result.warnings),
    confidenceLevel: result.confidenceLevel,
  };
}

/* ============================================================
   DEFAULT INPUTS
   ============================================================ */

const DEFAULT_INPUTS: CableInputs = {
  equipmentName: '',
  loadType: 'general',
  loadValue: 25,
  loadUnit: 'kW',
  powerFactor: 0.85,
  efficiency: 0.90,
  demandFactor: 1.0,
  diversityFactor: 1.0,
  safetyMarginPct: 0,
  phaseType: 'THREE',
  voltagePreset: '415',
  customVoltage: 415,
  frequency: 50,
  isDC: false,
  cableLengthM: 80,
  routeType: 'cable_tray',
  installMethod: 'free_air',
  parallelRuns: 1,
  numCores: 4,
  ambientTempC: 40,
  soilTempC: 20,
  groupingCount: 3,
  routeEnvironment: 'indoor',
  mechanicalRisk: 'LOW',
  emiRisk: 'LOW',
  lifeSafetyCircuit: false,
  material: 'COPPER',
  insulation: 'XLPE',
  cableConstruction: [],
  singleCore: false,
  maxVoltageDropPct: 5,
  minCableSizeMm2: 1.5,
};

/* ============================================================
   UI HELPER COMPONENTS
   ============================================================ */

function RecommendationPill({ level }: { level: 'REQUIRED' | 'RECOMMENDED' | 'NOT_REQUIRED' }) {
  const styles = {
    REQUIRED: 'bg-rose-950/60 text-rose-400 border border-rose-700/50',
    RECOMMENDED: 'bg-amber-950/60 text-amber-400 border border-amber-700/50',
    NOT_REQUIRED: 'bg-slate-800/60 text-slate-400 border border-slate-600/50',
  };
  const labels = { REQUIRED: 'Required', RECOMMENDED: 'Recommended', NOT_REQUIRED: 'Not Required' };
  return (
    <span className={`cable-recommendation-pill ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

function StatusIcon({ pass }: { pass: boolean }) {
  return pass
    ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
    : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="cable-section-header">
      <div className="cable-section-icon">{icon}</div>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ============================================================
   FORMULA ACCORDION ITEMS
   ============================================================ */

const FORMULAS = [
  {
    id: 'current',
    title: 'Current Calculation',
    formulas: [
      { label: 'Single-phase (kW)', formula: 'I = (kW × 1000) / (V × PF)', vars: 'I = current (A), V = voltage (V), PF = power factor' },
      { label: 'Three-phase (kW)', formula: 'I = (kW × 1000) / (√3 × V × PF)', vars: 'V = line-to-line voltage' },
      { label: 'Motor load', formula: 'I = (kW × 1000) / (√3 × V × PF × η)', vars: 'η = motor efficiency' },
      { label: 'Apparent power (kVA)', formula: 'I = kVA × 1000 / (√3 × V)', vars: 'Three-phase apparent power' },
    ],
    explanation: 'Current tells you how much electrical flow the cable must carry. Higher loads and lower voltages increase the required current, directly affecting the cable size needed.',
  },
  {
    id: 'design_load',
    title: 'Design Load & Factors',
    formulas: [
      { label: 'Design Load', formula: 'P_design = P_connected × Demand × Diversity × (1 + Safety%/100)', vars: 'Demand factor: fraction of connected load expected simultaneously. Diversity factor: accounts for non-simultaneous use. Safety margin: additional buffer percentage.' },
    ],
    explanation: 'The design load applies engineering factors to the connected load to reflect realistic operating conditions and provide a design safety margin.',
  },
  {
    id: 'resistance',
    title: 'Cable Resistance',
    formulas: [
      { label: 'Basic resistance', formula: 'R = ρ × L / A', vars: 'ρ = resistivity (Cu: 0.0175, Al: 0.0282 Ω·mm²/m), L = length (m), A = cross-section (mm²)' },
      { label: 'Temperature correction', formula: 'Rθ = R₂₀ × [1 + α × (θ - 20)]', vars: 'α_Cu = 0.00393/°C, α_Al = 0.00403/°C, θ = conductor temperature' },
    ],
    explanation: 'Resistance increases with cable length, decreases with larger cross-sectional area, and increases with temperature. Copper has lower resistivity than aluminum, giving better conductivity for the same size.',
  },
  {
    id: 'voltage_drop',
    title: 'Voltage Drop',
    formulas: [
      { label: 'Single-phase AC', formula: 'Vd = 2 × I × L × (R·cosφ + X·sinφ) / 1000', vars: 'Factor 2 = outgoing + return path. R, X in Ω/km.' },
      { label: 'Three-phase AC', formula: 'Vd = √3 × I × L × (R·cosφ + X·sinφ) / 1000', vars: '√3 ≈ 1.732 for three-phase systems.' },
      { label: 'Voltage drop %', formula: 'Vd% = (Vd / V_supply) × 100', vars: 'Limits: 3% for lighting, 5% for power (typical).' },
    ],
    explanation: 'Voltage drop is the voltage lost along the cable due to resistance and reactance. Excessive voltage drop causes equipment underperformance and non-compliance with standards.',
  },
  {
    id: 'derating',
    title: 'Derating Factor',
    formulas: [
      { label: 'Total derating', formula: 'F_total = F_temp × F_group × F_install × F_soil', vars: 'Each factor is ≤ 1.00. Combined factor reduces cable ampacity.' },
      { label: 'Required ampacity', formula: 'I_required = I_design / F_total', vars: 'The cable ampacity must equal or exceed this value.' },
    ],
    explanation: 'Derating reduces the cable current-carrying capacity due to heat buildup from temperature, grouping, installation method, and soil conditions. All four factors multiply together.',
  },
  {
    id: 'selection',
    title: 'Cable Selection Rule',
    formulas: [
      { label: 'Selection criteria', formula: 'I_ampacity(derated) ≥ I_design / F_total  AND  Vd% ≤ Vd_limit  AND  size ≥ min_size', vars: 'The smallest cable satisfying all three conditions is selected.' },
    ],
    explanation: 'The smallest cable that satisfies the ampacity check (after derating), voltage drop limit, and minimum size requirement is the preliminary recommended size.',
  },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

interface PowerCableAgentProps {
  projectName?: string;
  activeProjectId?: string | null;
}

export function PowerCableAgent({ projectName = 'Active Project', activeProjectId = null }: PowerCableAgentProps) {
  const [inputs, setInputs] = useState<CableInputs>(DEFAULT_INPUTS);
  const [openFormulas, setOpenFormulas] = useState<string[]>([]);

  // Auto-calculate on valid inputs — no manual trigger needed
  const autoResult = useMemo<CableResult | null>(() => {
    if (inputs.loadValue <= 0 || inputs.cableLengthM <= 0) return null;
    try { return runCalculation(inputs); } catch { return null; }
  }, [inputs]);

  const activeResult = autoResult;

  const set = <K extends keyof CableInputs>(key: K, value: CableInputs[K]) =>
    setInputs(prev => ({ ...prev, [key]: value }));

  const toggleConstruction = (val: string) => {
    setInputs(prev => ({
      ...prev,
      cableConstruction: prev.cableConstruction.includes(val)
        ? prev.cableConstruction.filter(v => v !== val)
        : [...prev.cableConstruction, val],
    }));
  };

  const toggleFormula = (id: string) =>
    setOpenFormulas(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const payload = activeResult ? buildPayload(inputs, activeResult, activeProjectId) : null;

  const voltage = getVoltage(inputs);

  return (
    <div className="cable-agent-page space-y-6 text-left">

      {/* ── Page Header ── */}
      <header className="module-hero">
        <div>
          <span className="module-kicker">Electrical Engineering Module</span>
          <h1 className="flex items-center gap-3">
            <Zap size={28} className="text-amber-400" />
            Power Cable Engineering Agent
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-serif leading-relaxed">
            Calculate preliminary cable current, voltage drop, resistance, derating, and cable size recommendations
            based on load, distance, installation conditions, and project assumptions.
            Project: <strong className="text-white">{projectName}</strong>
          </p>
        </div>

        {/* Top engineer review warning */}
        <div className="cable-engineer-disclaimer">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300 leading-relaxed">
            <strong>PRELIMINARY ESTIMATE ONLY.</strong> SAQR AI cable calculations are preliminary engineering estimates based on entered assumptions and demo cable tables. 
            Final cable sizing must be reviewed and approved by a qualified electrical engineer according to the project specification, manufacturer data, 
            IEC/Kahramaa/local authority requirements, installation conditions, and protection coordination.
          </p>
        </div>
      </header>

      {/* ── Main Layout: Inputs Left + Results Right ── */}
      <div className="cable-main-grid">

        {/* ════════════════════════════════════════════
            LEFT PANEL — INPUTS
            ════════════════════════════════════════════ */}
        <div className="cable-input-panel space-y-4">

          {/* Group 1 — Project & Equipment */}
          <div className="glass-panel p-4 space-y-3">
            <SectionHeader icon={<Activity className="w-4 h-4 text-amber-400" />} title="Circuit / Equipment" />
            <div className="form-group">
              <label className="form-label">Equipment / Circuit Name</label>
              <input
                type="text"
                className="form-input text-sm"
                placeholder="e.g. DB-L1 to AHU-4, Main feeder panel..."
                value={inputs.equipmentName}
                onChange={e => set('equipmentName', e.target.value)}
              />
            </div>
          </div>

          {/* Group 2 — Load Inputs */}
          <div className="glass-panel p-4 space-y-3">
            <SectionHeader icon={<Zap className="w-4 h-4 text-amber-400" />} title="Load Inputs" />

            <div className="cable-input-grid">
              <div className="form-group">
                <label className="form-label">Load Type</label>
                <select className="form-select text-sm" value={inputs.loadType} onChange={e => set('loadType', e.target.value as LoadType)}>
                  <option value="lighting">Lighting</option>
                  <option value="socket">Socket / Power</option>
                  <option value="hvac">HVAC</option>
                  <option value="motor">Motor</option>
                  <option value="ups">UPS</option>
                  <option value="server">Server Room</option>
                  <option value="panel_feeder">Panel Feeder</option>
                  <option value="general">General Equipment</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Load Value</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className="form-input text-sm flex-1"
                    value={inputs.loadValue}
                    onChange={e => set('loadValue', parseFloat(e.target.value) || 0)}
                  />
                  <select className="form-select text-sm w-20" value={inputs.loadUnit} onChange={e => set('loadUnit', e.target.value as LoadUnit)}>
                    <option>W</option>
                    <option>kW</option>
                    <option>VA</option>
                    <option>kVA</option>
                    <option>HP</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Power Factor</label>
                <input type="number" min={0.1} max={1} step={0.01} className="form-input text-sm" value={inputs.powerFactor} onChange={e => set('powerFactor', parseFloat(e.target.value) || 0.85)} />
              </div>

              {inputs.loadType === 'motor' && (
                <div className="form-group">
                  <label className="form-label">Motor Efficiency</label>
                  <input type="number" min={0.5} max={1} step={0.01} className="form-input text-sm" value={inputs.efficiency} onChange={e => set('efficiency', parseFloat(e.target.value) || 0.9)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Demand Factor</label>
                <input type="number" min={0} max={1} step={0.01} className="form-input text-sm" value={inputs.demandFactor} onChange={e => set('demandFactor', parseFloat(e.target.value) || 1)} />
              </div>

              <div className="form-group">
                <label className="form-label">Diversity Factor</label>
                <input type="number" min={0} max={1} step={0.01} className="form-input text-sm" value={inputs.diversityFactor} onChange={e => set('diversityFactor', parseFloat(e.target.value) || 1)} />
              </div>

              <div className="form-group">
                <label className="form-label">Safety Margin (%)</label>
                <input type="number" min={0} max={50} step={1} className="form-input text-sm" value={inputs.safetyMarginPct} onChange={e => set('safetyMarginPct', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Group 3 — Electrical Supply */}
          <div className="glass-panel p-4 space-y-3">
            <SectionHeader icon={<Activity className="w-4 h-4 text-cyan-400" />} title="Electrical Supply" />

            <div className="flex gap-2 mb-1">
              {(['SINGLE', 'THREE'] as PhaseType[]).map(p => (
                <button
                  key={p}
                  onClick={() => set('phaseType', p)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${inputs.phaseType === p ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  {p === 'SINGLE' ? '1-Phase' : '3-Phase'}
                </button>
              ))}
              <button
                onClick={() => set('isDC', !inputs.isDC)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${inputs.isDC ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-white/10 text-slate-400 hover:border-white/20'}`}
              >
                {inputs.isDC ? 'DC' : 'AC'}
              </button>
            </div>

            <div className="cable-input-grid">
              <div className="form-group">
                <label className="form-label">Voltage</label>
                <select className="form-select text-sm" value={inputs.voltagePreset} onChange={e => set('voltagePreset', e.target.value)}>
                  <option value="230">230 V</option>
                  <option value="240">240 V</option>
                  <option value="400">400 V</option>
                  <option value="415">415 V</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {inputs.voltagePreset === 'custom' && (
                <div className="form-group">
                  <label className="form-label">Custom Voltage (V)</label>
                  <input type="number" min={1} className="form-input text-sm" value={inputs.customVoltage} onChange={e => set('customVoltage', parseFloat(e.target.value) || 230)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select className="form-select text-sm" value={inputs.frequency} onChange={e => set('frequency', parseFloat(e.target.value))}>
                  <option value={50}>50 Hz</option>
                  <option value={60}>60 Hz</option>
                </select>
              </div>
            </div>
          </div>

          {/* Group 4 — Cable Route */}
          <div className="glass-panel p-4 space-y-3">
            <SectionHeader icon={<Wind className="w-4 h-4 text-cyan-400" />} title="Cable Route & Installation" />

            <div className="cable-input-grid">
              <div className="form-group">
                <label className="form-label">Cable Length (m)</label>
                <input type="number" min={1} className="form-input text-sm" value={inputs.cableLengthM} onChange={e => set('cableLengthM', parseFloat(e.target.value) || 1)} />
              </div>

              <div className="form-group">
                <label className="form-label">Route Type</label>
                <select className="form-select text-sm" value={inputs.routeType} onChange={e => set('routeType', e.target.value as RouteType)}>
                  <option value="cable_tray">Cable Tray</option>
                  <option value="cable_ladder">Cable Ladder</option>
                  <option value="conduit">Conduit</option>
                  <option value="trunking">Trunking</option>
                  <option value="underground">Underground</option>
                  <option value="direct">Direct</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Installation Method</label>
                <select className="form-select text-sm" value={inputs.installMethod} onChange={e => set('installMethod', e.target.value as InstallMethod)}>
                  <option value="free_air">Free Air / Open Tray</option>
                  <option value="perforated_tray">Perforated Tray</option>
                  <option value="conduit">In Conduit</option>
                  <option value="trunking">In Trunking</option>
                  <option value="underground_duct">Underground Duct</option>
                  <option value="thermal_insulation">Thermal Insulation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Parallel Runs</label>
                <input type="number" min={1} max={10} className="form-input text-sm" value={inputs.parallelRuns} onChange={e => set('parallelRuns', parseInt(e.target.value) || 1)} />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Cores</label>
                <select className="form-select text-sm" value={inputs.numCores} onChange={e => set('numCores', parseInt(e.target.value))}>
                  <option value={2}>2-core</option>
                  <option value={3}>3-core</option>
                  <option value={4}>4-core</option>
                  <option value={5}>5-core</option>
                  <option value={1}>Single-core</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ambient Temp (°C)</label>
                <input type="number" min={10} max={70} className="form-input text-sm" value={inputs.ambientTempC} onChange={e => set('ambientTempC', parseFloat(e.target.value) || 30)} />
              </div>

              {inputs.routeType === 'underground' && (
                <div className="form-group">
                  <label className="form-label">Soil Resistivity (°C·m/W)</label>
                  <input type="number" min={0} max={5} step={0.1} className="form-input text-sm" value={inputs.soilTempC} onChange={e => set('soilTempC', parseFloat(e.target.value) || 1)} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Circuits Grouped Together</label>
                <input type="number" min={1} max={20} className="form-input text-sm" value={inputs.groupingCount} onChange={e => set('groupingCount', parseInt(e.target.value) || 1)} />
              </div>
            </div>
          </div>

          {/* Group 5 — Route Environment & Risk */}
          <div className="glass-panel p-4 space-y-3">
            <SectionHeader icon={<Shield className="w-4 h-4 text-rose-400" />} title="Route Environment & Risk" subtitle="Used for armoring, shielding, LSZH, and fire-rated recommendations" />

            <div className="cable-input-grid">
              <div className="form-group">
                <label className="form-label">Route Environment</label>
                <select className="form-select text-sm" value={inputs.routeEnvironment} onChange={e => set('routeEnvironment', e.target.value as RouteEnvironment)}>
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="underground">Underground</option>
                  <option value="exposed">Exposed route</option>
                  <option value="public_building">Public building (hospital/school/mall)</option>
                  <option value="industrial">Industrial</option>
                  <option value="data_room">Data room / server room</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mechanical Risk</label>
                <select className="form-select text-sm" value={inputs.mechanicalRisk} onChange={e => set('mechanicalRisk', e.target.value as MechanicalRisk)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">EMI Risk</label>
                <select className="form-select text-sm" value={inputs.emiRisk} onChange={e => set('emiRisk', e.target.value as EMIRisk)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => set('lifeSafetyCircuit', !inputs.lifeSafetyCircuit)}
                className={`cable-toggle-btn ${inputs.lifeSafetyCircuit ? 'cable-toggle-active' : 'cable-toggle-inactive'}`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Life-Safety Circuit</span>
                <span className={`cable-toggle-indicator ${inputs.lifeSafetyCircuit ? 'bg-rose-500' : 'bg-slate-600'}`} />
              </button>
              {inputs.lifeSafetyCircuit && (
                <span className="text-[11px] text-rose-400 font-medium">Fire alarm / Emergency lighting / Smoke control</span>
              )}
            </div>
          </div>

          {/* Group 6 — Cable Material & Construction */}
          <div className="glass-panel p-4 space-y-3">
            <SectionHeader icon={<FileText className="w-4 h-4 text-cyan-400" />} title="Cable Material & Construction" />

            <div className="flex gap-2 mb-2">
              {(['COPPER', 'ALUMINUM'] as Material[]).map(m => (
                <button key={m} onClick={() => set('material', m)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${inputs.material === m ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-white/10 text-slate-400 hover:border-white/20'}`}>
                  {m === 'COPPER' ? '🟤 Copper' : '⚪ Aluminum'}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Insulation</label>
              <select className="form-select text-sm" value={inputs.insulation} onChange={e => set('insulation', e.target.value as Insulation)}>
                <option value="PVC">PVC</option>
                <option value="XLPE">XLPE</option>
                <option value="LSZH">LSZH</option>
                <option value="EPR">EPR</option>
              </select>
            </div>

            <div>
              <label className="form-label mb-2">Cable Construction (select all that apply)</label>
              <div className="cable-construction-grid">
                {[
                  { val: 'armored', label: 'Armored (SWA)' },
                  { val: 'shielded', label: 'Shielded/Screened' },
                  { val: 'fire_rated', label: 'Fire-Rated' },
                  { val: 'lszh', label: 'LSZH Sheath' },
                  { val: 'flexible', label: 'Flexible' },
                  { val: 'unarmored', label: 'Unarmored' },
                ].map(({ val, label }) => (
                  <label key={val} className="cable-checkbox-item">
                    <input
                      type="checkbox"
                      checked={inputs.cableConstruction.includes(val)}
                      onChange={() => toggleConstruction(val)}
                      className="rounded"
                    />
                    <span className="text-xs text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Group 7 — Design Limits */}
          <div className="glass-panel p-4 space-y-3">
            <SectionHeader icon={<Info className="w-4 h-4 text-slate-400" />} title="Design Limits" />
            <div className="cable-input-grid">
              <div className="form-group">
                <label className="form-label">Max Voltage Drop (%)</label>
                <div className="flex gap-1.5">
                  <input type="number" min={0.5} max={15} step={0.5} className="form-input text-sm" value={inputs.maxVoltageDropPct} onChange={e => set('maxVoltageDropPct', parseFloat(e.target.value) || 5)} />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => set('maxVoltageDropPct', 3)} className="px-2 py-1 text-[10px] rounded border border-white/10 text-slate-400 hover:border-amber-500 hover:text-amber-400">3%</button>
                    <button onClick={() => set('maxVoltageDropPct', 5)} className="px-2 py-1 text-[10px] rounded border border-white/10 text-slate-400 hover:border-amber-500 hover:text-amber-400">5%</button>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500">Lighting: 3% | Power: 5% (typical)</span>
              </div>
              <div className="form-group">
                <label className="form-label">Min Cable Size (mm²)</label>
                <select className="form-select text-sm" value={inputs.minCableSizeMm2} onChange={e => set('minCableSizeMm2', parseFloat(e.target.value))}>
                  {CABLE_TABLE.map(c => <option key={c.sizeMm2} value={c.sizeMm2}>{c.sizeMm2} mm²</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RIGHT PANEL — RESULTS
            ════════════════════════════════════════════ */}
        <div className="cable-results-panel space-y-4">

          {!activeResult ? (
            <div className="cable-empty-state">
              <Zap className="w-12 h-12 text-amber-500/40 mb-3" />
              <p className="text-slate-400 text-sm">Enter load and cable route details on the left to see calculations.</p>
              <p className="text-[11px] text-slate-500 mt-1">Results update automatically as you type.</p>
            </div>
          ) : (
            <>
              {/* Key Results Grid */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Key Results</p>
                <div className="cable-results-grid">
                  {[
                    { label: 'Design Current', value: `${activeResult.designCurrentA.toFixed(2)} A`, sub: `Calculated from ${activeResult.designLoadWatts >= 1000 ? (activeResult.designLoadWatts/1000).toFixed(2)+'kW' : activeResult.designLoadWatts.toFixed(0)+'W'} load`, color: 'cyan' },
                    { label: 'Total Derating', value: `×${activeResult.derating.total.toFixed(3)}`, sub: `Temp×Group×Install×Soil`, color: activeResult.derating.total < 0.6 ? 'rose' : 'amber' },
                    { label: 'Required Ampacity', value: `${activeResult.requiredAmpacityA.toFixed(1)} A`, sub: 'After derating correction', color: 'amber' },
                    { label: 'Cable Size', value: `${activeResult.selectedCableSizeMm2} mm²`, sub: `${inputs.material === 'COPPER' ? 'Copper' : 'Aluminum'} — Preliminary`, color: 'gold' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} className={`cable-result-card cable-result-card-${color}`}>
                      <p className="cable-result-label">{label}</p>
                      <p className="cable-result-value">{value}</p>
                      <p className="cable-result-sub">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary Results Row */}
              <div className="cable-secondary-results">
                {[
                  { label: 'Voltage Drop', value: `${activeResult.voltageDropV.toFixed(3)} V` },
                  { label: 'VD %', value: `${activeResult.voltageDropPct.toFixed(2)}%`, warn: activeResult.voltageDropPct > inputs.maxVoltageDropPct },
                  { label: 'Resistance', value: `${activeResult.resistanceOhm.toFixed(4)} Ω` },
                  { label: 'R per km', value: `${activeResult.resistanceOhmPerKm.toFixed(4)} Ω/km` },
                  { label: 'Supply Voltage', value: `${voltage} V` },
                  { label: 'Phase', value: inputs.phaseType === 'THREE' ? '3-Phase' : '1-Phase' },
                ].map(({ label, value, warn }) => (
                  <div key={label} className={`cable-secondary-card ${warn ? 'cable-secondary-warn' : ''}`}>
                    <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                    <p className={`text-sm font-bold ${warn ? 'text-rose-400' : 'text-white'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* ── WHY THIS CABLE WAS SELECTED ── */}
              <div className="glass-panel p-5 border border-cyan-500/20">
                <SectionHeader
                  icon={<Info className="w-4 h-4 text-cyan-400" />}
                  title="Why This Cable Was Selected"
                  subtitle="Step-by-step selection logic and criteria check"
                />
                <div className="cable-selection-table mt-3">
                  {[
                    {
                      label: 'Design Current',
                      value: `${activeResult.explanation.designCurrent.toFixed(2)} A`,
                      note: `Calculated from load inputs — this is the current the cable must carry.`,
                      pass: true,
                    },
                    {
                      label: 'Total Derating Factor',
                      value: `${activeResult.explanation.deratingFactor.toFixed(4)}`,
                      note: `${activeResult.derating.tempFactor} (temp) × ${activeResult.derating.groupFactor} (grouping) × ${activeResult.derating.installFactor} (install) × ${activeResult.derating.soilFactor} (soil)`,
                      pass: activeResult.derating.total > 0.5,
                    },
                    {
                      label: 'Required Corrected Ampacity',
                      value: `${activeResult.explanation.requiredAmpacity.toFixed(2)} A`,
                      note: `Design current ÷ derating factor — the cable must be rated at least this value before derating.`,
                      pass: true,
                    },
                    {
                      label: 'Selected Cable Ampacity',
                      value: `${activeResult.explanation.selectedCableAmpacity} A`,
                      note: `Rated ampacity of ${activeResult.selectedCableSizeMm2} mm² ${inputs.material === 'COPPER' ? 'Cu' : 'Al'} at reference conditions (preliminary table).`,
                      pass: activeResult.explanation.ampacityPass,
                    },
                    {
                      label: 'Voltage Drop Result',
                      value: `${activeResult.explanation.voltageDropV.toFixed(3)} V — ${activeResult.explanation.voltageDropPct.toFixed(2)}%`,
                      note: `Calculated over ${inputs.cableLengthM} m cable length.`,
                      pass: activeResult.explanation.voltageDropPass,
                    },
                    {
                      label: 'Voltage Drop Limit',
                      value: `${activeResult.explanation.voltageDropLimit}%`,
                      note: `Set design limit — ${activeResult.explanation.voltageDropPass ? 'complied with' : 'EXCEEDED — increase cable size or reduce length'}.`,
                      pass: activeResult.explanation.voltageDropPass,
                    },
                    {
                      label: 'Minimum Size Rule',
                      value: `≥ ${inputs.minCableSizeMm2} mm² → Got ${activeResult.selectedCableSizeMm2} mm²`,
                      note: activeResult.explanation.sizeRule,
                      pass: activeResult.explanation.minSizePass,
                    },
                    {
                      label: 'Engineer Review',
                      value: 'Always Required',
                      note: 'This output is a preliminary estimate. A qualified electrical engineer must verify all parameters before construction.',
                      pass: false,
                    },
                  ].map(({ label, value, note, pass }) => (
                    <div key={label} className="cable-selection-row">
                      <StatusIcon pass={label === 'Engineer Review' ? false : pass} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-300">{label}</span>
                          <span className={`text-xs font-bold font-mono ${label === 'Engineer Review' ? 'text-amber-400' : pass ? 'text-emerald-400' : 'text-rose-400'}`}>{value}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── CABLE CONSTRUCTION RECOMMENDATION ── */}
              <div className="glass-panel p-5">
                <SectionHeader
                  icon={<Shield className="w-4 h-4 text-amber-400" />}
                  title="Cable Construction Recommendation"
                  subtitle="Based on route environment, mechanical risk, EMI risk, and circuit type"
                />
                <div className="cable-recommendation-grid mt-3">
                  {[
                    { icon: <Shield className="w-4 h-4" />, title: 'Armoring (SWA)', level: activeResult.recommendation.armored, reason: activeResult.recommendation.armoredReason },
                    { icon: <Activity className="w-4 h-4" />, title: 'Shielding / Screening', level: activeResult.recommendation.shielded, reason: activeResult.recommendation.shieldedReason },
                    { icon: <Wind className="w-4 h-4" />, title: 'LSZH Sheath', level: activeResult.recommendation.lszh, reason: activeResult.recommendation.lszhReason },
                    { icon: <Flame className="w-4 h-4" />, title: 'Fire-Rated Cable', level: activeResult.recommendation.fireRated, reason: activeResult.recommendation.fireRatedReason },
                  ].map(({ icon, title, level, reason }) => (
                    <div key={title} className={`cable-rec-card cable-rec-${level.toLowerCase().replace('_', '-')}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{icon}</span>
                          <span className="text-xs font-bold text-white">{title}</span>
                        </div>
                        <RecommendationPill level={level} />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── PROTECTION COORDINATION WARNING ── */}
              <div className="cable-protection-warning">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-400 mb-1">Protection Coordination — Not Included</p>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed">
                    Protection device coordination, short-circuit withstand, earth fault loop impedance, and final authority compliance
                    are not included in this preliminary calculation and must be verified by a qualified electrical engineer.
                  </p>
                </div>
              </div>

              {/* ── DERATING BREAKDOWN ── */}
              <div className="glass-panel p-5">
                <SectionHeader
                  icon={<Activity className="w-4 h-4 text-slate-400" />}
                  title="Derating Factor Breakdown"
                  subtitle="All four factors multiply to give the total derating applied to cable ampacity"
                />
                <div className="cable-derating-grid mt-3">
                  {[
                    { label: 'Ambient Temperature', factor: activeResult.derating.tempFactor, detail: activeResult.derating.tempLabel, icon: '🌡️' },
                    { label: 'Circuit Grouping', factor: activeResult.derating.groupFactor, detail: activeResult.derating.groupLabel, icon: '📦' },
                    { label: 'Installation Method', factor: activeResult.derating.installFactor, detail: activeResult.derating.installLabel, icon: '🏗️' },
                    { label: 'Soil / Duct Condition', factor: activeResult.derating.soilFactor, detail: activeResult.derating.soilLabel, icon: '🌍' },
                  ].map(({ label, factor, detail, icon }) => (
                    <div key={label} className="cable-derating-card">
                      <span className="text-xl mb-1">{icon}</span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
                      <p className={`text-2xl font-black mt-1 ${factor < 0.7 ? 'text-rose-400' : factor < 0.85 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {factor.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono leading-relaxed">{detail}</p>
                    </div>
                  ))}
                </div>

                {/* Multiplication chain */}
                <div className="cable-derating-chain mt-4">
                  <span className="text-sm font-mono text-slate-300">{activeResult.derating.tempFactor}</span>
                  <span className="text-slate-600 text-sm font-bold">×</span>
                  <span className="text-sm font-mono text-slate-300">{activeResult.derating.groupFactor}</span>
                  <span className="text-slate-600 text-sm font-bold">×</span>
                  <span className="text-sm font-mono text-slate-300">{activeResult.derating.installFactor}</span>
                  <span className="text-slate-600 text-sm font-bold">×</span>
                  <span className="text-sm font-mono text-slate-300">{activeResult.derating.soilFactor}</span>
                  <span className="text-slate-600 text-sm font-bold">=</span>
                  <span className={`text-base font-black font-mono ${activeResult.derating.total < 0.6 ? 'text-rose-400' : activeResult.derating.total < 0.8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {activeResult.derating.total}
                  </span>
                  <span className="text-xs text-slate-500">total derating</span>
                </div>
              </div>

              {/* ── CABLE BOQ PREVIEW ── */}
              <div className="glass-panel p-5 border border-amber-500/20">
                <SectionHeader
                  icon={<FileText className="w-4 h-4 text-amber-400" />}
                  title="Cable BOQ Preview"
                  subtitle="Preliminary BOQ line item — for estimation only. Rates TBC by engineer."
                />
                <div className="cable-boq-preview mt-3">
                  <div className="cable-boq-grid">
                    {[
                      { label: 'Item Code', value: activeResult.boqItem.itemCode },
                      { label: 'Unit', value: activeResult.boqItem.unit },
                      { label: 'Quantity', value: `${activeResult.boqItem.quantity.toFixed(0)} m` },
                      { label: 'Unit Rate', value: activeResult.boqItem.unitRate },
                      { label: 'Total', value: activeResult.boqItem.total },
                      { label: 'Confidence', value: activeResult.boqItem.confidenceLevel },
                    ].map(({ label, value }) => (
                      <div key={label} className="cable-boq-field">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{label}</p>
                        <p className="text-sm text-white font-mono mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-slate-950/50 rounded-lg border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Description</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeResult.boqItem.description}</p>
                  </div>
                  <div className="mt-2 p-2 bg-amber-950/20 rounded border border-amber-800/30">
                    <p className="text-[10px] text-amber-400/80 leading-relaxed">{activeResult.boqItem.notes}</p>
                  </div>
                </div>
              </div>

              {/* ── WARNINGS ── */}
              {activeResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculation Warnings</p>
                  {activeResult.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-300/80 leading-relaxed">{w}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          CABLE SELECTION TABLE
          ════════════════════════════════════════════ */}
      <div className="glass-panel p-5">
        <SectionHeader
          icon={<FileText className="w-4 h-4 text-slate-400" />}
          title="Preliminary Cable Size Reference Table"
          subtitle="18 standard sizes — for reference only"
        />

        {/* Cable table disclaimer */}
        <div className="cable-table-warning mt-3">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-300/80 leading-relaxed">
            <strong>Cable Table Disclaimer:</strong> Cable ampacity values are preliminary demo references only. Final cable selection must use approved IEC/manufacturer/Kahramaa/project specification tables and must be validated by a qualified electrical engineer.
          </p>
        </div>

        <div className="table-container mt-3">
          <table className="eng-table cable-size-table">
            <thead>
              <tr>
                <th>Size (mm²)</th>
                <th>Cu Ampacity (A)</th>
                <th>Al Ampacity (A)</th>
                <th>Cu Ω/km</th>
                <th>Al Ω/km</th>
                <th>Status</th>
                <th>Typical Use</th>
              </tr>
            </thead>
            <tbody>
              {CABLE_TABLE.map(entry => {
                const isSelected = activeResult?.selectedCableSizeMm2 === entry.sizeMm2;
                const ampacity = inputs.material === 'COPPER' ? entry.cuAmpacity : (entry.alAmpacity ?? 0);
                const isSufficient = activeResult ? ampacity >= activeResult.requiredAmpacityA : null;
                return (
                  <tr key={entry.sizeMm2} className={isSelected ? 'cable-table-selected-row' : ''}>
                    <td className={`font-mono font-bold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                      {entry.sizeMm2} mm²
                      {isSelected && <span className="ml-2 text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-extrabold">SELECTED</span>}
                    </td>
                    <td className="font-mono text-cyan-300">{entry.cuAmpacity}</td>
                    <td className="font-mono text-slate-400">{entry.alAmpacity ?? '—'}</td>
                    <td className="font-mono text-slate-300">{entry.cuResistanceOhmPerKm}</td>
                    <td className="font-mono text-slate-400">{entry.alResistanceOhmPerKm ?? '—'}</td>
                    <td>
                      {isSelected ? (
                        <span className="badge badge-gold text-[10px]">✓ Selected</span>
                      ) : isSufficient === true ? (
                        <span className="badge badge-success text-[10px]">Available</span>
                      ) : isSufficient === false ? (
                        <span className="badge badge-danger text-[10px]">Insufficient</span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="text-slate-400 text-[11px]">{entry.typicalUse}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          FORMULA EXPLANATION ACCORDION
          ════════════════════════════════════════════ */}
      <div className="glass-panel p-5">
        <SectionHeader
          icon={<Info className="w-4 h-4 text-cyan-400" />}
          title="Formula Explanation"
          subtitle="Click any formula group to expand the detailed explanation with variable definitions"
        />
        <div className="space-y-2 mt-3">
          {FORMULAS.map(f => (
            <div key={f.id} className="cable-formula-card">
              <button
                className="cable-formula-header"
                onClick={() => toggleFormula(f.id)}
              >
                <span className="text-xs font-bold text-white">{f.title}</span>
                {openFormulas.includes(f.id)
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {openFormulas.includes(f.id) && (
                <div className="cable-formula-body">
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{f.explanation}</p>
                  <div className="space-y-2">
                    {f.formulas.map(({ label, formula, vars }) => (
                      <div key={label} className="cable-formula-item">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</p>
                        <div className="cable-formula-code">{formula}</div>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{vars}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          BOTTOM ENGINEER REVIEW DISCLAIMER
          ════════════════════════════════════════════ */}
      <div className="cable-engineer-disclaimer-full">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-400 mb-1">Engineer Review Required — Preliminary Output</p>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            SAQR AI cable calculations are preliminary engineering estimates based on entered assumptions and demo cable tables.
            Final cable sizing must be reviewed and approved by a qualified electrical engineer according to the project specification,
            manufacturer data, IEC/Kahramaa/local authority requirements, installation conditions, and protection coordination.
            This output does not constitute a certified engineering design and must not be used for construction without professional review and stamp.
          </p>
          {payload && (
            <p className="text-[10px] text-slate-500 mt-2 font-mono">
              Backend-ready payload: {Object.keys(payload).length} fields structured as CableCalculationPayload — ready for Phase 2 persistence.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
