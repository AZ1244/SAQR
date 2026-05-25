import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Lock,
  AlertTriangle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface AccessControlProps {
  onNavigate: (tab: string) => void;
}

export const AccessControlAgent: React.FC<AccessControlProps> = ({ onNavigate }) => {
  const [doorCount, setDoorCount] = useState(16);
  const [controllerCapacity, setControllerCapacity] = useState(4); // 2, 4, 8, or 16 doors/controller
  const [lockType, setLockType] = useState<'maglock' | 'strike'>('maglock');
  const [readerType, setReaderType] = useState<'card' | 'biometric'>('card');
  const [standbyHours, setStandbyHours] = useState(4); // backup hours
  const [safetyMargin, setSafetyMargin] = useState(25);

  const calculated = useMemo(() => {
    // 1. Controller Count
    const controllerCount = Math.ceil(doorCount / controllerCapacity) || 1;

    // 2. Power Loads:
    // Maglock: ~6W (500mA @ 12V DC)
    // Electric strike: ~3.6W (300mA @ 12V DC)
    const lockPowerW = lockType === 'maglock' ? 6.0 : 3.6;

    // Card reader: ~1.8W (150mA @ 12V DC)
    // Biometric reader: ~6.0W (500mA @ 12V DC)
    const readerPowerW = readerType === 'biometric' ? 6.0 : 1.8;

    // Controller mainboard power: ~10W
    const controllerBoardW = 10;

    // Total Continuous Power (Watts)
    const totalLockPowerW = doorCount * lockPowerW;
    const totalReaderPowerW = doorCount * readerPowerW; // assume 1 reader per door
    const totalControllerPowerW = controllerCount * controllerBoardW;
    
    const totalLoadPowerW = totalLockPowerW + totalReaderPowerW + totalControllerPowerW;
    
    // Sizing Power Supply Unit (PSU) with safety margin (default 25%)
    const sizedPsuPowerW = totalLoadPowerW * (1 + safetyMargin / 100);
    const sizedPsuAmpsAt12V = sizedPsuPowerW / 12;

    // 3. Backup Battery Sizing (AH @ 12V)
    // AH = (Total Load W * Standby Hours) / (12V * battery efficiency 0.85)
    const batteryEfficiency = 0.85;
    const calculatedAh = (totalLoadPowerW * standbyHours) / (12 * batteryEfficiency);

    // Warnings
    const warnings: string[] = [];
    if (lockType === 'maglock' && readerType === 'card' && doorCount > 24 && controllerCapacity < 4) {
      warnings.push('High door count using low capacity controllers. Upgrade to 8-door/16-door controllers to minimize technical wall space requirements.');
    }
    if (standbyHours < 4) {
      warnings.push('Standby backup hours under 4 hours. Verify client security standards; critical access control nodes typically require 4 to 8 hours backup.');
    }

    // BOQ Items
    const boqItems = [
      {
        code: `QCS-SEC-ACS-CTRL${controllerCapacity}`,
        desc: `Access Control System main controller panel, supporting up to ${controllerCapacity} doors interfaces, network TCP/IP link, cabinet included.`,
        qty: controllerCount,
        unit: 'Set',
        rate: controllerCapacity === 8 ? 4800 : controllerCapacity === 4 ? 2800 : 1800
      },
      {
        code: `QCS-SEC-ACS-PSU12V`,
        desc: `Linear Power Supply Unit cabinet, 12V DC output, capacity ${Math.ceil(sizedPsuAmpsAt12V)}A, automatic battery charger module, status LEDs.`,
        qty: controllerCount,
        unit: 'Nos',
        rate: 650
      },
      {
        code: 'QCS-SEC-ACS-BATT',
        desc: `Sealed Lead Acid (SLA) backup battery, 12V DC, capacity ${Math.round(calculatedAh / controllerCount) || 7} AH, fit inside PSU cabinet.`,
        qty: controllerCount * 2, // 2 batteries per controller for 24V or parallel 12V setup
        unit: 'Nos',
        rate: 180
      },
      {
        code: lockType === 'maglock' ? 'QCS-SEC-LOCK-MAG' : 'QCS-SEC-LOCK-STR',
        desc: lockType === 'maglock' 
          ? `Electromagnetic lock, 12V/24V DC, holding force 600 lbs (272 kg), including Z&L brackets for wooden/glass doors.`
          : `Electric strike lock release mechanism, 12V DC, fail-safe operation.`,
        qty: doorCount,
        unit: 'Nos',
        rate: lockType === 'maglock' ? 450 : 380
      },
      {
        code: readerType === 'biometric' ? 'QCS-SEC-RDR-BIO' : 'QCS-SEC-RDR-RFID',
        desc: readerType === 'biometric'
          ? `Biometric fingerprint and RFID card reader, IP65 weather-proof, Wiegand protocol.`
          : `Proximity RFID smart card reader, 13.56MHz MIFARE standard, slim design.`,
        qty: doorCount,
        unit: 'Nos',
        rate: readerType === 'biometric' ? 950 : 250
      }
    ];

    return {
      controllerCount,
      totalLoadPowerW,
      sizedPsuPowerW,
      sizedPsuAmpsAt12V,
      calculatedAh,
      warnings,
      boqItems
    };
  }, [doorCount, controllerCapacity, lockType, readerType, standbyHours, safetyMargin]);

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
          Access Control Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Lock className="w-6 h-6 text-amber-400" />
          Access Control System (ACS) Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Calculates controller sizing channels, electronic lock loads, readers power demands, power supply requirements, and standby battery capacities.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. Security Node Inputs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Total Access Controlled Doors</label>
                <input
                  type="number"
                  value={doorCount}
                  onChange={(e) => setDoorCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Controller Capacity (Doors/Panel)</label>
                <select
                  value={controllerCapacity}
                  onChange={(e) => setControllerCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={2}>2 Doors Controller</option>
                  <option value={4}>4 Doors Controller</option>
                  <option value={8}>8 Doors Controller</option>
                  <option value={16}>16 Doors Controller</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Lock Device Type</label>
                <select
                  value={lockType}
                  onChange={(e) => setLockType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                >
                  <option value="maglock">Magnetic Lock (6W typical)</option>
                  <option value="strike">Electric Strike (3.6W typical)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Reader Standard</label>
                <select
                  value={readerType}
                  onChange={(e) => setReaderType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                >
                  <option value="card">RFID Proximity Card (1.8W)</option>
                  <option value="biometric">Fingerprint Biometric (6.0W)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Standby Autonomy (Hours)</label>
                <input
                  type="number"
                  value={standbyHours}
                  onChange={(e) => setStandbyHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Safety Margin (%)</label>
                <input
                  type="number"
                  value={safetyMargin}
                  onChange={(e) => setSafetyMargin(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="space-y-6">
          {/* Sizing results */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> ACS Power Sizing
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
                <span className="text-slate-500 font-semibold block">Controller Panels</span>
                <span className="text-lg font-bold text-white">{calculated.controllerCount} units</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Total Load Power</span>
                <span className="text-lg font-bold text-white">{calculated.totalLoadPowerW.toFixed(1)} W</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Sized PSU Load</span>
                <span className="text-lg font-bold text-white">{calculated.sizedPsuPowerW.toFixed(1)} W</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Total Battery capacity</span>
                <span className="text-lg font-bold text-emerald-400">{calculated.calculatedAh.toFixed(1)} AH</span>
                <span className="text-[9px] text-slate-400 block">Sized for {standbyHours} Hours</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Recommended Power Supply</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300 font-semibold">PSU Output Amps (12V DC)</span>
                <span className="text-base font-extrabold text-amber-400">{calculated.sizedPsuAmpsAt12V.toFixed(1)} A</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-tight border-t border-white/5 pt-2">
                Requires standard 12V 5A or 10A multi-output distributed access power controllers.
              </p>
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

      {/* Formulas */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Engineering Formulas & References</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Standby Battery Capacity Sizing (12V DC SLA)</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">Capacity_AH = ( P_total × t_hours ) / ( 12V × η_battery )</code>
            <p className="text-slate-400 text-[11px]">Sized with 85% safety battery discharge efficiency to guarantee continuous access system operation during building mains failures.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Important Life Safety Interlock standard (NFPA 101)</strong>
            <p className="text-slate-400 text-[11px]">
              All electromagnetic locks (maglocks) on escape doors MUST be interlocked with the building Fire Alarm Control Panel (FACP) through fail-safe relays. Locks must immediately release power upon fire alarm trigger, regardless of controller network status.
            </p>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
