import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Network,
  AlertTriangle,
  TrendingUp,
  FileText,
  Trash2
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface CablingAreaInput {
  id: string;
  name: string;
  workstations: number;
  outletsPerWorkstation: number;
  averageLengthM: number;
}

interface CablingProps {
  onNavigate: (tab: string) => void;
}

export const StructuredCablingAgent: React.FC<CablingProps> = ({ onNavigate }) => {
  const [cableType, setCableType] = useState<'Cat6' | 'Cat6A' | 'Cat7'>('Cat6A');
  const [upsUHeight, setUpsUHeight] = useState(3); // Rack Units for UPS
  const [spareCapacity, setSpareCapacity] = useState(25); // growth spare percentage
  const [designLevel, setDesignLevel] = useState<'economy' | 'standard' | 'premium'>('standard');

  const [areas, setAreas] = useState<CablingAreaInput[]>([
    { id: '1', name: 'GF Open Office Staff', workstations: 48, outletsPerWorkstation: 2, averageLengthM: 45 },
    { id: '2', name: '1F Executive Suites', workstations: 12, outletsPerWorkstation: 4, averageLengthM: 65 },
    { id: '3', name: 'Conference Rooms A/B', workstations: 6, outletsPerWorkstation: 4, averageLengthM: 35 },
    { id: '4', name: 'Reception & Helpdesk', workstations: 8, outletsPerWorkstation: 2, averageLengthM: 25 },
    { id: '5', name: 'Server / IDF Room links', workstations: 4, outletsPerWorkstation: 8, averageLengthM: 15 }
  ]);

  const addArea = () => {
    const newId = (areas.length + 1).toString();
    setAreas([...areas, {
      id: newId,
      name: `New Area ${newId}`,
      workstations: 10,
      outletsPerWorkstation: 2,
      averageLengthM: 30
    }]);
  };

  const removeArea = (id: string) => {
    setAreas(areas.filter(a => a.id !== id));
  };

  const updateAreaField = (id: string, field: keyof CablingAreaInput, value: any) => {
    setAreas(areas.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const calculated = useMemo(() => {
    let totalOutlets = 0;
    let totalCableLengthM = 0;
    let maxDistanceM = 0;

    areas.forEach(a => {
      const outlets = a.workstations * a.outletsPerWorkstation;
      totalOutlets += outlets;
      totalCableLengthM += outlets * a.averageLengthM;
      if (a.averageLengthM > maxDistanceM) {
        maxDistanceM = a.averageLengthM;
      }
    });

    // Rack calculation
    // 24 ports per patch panel (1U)
    const patchPanelsCount = Math.ceil(totalOutlets / 24);
    // 24 ports per active switch (1U)
    const switchesCount = Math.ceil(totalOutlets / 24);
    // Cable managers (1U per patch panel)
    const cableManagersCount = patchPanelsCount;

    // Fixed elements: UPS (upsUHeight), Cable Tray/Fiber Drawer (2U), Power PDU (1U), Shelf (1U)
    const activeUsNeeded = patchPanelsCount * 1 + switchesCount * 1 + cableManagersCount * 1 + upsUHeight + 2 + 1 + 1;
    // Apply growth spare
    const totalUsNeeded = Math.ceil(activeUsNeeded * (1 + spareCapacity / 100));

    // Standard Rack sizing selection
    const standardRackUs = [6, 9, 12, 18, 22, 27, 32, 42, 47];
    const recommendedRackHeightU = standardRackUs.find(u => u >= totalUsNeeded) || 42;

    // Cable bundle area and tray size recommendation
    // Cat6A typical diameter = 7.5mm. Cross-sectional area = pi * r2 = 3.14 * 3.75^2 ≈ 44 mm²
    const csaPerCable = cableType === 'Cat6A' ? 48 : cableType === 'Cat7' ? 56 : 38;
    const totalBundleCsa = totalOutlets * csaPerCable;
    // Sizing for containment with 40% maximum fill factor allowance
    const requiredTrayWidthMm = Math.ceil((totalBundleCsa / 0.4) / 50); // assuming 50mm tray depth

    // Warnings
    const warnings: string[] = [];
    if (maxDistanceM > 90) {
      warnings.push(`Warning: Long cable run detected (${maxDistanceM}m). Permanent horizontal copper links must not exceed 90 meters per ANSI/TIA-568 standard. Relocate IDF or use Fiber optic links.`);
    }
    if (recommendedRackHeightU > 47) {
      warnings.push(`Extremely high rack unit count (${recommendedRackHeightU}U). Split network nodes into multiple IDF rack locations.`);
    }

    // BOQ Items
    const boqItems = [
      {
        code: `QCS-ELV-CABLE-${cableType}`,
        desc: `4-pair U/UTP structured horizontal cabling, Category ${cableType}, LSZH jacket, 305m drum.`,
        qty: Math.ceil(totalCableLengthM / 305),
        unit: 'Drum',
        rate: cableType === 'Cat6A' ? 780 : cableType === 'Cat7' ? 950 : 620
      },
      {
        code: `QCS-ELV-OUTLET`,
        desc: `RJ45 Cat6A copper data outlet, dual-port faceplate with shutter and labeling window.`,
        qty: Math.ceil(totalOutlets / 2),
        unit: 'Nos',
        rate: 85
      },
      {
        code: `QCS-ELV-PP-24P`,
        desc: `24-port Category ${cableType} modular patch panel loaded with RJ45 jacks, 1U height.`,
        qty: patchPanelsCount,
        unit: 'Nos',
        rate: 650
      },
      {
        code: `QCS-ELV-RACK-${recommendedRackHeightU}U`,
        desc: `${recommendedRackHeightU}U height, 800mm width x 1000mm depth network server cabinet, floor standing, glass front door, cooling fans, and vertical PDU.`,
        qty: 1,
        unit: 'Set',
        rate: recommendedRackHeightU >= 42 ? 3800 : 2500
      }
    ];

    return {
      totalOutlets,
      totalCableLengthM,
      patchPanelsCount,
      switchesCount,
      cableManagersCount,
      totalUsNeeded,
      recommendedRackHeightU,
      requiredTrayWidthMm,
      warnings,
      boqItems
    };
  }, [areas, cableType, upsUHeight, spareCapacity, designLevel]);

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
          Structured Cabling & Rack Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Network className="w-6 h-6 text-amber-400" />
          Structured Cabling & Rack Design Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Sizes outlets, estimates Category cabling lengths, patch panel ports counts, and details equipment network rack sizes.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. Cable and UPS Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Cable Specification</label>
                <select
                  value={cableType}
                  onChange={(e) => setCableType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Cat6">Cat 6 U/UTP</option>
                  <option value="Cat6A">Cat 6A F/UTP (10G ready)</option>
                  <option value="Cat7">Cat 7 S/FTP (High shielding)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">UPS Height (U)</label>
                <input
                  type="number"
                  value={upsUHeight}
                  onChange={(e) => setUpsUHeight(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Rack Spare Margin (%)</label>
                <input
                  type="number"
                  value={spareCapacity}
                  onChange={(e) => setSpareCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Specification Class</label>
                <select
                  value={designLevel}
                  onChange={(e) => setDesignLevel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="economy">Economy Grade</option>
                  <option value="standard">Standard Grade</option>
                  <option value="premium">Premium Grade</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">2. Office Space Outlet Allocations</h3>
              <button
                onClick={addArea}
                className="flex items-center gap-1 py-1 px-3 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-all"
              >
                + Add Office Zone
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2 px-3">Zone / Space Name</th>
                    <th className="py-2 px-3">Workstations</th>
                    <th className="py-2 px-3">Outlets/Desk</th>
                    <th className="py-2 px-3">Avg Route (m)</th>
                    <th className="py-2 px-3 text-center">Total Outlets</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {areas.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={a.name}
                          onChange={(e) => updateAreaField(a.id, 'name', e.target.value)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={a.workstations}
                          onChange={(e) => updateAreaField(a.id, 'workstations', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={a.outletsPerWorkstation}
                          onChange={(e) => updateAreaField(a.id, 'outletsPerWorkstation', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={a.averageLengthM}
                          onChange={(e) => updateAreaField(a.id, 'averageLengthM', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center text-cyan-400 font-bold">
                        {a.workstations * a.outletsPerWorkstation}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeArea(a.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="space-y-6">
          {/* Key sizing results */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Network Infrastructure
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
                <span className="text-slate-500 font-semibold block">Total RJ45 Outlets</span>
                <span className="text-lg font-bold text-white">{calculated.totalOutlets} ports</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Total Cable Length</span>
                <span className="text-lg font-bold text-white">{calculated.totalCableLengthM.toLocaleString()} m</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Rack Units Needed</span>
                <span className="text-lg font-bold text-white">{calculated.totalUsNeeded} U</span>
                <span className="text-[9px] text-slate-400 block">Incl. {spareCapacity}% growth</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Min Cable Tray Width</span>
                <span className="text-lg font-bold text-emerald-400">{calculated.requiredTrayWidthMm} mm</span>
                <span className="text-[9px] text-slate-400 block">Sized for Cat6A volume</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Recommended Rack Cabinet Sizing</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300 font-semibold">Rack Size Height</span>
                <span className="text-base font-extrabold text-amber-400">{calculated.recommendedRackHeightU}U Cabinet</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 border-t border-white/5 pt-2">
                <span>Patch Panels: {calculated.patchPanelsCount}U</span>
                <span>Switches: {calculated.switchesCount}U</span>
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

      {/* Formulations */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Engineering Formulas & References</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Maximum distance limits (ANSI/TIA-568-C.2)</strong>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] mt-1">
              <li>Permanent horizontal link: 90 meters max solid-core conductor cabling.</li>
              <li>Work area patch cord allowance: 5 meters max stranded-core patch cord.</li>
              <li>Telecommunication room patch cord: 5 meters max stranded-core patch cord.</li>
              <li>Total channel length: 100 meters maximum channel link.</li>
            </ul>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Cable bundle area containment sizing</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">Width_Mm = [ (N_cables × CSA_cable) / 0.40 ] / Depth_Mm</code>
            <p className="text-slate-400 text-[11px]">Calculates minimum tray size allowing 40% physical fill index for air circulation and future maintenance access.</p>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
