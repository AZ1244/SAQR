import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  FileText,
  Activity
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface EarthingProps {
  onNavigate: (tab: string) => void;
}

export const EarthingAgent: React.FC<EarthingProps> = ({ onNavigate }) => {
  const [soilResistivity, setSoilResistivity] = useState(150); // Ohm.m (limestone/dry sand typical for Gulf/Qatar)
  const [rodLength, setRodLength] = useState(2.4); // meters (standard 8ft rod)
  const [rodDiameter, setRodDiameter] = useState(16); // millimeters
  const [rodCount, setRodCount] = useState(4); // number of parallel rods
  const [rodSpacing, setRodSpacing] = useState(5.0); // meters spacing between rods
  const [faultCurrentKa, setFaultCurrentKa] = useState(15); // fault current (kA)
  const [faultDurationSec, setFaultDurationSec] = useState(0.5); // duration
  const [phaseConductorSize, setPhaseConductorSize] = useState(35); // mm2
  const [breakerRating, setBreakerRating] = useState(100); // Amps

  const calculated = useMemo(() => {
    const d = rodDiameter / 1000; // diameter in meters
    const L = rodLength;
    const rho = soilResistivity;

    // Standard IEEE 80 / BS 7430 formula for single rod:
    // R = rho / (2 * pi * L) * (ln(4L/d) - 1)
    const R_single = (rho / (2 * Math.PI * L)) * (Math.log((4 * L) / d) - 1);

    // Parallel rods calculation (using spacing/length ratio)
    // R_parallel = (R_single / N) * correction_factor
    // Simple standard layout approximation (spacing S >= length L)
    const ratio = rodSpacing / L;
    let factor = 1.0;
    if (rodCount > 1) {
      if (ratio >= 2) {
        factor = 1.0 + (rodCount - 1) * 0.05;
      } else if (ratio >= 1) {
        factor = 1.0 + (rodCount - 1) * 0.12;
      } else {
        factor = 1.0 + (rodCount - 1) * 0.22;
      }
    }
    const R_parallel = (R_single / rodCount) * factor;

    // Sizing bonding conductors
    // S = (sqrt(I^2 * t)) / k
    // k for copper conductor with XLPE/PVC insulation is typically 143 or 115
    const kFactor = 143;
    const minCpcSize = (faultCurrentKa * 1000 * Math.sqrt(faultDurationSec)) / kFactor;
    
    // Nearest standard size
    const standardSizes = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];
    const selectedCpcSize = standardSizes.find(s => s >= minCpcSize) || 25;

    // Main bonding conductor size rule (BS 7671 / QCS):
    // Minimum bonding conductor size based on incoming phase size
    let mainBondingSize = 6;
    if (phaseConductorSize <= 16) mainBondingSize = 6;
    else if (phaseConductorSize <= 35) mainBondingSize = 10;
    else if (phaseConductorSize <= 50) mainBondingSize = 16;
    else mainBondingSize = 25;

    // Earth fault loop impedance check
    // Zs = Ze + Z_r <= Uo / Ia
    // Assume Ze typical substation is 0.2 ohms. Earth rod resistance R_parallel acts as local ground.
    const Zs = 0.2 + R_parallel;
    const Uo = 240;
    const Ia = breakerRating * 5; // Type-C MCB trip current = 5 * In
    const zsLimit = Uo / Ia;
    const zsPass = Zs <= zsLimit;

    // Warnings
    const warnings: string[] = [];
    if (R_parallel > 1.0) {
      warnings.push(`Combined earthing resistance (${R_parallel.toFixed(2)} Ω) exceeds standard 1.0 Ω QCS/Kahramaa limit for telecom/substations. Add more rods or apply chemical soil treatment.`);
    }
    if (!zsPass) {
      warnings.push(`Loop impedance Zs (${Zs.toFixed(2)} Ω) exceeds limit (${zsLimit.toFixed(2)} Ω) for a ${breakerRating}A Type-C breaker. Breaker may fail to trip instantly under Earth Fault. Settle for lower ground resistance.`);
    }
    if (rodSpacing < L) {
      warnings.push(`Rod spacing (${rodSpacing}m) is less than rod length (${L}m). Parallel efficiency is heavily reduced. Increase spacing to at least 1.0x to 2.0x length.`);
    }

    // BOQ Items
    const boqItems = [
      {
        code: 'QCS-EARTH-ROD',
        desc: `Copper-bonded steel core earth electrode rod, diameter ${rodDiameter}mm, length ${rodLength}m, including earth pit, coupler, and brass clamp.`,
        qty: rodCount,
        unit: 'Set',
        rate: 350
      },
      {
        code: `QCS-EARTH-COND-${selectedCpcSize}mm2`,
        desc: `Single core copper PVC earth CPC cable green/yellow, cross-sectional area ${selectedCpcSize} mm², inside conduit/tray.`,
        qty: rodCount * 12 + 25,
        unit: 'Meter',
        rate: selectedCpcSize * 0.9 + 5
      },
      {
        code: 'QCS-EARTH-BAR',
        desc: `12-way copper main disconnecting earth bar with testing links and insulated standoffs.`,
        qty: 1,
        unit: 'Set',
        rate: 850
      }
    ];

    return {
      R_single,
      R_parallel,
      minCpcSize,
      selectedCpcSize,
      mainBondingSize,
      Zs,
      zsLimit,
      zsPass,
      warnings,
      boqItems
    };
  }, [soilResistivity, rodLength, rodDiameter, rodCount, rodSpacing, faultCurrentKa, faultDurationSec, phaseConductorSize, breakerRating]);

  return (
    <div className="p-6 text-slate-100 overflow-y-auto h-full space-y-6 bg-[#07111F]">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => onNavigate('hub')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Engineering Agents Hub
        </button>
        <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
          Earthing & Bonding Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" />
          Earthing & Bonding Design Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Sizes grounding grids, calculates parallel earth rod resistances, loop impedances, and safety bonding CPC sizes.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. Grounding Grid Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Soil Resistivity (Ω·m)</label>
                <input
                  type="number"
                  value={soilResistivity}
                  onChange={(e) => setSoilResistivity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[9px] text-slate-500 block">Dry sand ~200, Clay ~30, Limestone ~150</span>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Rod Length (meters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rodLength}
                  onChange={(e) => setRodLength(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Rod Diameter (mm)</label>
                <input
                  type="number"
                  value={rodDiameter}
                  onChange={(e) => setRodDiameter(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Number of Parallel Rods</label>
                <input
                  type="number"
                  min="1"
                  value={rodCount}
                  onChange={(e) => setRodCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Rod Spacing (meters)</label>
                <input
                  type="number"
                  step="0.5"
                  value={rodSpacing}
                  onChange={(e) => setRodSpacing(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Phase Wire Size (mm²)</label>
                <input
                  type="number"
                  value={phaseConductorSize}
                  onChange={(e) => setPhaseConductorSize(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">2. Earth Fault & Protection Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Earth Fault Current (kA)</label>
                <input
                  type="number"
                  value={faultCurrentKa}
                  onChange={(e) => setFaultCurrentKa(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Fault Duration (seconds)</label>
                <input
                  type="number"
                  step="0.1"
                  value={faultDurationSec}
                  onChange={(e) => setFaultDurationSec(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Upstream Breaker Rating (A)</label>
                <input
                  type="number"
                  value={breakerRating}
                  onChange={(e) => setBreakerRating(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Breaker Curve Type</label>
                <select
                  disabled
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-slate-500 focus:outline-none"
                >
                  <option>Type-C MCB / MCCB</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Outputs Panel */}
        <div className="space-y-6">
          {/* Sizing Results */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-400" /> Sizing Calculations
            </h3>

            {calculated.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg space-y-1.5">
                {calculated.warnings.map((w, idx) => (
                  <p key={idx} className="text-[10px] text-amber-400 leading-tight flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Single Rod resistance</span>
                <span className="text-base font-bold text-white">{calculated.R_single.toFixed(2)} Ω</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Grid Resistance ({rodCount} rods)</span>
                <span className="text-lg font-bold text-emerald-400">{calculated.R_parallel.toFixed(2)} Ω</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">CPC Earth Wire</span>
                <span className="text-lg font-bold text-white">{calculated.selectedCpcSize} mm²</span>
                <span className="text-[9px] text-slate-400 block">Sized for {faultCurrentKa}kA fault</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Main Bonding size</span>
                <span className="text-lg font-bold text-white">{calculated.mainBondingSize} mm²</span>
                <span className="text-[9px] text-slate-400 block">Linked to {phaseConductorSize}mm² phase</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Earth Loop Impedance Audit (Zs)</span>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">Total Calculated Zs</span>
                <span className="text-sm font-bold text-white">{calculated.Zs.toFixed(2)} Ω</span>
              </div>
              <div className="flex justify-between items-baseline text-xs">
                <span className="text-slate-400">Max Permitted Zs</span>
                <span className="text-sm font-bold text-slate-300">{calculated.zsLimit.toFixed(2)} Ω</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-white/5 pt-2">
                <span className="text-xs font-bold text-slate-300">Impedance Safety Check</span>
                {calculated.zsPass ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">PASS</span>
                ) : (
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">FAIL</span>
                )}
              </div>
            </div>
          </div>

          {/* BOQ Preview */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> BOQ Line Items (Preliminary)
            </h3>
            
            <div className="space-y-3">
              {calculated.boqItems.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded border border-white/5 text-[11px] space-y-1">
                  <div className="flex justify-between font-mono text-cyan-400">
                    <span>{item.code}</span>
                    <span>QAR {(item.rate * item.qty).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 leading-snug">{item.desc}</p>
                  <div className="flex justify-between text-slate-500 text-[9px] pt-1">
                    <span>Qty: {item.qty} {item.unit}</span>
                    <span>Rate: QAR {item.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Formula accordion */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Engineering Formulas & References</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Earth rod resistance formula (IEEE 80 / BS 7430)</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">R = [ ρ / (2·π·L) ] × [ ln(4·L / d) - 1 ]</code>
            <p className="text-slate-400 text-[11px]">Computes the contact impedance of a single vertical earth electrode rod in homogeneous soil.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Conductor thermal sizing under fault (Adiabatic Equation)</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">S_mm² = √ ( I² · t ) / k</code>
            <p className="text-slate-400 text-[11px]">Sized per IEC 60364-5-54 to ensure the earth CPC conductor does not melt during earth faults before breaker clearing.</p>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
