import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  FileText,
  Trash2
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface RoomEmergencyInput {
  id: string;
  name: string;
  area: number;
  type: 'open_area' | 'corridor' | 'high_risk';
  exitDoors: number;
}

interface EmergencyLightingProps {
  onNavigate: (tab: string) => void;
}

export const EmergencyLightingAgent: React.FC<EmergencyLightingProps> = ({ onNavigate }) => {
  const [durationHours, setDurationHours] = useState(3); // 3 hours (standard Kahramaa/BS EN 1838)
  const [fittingPowerW, setFittingPowerW] = useState(5); // average emergency LED power
  const [batteryVoltage, setBatteryVoltage] = useState(24); // DC battery system voltage
  const [systemType, setSystemType] = useState<'self_contained' | 'cbs'>('self_contained'); // self-contained vs Central Battery System

  // Realistic room inputs
  const [rooms, setRooms] = useState<RoomEmergencyInput[]>([
    { id: '1', name: 'Open Office Space A', area: 250, type: 'open_area', exitDoors: 2 },
    { id: '2', name: 'Main Reception Corridor', area: 85, type: 'corridor', exitDoors: 2 },
    { id: '3', name: 'HV Technical Switchroom', area: 45, type: 'high_risk', exitDoors: 1 },
    { id: '4', name: 'West Fire Exit staircase', area: 35, type: 'corridor', exitDoors: 1 },
    { id: '5', name: 'Data Server Room', area: 60, type: 'high_risk', exitDoors: 1 }
  ]);

  const addRoom = () => {
    const newId = (rooms.length + 1).toString();
    setRooms([...rooms, {
      id: newId,
      name: `New Room ${newId}`,
      area: 50,
      type: 'open_area',
      exitDoors: 1
    }]);
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const updateRoomField = (id: string, field: keyof RoomEmergencyInput, value: any) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const calculated = useMemo(() => {
    let totalEmergencyFittings = 0;
    let totalExitSigns = 0;
    let totalArea = 0;

    const roomDetails = rooms.map(r => {
      totalArea += r.area;
      // Rule-of-thumb spacing rules matching BS EN 1838:
      // Open area (0.5 lux min): 1 fitting covers ~25 sqm
      // Corridor (1.0 lux min escape route center): 1 fitting covers ~15 sqm
      // High-risk task area (15 lux or 10% of normal): 1 fitting covers ~10 sqm
      let fittingQty = 0;
      if (r.type === 'open_area') {
        fittingQty = Math.ceil(r.area / 25);
      } else if (r.type === 'corridor') {
        fittingQty = Math.ceil(r.area / 15);
      } else {
        fittingQty = Math.ceil(r.area / 10);
      }

      totalEmergencyFittings += fittingQty;
      totalExitSigns += r.exitDoors; // 1 sign per exit door minimum

      return {
        ...r,
        fittingQty,
        exitSignQty: r.exitDoors
      };
    });

    // Electrical load sizing
    const emergencyFittingLoadW = totalEmergencyFittings * fittingPowerW;
    const exitSignLoadW = totalExitSigns * 3; // exit signs average 3W LED
    const totalConnectedLoadW = emergencyFittingLoadW + exitSignLoadW;

    // Sizing battery capacity
    // AH = (Total Watts * Hours) / (Voltage * Discharge Depth 0.8 * Efficiency 0.9)
    const dischargeDepth = 0.8;
    const efficiency = 0.9;
    const calculatedAh = (totalConnectedLoadW * durationHours) / (batteryVoltage * dischargeDepth * efficiency);

    // Automation: recommend system type
    // If total fitting count > 45 or load > 250W, central battery system is strongly recommended
    const recommendedSystem = totalEmergencyFittings > 45 || totalConnectedLoadW > 250 ? 'cbs' : 'self_contained';

    // Warnings
    const warnings: string[] = [];
    if (durationHours < 3) {
      warnings.push('Selected emergency duration is under 3 hours. Verify compliance; many regions (like Qatar QCDD/Kahramaa) require 3 hours minimum.');
    }
    if (recommendedSystem === 'cbs' && systemType === 'self_contained') {
      warnings.push(`High project scale (${totalEmergencyFittings} fittings, ${totalConnectedLoadW}W). A centralized Central Battery System (CBS) is highly recommended over individual battery fittings for lower maintenance costs.`);
    }

    // BOQ Items
    const boqItems = [];
    if (systemType === 'self_contained') {
      boqItems.push({
        code: 'QCS-LGT-EM-SC',
        desc: `Self-contained emergency LED non-maintained luminaire, 3-hour battery backup pack, wall/ceiling mounted.`,
        qty: totalEmergencyFittings,
        unit: 'Nos',
        rate: 220
      });
      boqItems.push({
        code: 'QCS-LGT-EXIT-SC',
        desc: `Self-contained LED exit sign luminaire, maintained, double-sided running man arrow legend, 3-hour backup battery.`,
        qty: totalExitSigns,
        unit: 'Nos',
        rate: 280
      });
    } else {
      boqItems.push({
        code: 'QCS-LGT-EM-CBS',
        desc: `Slave emergency LED non-maintained luminaire, 24V/110V DC external supply, compatible with CBS controller.`,
        qty: totalEmergencyFittings,
        unit: 'Nos',
        rate: 140
      });
      boqItems.push({
        code: 'QCS-LGT-EXIT-CBS',
        desc: `Slave LED exit sign luminaire, maintained, double-sided running man legend, 24V/110V DC.`,
        qty: totalExitSigns,
        unit: 'Nos',
        rate: 190
      });
      boqItems.push({
        code: `QCS-LGT-CBS-${Math.ceil(calculatedAh)}AH`,
        desc: `Central Battery System (CBS) panel cabinet, ${batteryVoltage}V DC output, equipped with VRLA batteries rated ${Math.ceil(calculatedAh)} AH, auto-transfer charger, and monitoring zone card.`,
        qty: 1,
        unit: 'Set',
        rate: 7500 + Math.ceil(calculatedAh) * 95
      });
    }

    return {
      roomDetails,
      totalEmergencyFittings,
      totalExitSigns,
      totalConnectedLoadW,
      calculatedAh,
      recommendedSystem,
      warnings,
      boqItems
    };
  }, [rooms, durationHours, fittingPowerW, batteryVoltage, systemType]);

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
          Emergency Lighting Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-400" />
          Emergency Lighting & Exit Sign Sizing Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Calculates escape route emergency luminaires, exit directional sign counts, battery load parameters, and battery AH capacities.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. System Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">System Architecture</label>
                <select
                  value={systemType}
                  onChange={(e) => setSystemType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="self_contained">Self-Contained (Batteries inside fittings)</option>
                  <option value="cbs">Central Battery System (CBS)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Battery Autonomy (hours)</label>
                <input
                  type="number"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Fitting Wattage (W)</label>
                <input
                  type="number"
                  value={fittingPowerW}
                  onChange={(e) => setFittingPowerW(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">System DC Voltage (V)</label>
                <input
                  type="number"
                  disabled={systemType === 'self_contained'}
                  value={batteryVoltage}
                  onChange={(e) => setBatteryVoltage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white disabled:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">2. Room & Area Dimensions</h3>
              <button
                onClick={addRoom}
                className="flex items-center gap-1 py-1 px-3 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-all"
              >
                + Add Space
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2 px-3">Space Name</th>
                    <th className="py-2 px-3">Area (sqm)</th>
                    <th className="py-2 px-3">Safety Risk Type</th>
                    <th className="py-2 px-3">Exit Doors</th>
                    <th className="py-2 px-3 text-center">Fittings Required</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {calculated.roomDetails.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={r.name}
                          onChange={(e) => updateRoomField(r.id, 'name', e.target.value)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={r.area}
                          onChange={(e) => updateRoomField(r.id, 'area', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={r.type}
                          onChange={(e) => updateRoomField(r.id, 'type', e.target.value as any)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        >
                          <option value="open_area">Open Area (Anti-panic)</option>
                          <option value="corridor">Corridor (Escape Route)</option>
                          <option value="high_risk">High Risk Technical Room</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={r.exitDoors}
                          onChange={(e) => updateRoomField(r.id, 'exitDoors', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center text-amber-400 font-bold">
                        {r.fittingQty}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeRoom(r.id)}
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
          {/* Sizing calculation */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Safety Calculations
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
                <span className="text-slate-500 font-semibold block">Total Emergency Lights</span>
                <span className="text-lg font-bold text-white">{calculated.totalEmergencyFittings} fittings</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Total Exit Signs</span>
                <span className="text-lg font-bold text-white">{calculated.totalExitSigns} units</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Calculated DC Load</span>
                <span className="text-lg font-bold text-white">{calculated.totalConnectedLoadW} W</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5 font-semibold">
                <span className="text-slate-500 block">Recommended System</span>
                <span className="text-xs text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block mt-1">
                  {calculated.recommendedSystem === 'cbs' ? 'Central Battery' : 'Self-Contained'}
                </span>
              </div>
            </div>

            {systemType === 'cbs' && (
              <div className="bg-cyan-500/5 p-4 rounded border border-cyan-500/20 space-y-1 text-xs">
                <span className="text-cyan-400 font-bold block">Central CBS Battery Sizing</span>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-400">Total backup AH required</span>
                  <span className="text-base font-extrabold text-cyan-400">{calculated.calculatedAh.toFixed(1)} AH</span>
                </div>
              </div>
            )}
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

      {/* Formulas */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Emergency Spacing Standards & References</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Minimum escape illuminance rules (BS EN 1838 / ISO 30061)</strong>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] mt-1">
              <li>Escape routes up to 2m wide: 1.0 lux minimum along the route centerline, 0.5 lux on central band.</li>
              <li>Anti-panic open areas: 0.5 lux minimum excluding 0.5m border.</li>
              <li>High-risk task areas: 10% of normal light level or 15 lux minimum, whichever is higher.</li>
            </ul>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Central Battery System backup sizing</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">Capacity_AH = (P_total × t_hours) / (V_DC × η_charger × DoD)</code>
            <p className="text-slate-400 text-[11px]">Sized with 80% maximum Depth of Discharge (DoD) and 90% converter efficiency buffer margins.</p>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
