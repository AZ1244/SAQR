import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Wifi,
  AlertTriangle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface WiFiProps {
  onNavigate: (tab: string) => void;
}

export const WiFiAgent: React.FC<WiFiProps> = ({ onNavigate }) => {
  const [floorArea, setFloorArea] = useState(1200); // total floor area in sqm
  const [environmentType, setEnvironmentType] = useState<'open_office' | 'partitioned_office' | 'industrial' | 'high_density'>('partitioned_office');
  const [totalUsers, setTotalUsers] = useState(250); // total concurrent wireless clients
  const [apWattage, setApWattage] = useState(18); // Watts per Access Point
  const [spareCapacity, setSpareCapacity] = useState(20);

  const calculated = useMemo(() => {
    // 1. Coverage Sizing:
    // Partitioned office: radius = 10m, open office: radius = 15m, industrial: 20m, high density: 8m
    let coverageRadius = 10;
    if (environmentType === 'open_office') coverageRadius = 15;
    else if (environmentType === 'industrial') coverageRadius = 20;
    else if (environmentType === 'high_density') coverageRadius = 8;

    const apCoverageAreaSq = Math.PI * Math.pow(coverageRadius, 2);
    // Spacing overlap factor = 1.35 (to guarantee 20% overlap zone for signal continuity)
    const overlapFactor = 1.35;
    const coverageApCount = Math.ceil((floorArea / apCoverageAreaSq) * overlapFactor);

    // 2. Capacity Sizing:
    // Enterprise target load: standard office ≤ 25 users per AP, high-density/conventions: ≤ 50 users/AP
    const targetClientsPerAp = environmentType === 'high_density' ? 45 : 25;
    const capacityApCount = Math.ceil(totalUsers / targetClientsPerAp);

    // Final recommended AP count (highest of coverage vs capacity sizing)
    const baseApCount = Math.max(coverageApCount, capacityApCount);
    const recommendedApCount = Math.ceil(baseApCount * (1 + spareCapacity / 100)) || 1;

    // Users density checks
    const actualUsersPerAp = totalUsers / recommendedApCount;

    // PoE Budget
    const totalPoEWattage = recommendedApCount * apWattage;

    // Backhaul capacity (assuming 1Gbps permanent links)
    const totalBackhaulGbps = recommendedApCount * 1; // 1 Gbps per AP

    // Warnings
    const warnings: string[] = [];
    if (actualUsersPerAp > 35) {
      warnings.push(`High client density (${actualUsersPerAp.toFixed(1)} users/AP) exceeds standard 25 users/AP benchmark. Clients may suffer packet drops and latency issues. Increase AP count.`);
    }
    if (floorArea > 5000 && environmentType === 'partitioned_office' && recommendedApCount < 20) {
      warnings.push('Large floor area with high walls partitions. Site wireless survey (passive/active) is mandatory before final AP layouts.');
    }

    // BOQ Items
    const boqItems = [
      {
        code: 'QCS-NET-AP-6E',
        desc: `Enterprise Indoor wireless Access Point (AP), IEEE 802.11ax (Wi-Fi 6E), dual-radio, 4x4 MIMO, ceiling/wall mounts.`,
        qty: recommendedApCount,
        unit: 'Nos',
        rate: 1350
      },
      {
        code: 'QCS-NET-POE-24P',
        desc: `24-port Gigabit PoE+ Managed Switch, IEEE 802.3at standard, minimum 370W PoE budget.`,
        qty: Math.ceil(recommendedApCount / 24) || 1,
        unit: 'Nos',
        rate: 1850
      },
      {
        code: 'QCS-NET-WLC-CTRL',
        desc: `Centralized Hardware Wireless LAN controller, supporting up to 50 Access Points management and authentication.`,
        qty: 1,
        unit: 'Set',
        rate: 4200
      }
    ];

    return {
      coverageRadius,
      apCoverageAreaSq,
      recommendedApCount,
      actualUsersPerAp,
      totalPoEWattage,
      totalBackhaulGbps,
      warnings,
      boqItems
    };
  }, [floorArea, environmentType, totalUsers, apWattage, spareCapacity]);

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
          Wi-Fi Planning Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wifi className="w-6 h-6 text-amber-400" />
          Wi-Fi Coverage & Density Planning Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Performs automated Access Point density estimation, signal overlap area calculations, client load distribution check, and PoE power budgets.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. Coverage Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Total Floor Area (sqm)</label>
                <input
                  type="number"
                  value={floorArea}
                  onChange={(e) => setFloorArea(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Partition & Wall Environment</label>
                <select
                  value={environmentType}
                  onChange={(e) => setEnvironmentType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="open_office">Open Area Office (Low obstructions)</option>
                  <option value="partitioned_office">Standard Office (Brick/Drywall partitions)</option>
                  <option value="industrial">Warehouse / Industrial (Metal/Open)</option>
                  <option value="high_density">High Density Auditorium (Extreme walls/crowd)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Total Wireless Users</label>
                <input
                  type="number"
                  value={totalUsers}
                  onChange={(e) => setTotalUsers(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">AP Nominal Power (Watts)</label>
                <input
                  type="number"
                  value={apWattage}
                  onChange={(e) => setApWattage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">AP growth margin (%)</label>
                <input
                  type="number"
                  value={spareCapacity}
                  onChange={(e) => setSpareCapacity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="space-y-6">
          {/* Key sizing results */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Wi-Fi Design Results
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
                <span className="text-slate-500 font-semibold block">Recommended APs</span>
                <span className="text-lg font-bold text-emerald-400">{calculated.recommendedApCount} AP units</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">AP Coverage Radius</span>
                <span className="text-lg font-bold text-white">{calculated.coverageRadius} meters</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Users per AP</span>
                <span className="text-lg font-bold text-white">{calculated.actualUsersPerAp.toFixed(1)} users</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">PoE Switch Budget</span>
                <span className="text-lg font-bold text-white">{calculated.totalPoEWattage} W</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Channel Allocation Scheme</span>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>2.4 GHz Band</span>
                  <span className="font-mono text-cyan-400 font-semibold">Ch 1 / 6 / 11 (Non-overlapping)</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1">
                  <span>5.0 GHz Band</span>
                  <span className="font-mono text-cyan-400 font-semibold">Ch 36 / 44 / 52 / 60 (DFS bands)</span>
                </div>
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

      {/* Formulas */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Engineering Formulas & References</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">AP Density Calculation (Coverage-Based)</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">APs_Coverage = [ Area / ( π × R² ) ] × Overlap_Factor</code>
            <p className="text-slate-400 text-[11px]">R represents the signal coverage radius, adjusted for attenuation barriers. Overlap_Factor guarantees smooth roaming.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Enterprise Wi-Fi 6 AP density benchmarks</strong>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] mt-1">
              <li>Standard Office environments: 1 AP per 150-200 sqm, ≤ 25 users per AP.</li>
              <li>High-Density spaces (Conferences): 1 AP per 60-80 sqm, ≤ 45 users per AP.</li>
              <li>Warehouse / industrial structures: 1 AP per 300-400 sqm (high gain directional antennas).</li>
            </ul>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
