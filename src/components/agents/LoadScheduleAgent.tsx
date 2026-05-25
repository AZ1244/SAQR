import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Zap,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface CircuitItem {
  id: string;
  name: string;
  loadType: 'lighting' | 'power_socket' | 'hvac' | 'motor' | 'ups' | 'other';
  loadKw: number;
  qty: number;
  demandFactor: number;
  powerFactor: number;
}

interface LoadScheduleProps {
  onNavigate: (tab: string) => void;
}

export const LoadScheduleAgent: React.FC<LoadScheduleProps> = ({ onNavigate }) => {
  const [panelName, setPanelName] = useState('DB-GF-Power');
  const [voltage, setVoltage] = useState(415);
  const [phase, setPhase] = useState<'SINGLE' | 'THREE'>('THREE');
  const [diversityFactor, setDiversityFactor] = useState(0.85);
  const [spareCapacity, setSpareCapacity] = useState(20);
  const [designLevel, setDesignLevel] = useState<'economy' | 'standard' | 'premium'>('standard');
  const targetPF = 0.95;

  // Pre-populate with realistic DB circuits to show high professionalism out-of-the-box
  const [circuits, setCircuits] = useState<CircuitItem[]>([
    { id: '1', name: 'GF Lighting Circuit 1', loadType: 'lighting', loadKw: 1.2, qty: 1, demandFactor: 0.9, powerFactor: 0.9 },
    { id: '2', name: 'GF Lighting Circuit 2', loadType: 'lighting', loadKw: 1.5, qty: 1, demandFactor: 0.9, powerFactor: 0.9 },
    { id: '3', name: 'Ring Main Sockets GF', loadType: 'power_socket', loadKw: 3.0, qty: 2, demandFactor: 0.5, powerFactor: 0.85 },
    { id: '4', name: 'HVAC FCU 1-3 GF', loadType: 'hvac', loadKw: 4.5, qty: 3, demandFactor: 0.8, powerFactor: 0.82 },
    { id: '5', name: 'Server UPS Power Feed', loadType: 'ups', loadKw: 8.0, qty: 1, demandFactor: 1.0, powerFactor: 0.95 },
    { id: '6', name: 'Main Water Pump Motor', loadType: 'motor', loadKw: 5.5, qty: 1, demandFactor: 1.0, powerFactor: 0.8 }
  ]);

  const addCircuit = () => {
    const newId = (circuits.length + 1).toString();
    setCircuits([...circuits, {
      id: newId,
      name: `New Circuit ${newId}`,
      loadType: 'power_socket',
      loadKw: 2.0,
      qty: 1,
      demandFactor: 0.8,
      powerFactor: 0.85
    }]);
  };

  const removeCircuit = (id: string) => {
    setCircuits(circuits.filter(c => c.id !== id));
  };

  const updateCircuitField = (id: string, field: keyof CircuitItem, value: any) => {
    setCircuits(circuits.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculated = useMemo(() => {
    let totalConnectedKw = 0;
    let totalConnectedKva = 0;
    let weightedPfSum = 0;
    let totalDemandKwSum = 0;

    circuits.forEach(c => {
      const circuitKw = c.loadKw * c.qty;
      const circuitKva = circuitKw / c.powerFactor;
      totalConnectedKw += circuitKw;
      totalConnectedKva += circuitKva;
      weightedPfSum += c.powerFactor * circuitKw;
      totalDemandKwSum += circuitKw * c.demandFactor;
    });

    const averagePf = totalConnectedKw > 0 ? weightedPfSum / totalConnectedKw : 0.85;
    
    // Applying panel-level diversity factor
    const totalDemandKw = totalDemandKwSum * diversityFactor;
    const totalDemandKva = totalDemandKw / averagePf;

    // Sizing Incomer (including spare factor)
    const maxDemandKw = totalDemandKw * (1 + spareCapacity / 100);
    const maxDemandKva = maxDemandKw / averagePf;

    // Incomer current
    let incomerCurrentA = 0;
    if (phase === 'THREE') {
      incomerCurrentA = (maxDemandKva * 1000) / (Math.sqrt(3) * voltage);
    } else {
      incomerCurrentA = (maxDemandKva * 1000) / voltage;
    }

    // Recommended MCCB incomer standard ratings
    const standardMccbRatings = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600];
    const recommendedMccb = standardMccbRatings.find(r => r >= incomerCurrentA * 1.25) || 125;

    // PFC sizing (if average PF is less than target PF)
    let pfcKvar = 0;
    if (averagePf > 0 && averagePf < targetPF) {
      const phiCurrent = Math.acos(averagePf);
      const phiTarget = Math.acos(targetPF);
      pfcKvar = maxDemandKw * (Math.tan(phiCurrent) - Math.tan(phiTarget));
    }

    // Warnings
    const warnings: string[] = [];
    if (averagePf < 0.85) {
      warnings.push(`Low panel average Power Factor (${averagePf.toFixed(2)}) detected. Power Factor Correction (PFC) capacitors recommended.`);
    }
    if (incomerCurrentA > 400 && phase === 'SINGLE') {
      warnings.push('High load current calculated for Single Phase supply. Upgrade to a 3-Phase Panel Board supply is highly recommended.');
    }
    if (circuits.length === 0) {
      warnings.push('No circuits added. Panel board connects zero loads.');
    }

    // BOQ Items
    const boqItems = [
      {
        code: `QCS-LV-PB-${recommendedMccb}A`,
        desc: `${phase === 'THREE' ? '3-Phase (TP&N)' : '1-Phase (DP)'} Distribution Board, ${circuits.length + Math.round(circuits.length * 0.25)} Ways, with ${recommendedMccb}A Incomer MCCB, enclosure IP42.`,
        qty: 1,
        unit: 'Set',
        rate: designLevel === 'premium' ? 8500 : designLevel === 'standard' ? 5500 : 3800
      },
      {
        code: 'QCS-LV-MCB-SP',
        desc: `10A-32A SP Type-C MCB breaker for branch circuits (including spare ways)`,
        qty: circuits.length + 4,
        unit: 'Nos',
        rate: 85
      }
    ];

    if (pfcKvar > 5) {
      boqItems.push({
        code: `QCS-LV-PFC-${Math.ceil(pfcKvar)}kVAR`,
        desc: `Automatic Power Factor Correction capacitor bank stage panel, rated ${Math.ceil(pfcKvar)} kVAR.`,
        qty: 1,
        unit: 'Set',
        rate: Math.ceil(pfcKvar) * 350 + 2000
      });
    }

    return {
      totalConnectedKw,
      totalConnectedKva,
      averagePf,
      totalDemandKw,
      totalDemandKva,
      maxDemandKw,
      maxDemandKva,
      incomerCurrentA,
      recommendedMccb,
      pfcKvar,
      warnings,
      boqItems
    };
  }, [circuits, voltage, phase, diversityFactor, spareCapacity, designLevel, targetPF]);

  return (
    <div className="p-6 text-slate-100 overflow-y-auto h-full space-y-6 bg-[#07111F]">
      {/* Top Breadcrumb & Return Button */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => onNavigate('hub')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Engineering Agents Hub
        </button>
        <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
          Load Schedule & Panel Board Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" />
          Load Schedule & Panel Sizing Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Performs automated Connected Load, Demand Load, Incomer Current, and MCCB Breaker Sizing computations.
        </p>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. Panel Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Panel Board Tag</label>
                <input
                  type="text"
                  value={panelName}
                  onChange={(e) => setPanelName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Phase Type</label>
                <select
                  value={phase}
                  onChange={(e) => {
                    setPhase(e.target.value as any);
                    setVoltage(e.target.value === 'THREE' ? 415 : 240);
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="SINGLE">Single Phase (1-Phase)</option>
                  <option value="THREE">Three Phase (3-Phase)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Nominal Voltage (V)</label>
                <input
                  type="number"
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Panel Diversity Factor</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.4"
                  max="1.0"
                  value={diversityFactor}
                  onChange={(e) => setDiversityFactor(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Spare Growth Margin (%)</label>
                <input
                  type="number"
                  value={spareCapacity}
                  onChange={(e) => setSpareCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Specification Class</label>
                <select
                  value={designLevel}
                  onChange={(e) => setDesignLevel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="economy">Economy Specs</option>
                  <option value="standard">Standard Specs</option>
                  <option value="premium">Premium Specs</option>
                </select>
              </div>
            </div>
          </div>

          {/* Circuit Editor Grid */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">2. Branch Circuit Schedules</h3>
              <button
                onClick={addCircuit}
                className="flex items-center gap-1 py-1 px-3 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add Circuit
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2 px-3">Circuit Tag</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">kW Rating</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">DF</th>
                    <th className="py-2 px-3">PF</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {circuits.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={c.name}
                          onChange={(e) => updateCircuitField(c.id, 'name', e.target.value)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={c.loadType}
                          onChange={(e) => updateCircuitField(c.id, 'loadType', e.target.value as any)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        >
                          <option value="lighting">Lighting</option>
                          <option value="power_socket">Sockets</option>
                          <option value="hvac">HVAC FCU</option>
                          <option value="motor">Motor</option>
                          <option value="ups">UPS Supply</option>
                          <option value="other">Other Load</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.1"
                          value={c.loadKw}
                          onChange={(e) => updateCircuitField(c.id, 'loadKw', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={c.qty}
                          onChange={(e) => updateCircuitField(c.id, 'qty', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.05"
                          min="0.1"
                          max="1.0"
                          value={c.demandFactor}
                          onChange={(e) => updateCircuitField(c.id, 'demandFactor', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.02"
                          min="0.5"
                          max="1.0"
                          value={c.powerFactor}
                          onChange={(e) => updateCircuitField(c.id, 'powerFactor', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeCircuit(c.id)}
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

        {/* Right Sizing Outputs Column */}
        <div className="space-y-6">
          {/* Key Calculation Results */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Panel Sizing Results
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
                <span className="text-slate-500 font-semibold block">Connected Load</span>
                <span className="text-lg font-bold text-white">{calculated.totalConnectedKw.toFixed(1)} kW</span>
                <span className="text-[10px] text-slate-400 block">{calculated.totalConnectedKva.toFixed(1)} kVA</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Total Demand Load</span>
                <span className="text-lg font-bold text-white">{calculated.totalDemandKw.toFixed(1)} kW</span>
                <span className="text-[10px] text-slate-400 block">{calculated.totalDemandKva.toFixed(1)} kVA</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Maximum Demand</span>
                <span className="text-lg font-bold text-amber-400">{calculated.maxDemandKw.toFixed(1)} kW</span>
                <span className="text-[10px] text-slate-400 block">{calculated.maxDemandKva.toFixed(1)} kVA</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Average PF</span>
                <span className="text-lg font-bold text-white">{calculated.averagePf.toFixed(2)}</span>
                <span className="text-[9px] text-slate-400 block">Weighted average</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Incomer Current & MCCB Rating</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-300 font-semibold">Calculated Current (Amps)</span>
                <span className="text-sm font-bold text-white">{calculated.incomerCurrentA.toFixed(1)} A</span>
              </div>
              <div className="flex justify-between items-baseline border-t border-white/5 pt-2">
                <span className="text-xs text-amber-400 font-bold">Recommended MCCB Rating</span>
                <span className="text-base font-extrabold text-amber-400">{calculated.recommendedMccb}A TP</span>
              </div>
            </div>

            {calculated.pfcKvar > 0 && (
              <div className="bg-cyan-500/5 p-3 rounded border border-cyan-500/20 flex justify-between items-center text-xs">
                <div>
                  <span className="text-cyan-400 font-bold block">PFC Capacitor Sizing</span>
                  <span className="text-[10px] text-slate-400">Improve PF to {targetPF}</span>
                </div>
                <span className="text-base font-extrabold text-cyan-400">{Math.ceil(calculated.pfcKvar)} kVAR</span>
              </div>
            )}
          </div>

          {/* Preliminary BOQ Panel */}
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

      {/* Formulations Accordion */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Engineering Formulations & Standards</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Maximum Demand Load calculation</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">MD_kW = (Σ (Load_kW_i × DF_i) ) × diversity_factor</code>
            <p className="text-slate-400 text-[11px]">Sized per IEC 61439 design requirements for switchboards and panel boards.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Incomer Current calculation (3-Phase)</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">I_A = (MD_kW × 1000) / (√3 × V_L-L × PF_avg)</code>
            <p className="text-slate-400 text-[11px]">Current calculations use phase lines configurations. Standard spare capacities applied to avoid circuit breaker sizing failures.</p>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
