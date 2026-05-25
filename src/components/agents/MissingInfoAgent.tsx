import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';
import type { RoomData, BOQItem, SitePhoto, AssetTwin } from '../../data/mockData';

interface MissingInfoProps {
  onNavigate: (tab: string) => void;
  projectName?: string;
  rooms?: RoomData[];
  boqItems?: BOQItem[];
  sitePhotos?: SitePhoto[];
  assets?: AssetTwin[];
  projectCountry?: string;
  projectLevel?: string;
}

export const MissingInfoAgent: React.FC<MissingInfoProps> = ({
  onNavigate,
  projectName = 'Doha Smart Office Fit-Out',
  rooms = [],
  boqItems = [],
  sitePhotos = [],
  assets = [],
  projectCountry = 'Qatar',
  projectLevel = 'STANDARD'
}) => {
  // Manual overrides for testing & refinement
  const [supplyVoltage, setSupplyVoltage] = useState<'415V_3P' | '230V_1P' | ''>('415V_3P');
  const [powerFactor, setPowerFactor] = useState<string>('0.85'); // empty means default
  const [cableLength, setCableLength] = useState<string>('85'); // empty means default
  const [installationMethod, setInstallationMethod] = useState<'In Ground' | 'In Conduit' | 'Free Air' | ''>('In Conduit');
  const [ambientTemp, setAmbientTemp] = useState<string>('45'); // GCC summer temp (empty means default)
  const [selectedSystems] = useState({
    lv: true,
    lc: true,
    lighting: true,
    earthing: true,
    cctv: true,
    wifi: true,
    access: true
  });

  const calculated = useMemo(() => {
    const list: {
      field: string;
      module: string;
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      currentValue: string;
      action: string;
    }[] = [];

    // 1. Scan Supply Voltage & Phase
    if (!supplyVoltage) {
      list.push({
        field: 'Supply Voltage / Phase Configuration',
        module: 'Load Schedule Agent / Power Cable Agent',
        severity: 'CRITICAL',
        currentValue: 'Unspecified',
        action: 'Specify nominal voltage (e.g. 415V 3-Phase) to size incomers and power cable core counts.'
      });
    }

    // 2. Scan Cable Length
    if (!cableLength || Number(cableLength) <= 0) {
      list.push({
        field: 'Cable Route Length',
        module: 'Power Cable Agent',
        severity: 'CRITICAL',
        currentValue: 'Unspecified (using 50m default)',
        action: 'Measure actual structural route length. Length directly determines voltage drop viability.'
      });
    } else if (Number(cableLength) > 90 && selectedSystems.lc) {
      list.push({
        field: 'Horizontal Data Link Length',
        module: 'Structured Cabling Agent',
        severity: 'HIGH',
        currentValue: `${cableLength}m`,
        action: 'Data cables exceed 90m permanent link limit. Add secondary telecom rack (IDF) to avoid signal attenuation.'
      });
    }

    // 3. Scan Power Factor
    if (!powerFactor) {
      list.push({
        field: 'Power Factor (Cos φ)',
        module: 'Load Schedule Agent',
        severity: 'HIGH',
        currentValue: 'Defaulted to 0.85',
        action: 'Enter actual/estimated power factor for motor & fluorescent loads to prevent under-sizing capacitors.'
      });
    } else if (Number(powerFactor) < 0.80) {
      list.push({
        field: 'Low Power Factor Setting',
        module: 'Load Schedule & Panel Board Agent',
        severity: 'MEDIUM',
        currentValue: powerFactor,
        action: 'Average PF is low. Integrate Capacitor Bank / PFC Panel in BOQ and design basis.'
      });
    }

    // 4. Scan Installation Method
    if (!installationMethod) {
      list.push({
        field: 'Cable Installation Method',
        module: 'Power Cable Agent',
        severity: 'HIGH',
        currentValue: 'Unspecified (using Conduit standard)',
        action: 'Select installation method (e.g., In Ground, Free Air) to calculate correct thermal derating factor.'
      });
    }

    // 5. Scan Ambient Temperature
    if (!ambientTemp) {
      list.push({
        field: 'Ambient Design Temperature',
        module: 'Power Cable Agent',
        severity: 'MEDIUM',
        currentValue: 'Defaulted to 30°C',
        action: 'Specify regional design temperature. (E.g., GCC standard is 45°C/50°C which derates cable capacity by up to 40%).'
      });
    }

    // 6. Scan Rooms for missing info
    if (rooms.length === 0) {
      list.push({
        field: 'Room & Space Schedule',
        module: 'All Agents',
        severity: 'CRITICAL',
        currentValue: '0 Rooms Scanned',
        action: 'Import rooms layout to generate lighting, data, Wi-Fi, and CCTV device distributions.'
      });
    } else {
      // Look for rooms missing ceiling height or area
      const missingHeight = rooms.filter(r => !r.ceilingHeight || r.ceilingHeight <= 0);
      const missingArea = rooms.filter(r => !r.area || r.area <= 0);
      
      if (missingHeight.length > 0) {
        list.push({
          field: 'Room Ceiling Heights',
          module: 'Emergency Lighting / Wi-Fi Planning',
          severity: 'MEDIUM',
          currentValue: `${missingHeight.length} rooms missing height`,
          action: `Define ceiling height for ${missingHeight.map(r => r.name).slice(0, 2).join(', ')}... standard calculations require height for lux/AP ranges.`
        });
      }
      
      if (missingArea.length > 0) {
        list.push({
          field: 'Room Floor Area',
          module: 'All Agents',
          severity: 'CRITICAL',
          currentValue: `${missingArea.length} rooms missing area`,
          action: `Enter area (sqm) for ${missingArea.map(r => r.name).slice(0, 2).join(', ')} to run lumen and occupancy calculations.`
        });
      }

      // Check if Washroom or Storage has missing ceiling height specifically (common scan issue)
      const specialRooms = rooms.filter(r => (r.type === 'Washroom' || r.type === 'Storage') && (!r.ceilingHeight || r.ceilingHeight === 2.7));
      if (specialRooms.length > 0) {
        list.push({
          field: 'Auxiliary Room Height Verification',
          module: 'Emergency Lighting Agent',
          severity: 'LOW',
          currentValue: 'Defaulted (2.7m)',
          action: 'Verify toilet and storage false ceiling level. Standard heights are often reduced due to duct runs.'
        });
      }
    }

    // 7. Scan BOQ Completed
    if (boqItems.length === 0) {
      list.push({
        field: 'Bill of Quantities',
        module: 'BOQ Agent',
        severity: 'HIGH',
        currentValue: '0 items',
        action: 'Initialize BOQ generator to track electrical materials, cabling lengths, and labor rates.'
      });
    } else {
      // Check for low-confidence BOQ items
      const lowConfItems = boqItems.filter(item => item.confidenceLevel === 'Low' || item.confidenceLevel === 'Needs Review');
      if (lowConfItems.length > 0) {
        list.push({
          field: 'Low-Confidence BOQ Line Items',
          module: 'BOQ Agent / Compliance Checklist',
          severity: 'MEDIUM',
          currentValue: `${lowConfItems.length} items flagged`,
          action: `Verify materials and rates for: ${lowConfItems.map(i => i.itemCode).slice(0, 2).join(', ')}.`
        });
      }
    }

    // 8. Scan Site Photos / Deviations
    if (sitePhotos.length === 0) {
      list.push({
        field: 'Site Validation Records',
        module: 'Site Validation Agent',
        severity: 'MEDIUM',
        currentValue: 'No photos uploaded',
        action: 'Upload site installation photos to match physical placement against design coordinates.'
      });
    } else {
      const openDeviations = sitePhotos.flatMap(p => p.findings.filter(f => f.status === 'Open' && f.severity === 'Critical'));
      if (openDeviations.length > 0) {
        list.push({
          field: 'Open Critical Deviations',
          module: 'Testing & Commissioning Agent',
          severity: 'HIGH',
          currentValue: `${openDeviations.length} critical issues`,
          action: 'Resolve open anomalies in server room grounding and installation before launching commissioning.'
        });
      }
    }

    // 9. Scan O&M Assets
    if (assets.length === 0) {
      list.push({
        field: 'Handover Asset Register',
        module: 'Asset Twin / Facility Handover',
        severity: 'LOW',
        currentValue: 'Empty Registry',
        action: 'Populate equipment tags and serials for main boards, UPS, NVR, and BMS controllers to prepare O&M manual.'
      });
    }

    // Calculate Confidence Score
    // Base is 100%. Critical subtracts 20, High 10, Medium 5, Low 2.
    const critCount = list.filter(l => l.severity === 'CRITICAL').length;
    const highCount = list.filter(l => l.severity === 'HIGH').length;
    const medCount = list.filter(l => l.severity === 'MEDIUM').length;
    const lowCount = list.filter(l => l.severity === 'LOW').length;

    const penalty = (critCount * 20) + (highCount * 12) + (medCount * 6) + (lowCount * 2);
    const confidenceScore = Math.max(10, 100 - penalty);

    // Agent Module Readiness Assessment
    const readiness: {
      agent: string;
      status: 'Ready' | 'Needs Input' | 'Blocked';
      issues: string;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    }[] = [
      {
        agent: 'Power Cable Agent',
        status: !cableLength || !supplyVoltage ? 'Blocked' : !installationMethod || !ambientTemp ? 'Needs Input' : 'Ready',
        issues: !cableLength ? 'Missing Route Length' : !supplyVoltage ? 'Supply Voltage Missing' : !ambientTemp ? 'Verify Ambient Temp' : 'None',
        confidence: confidenceScore > 80 ? 'HIGH' : confidenceScore > 50 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'Load Schedule Agent',
        status: !supplyVoltage ? 'Blocked' : !powerFactor ? 'Needs Input' : 'Ready',
        issues: !supplyVoltage ? 'Supply Voltage Missing' : !powerFactor ? 'Power Factor Defaulted' : 'None',
        confidence: confidenceScore > 80 ? 'HIGH' : confidenceScore > 50 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'Earthing Agent',
        status: sitePhotos.some(p => p.findings.some(f => f.description.includes('grounding') && f.status === 'Open')) ? 'Needs Input' : 'Ready',
        issues: sitePhotos.some(p => p.findings.some(f => f.description.includes('grounding') && f.status === 'Open')) ? 'Critical grounding deviation open' : 'None',
        confidence: confidenceScore > 75 ? 'HIGH' : confidenceScore > 50 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'Emergency Lighting Agent',
        status: rooms.some(r => !r.ceilingHeight) ? 'Needs Input' : 'Ready',
        issues: rooms.some(r => !r.ceilingHeight) ? 'Missing Ceiling Heights' : 'None',
        confidence: confidenceScore > 80 ? 'HIGH' : confidenceScore > 50 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'Structured Cabling Agent',
        status: rooms.length === 0 ? 'Blocked' : (Number(cableLength) > 90) ? 'Needs Input' : 'Ready',
        issues: rooms.length === 0 ? 'No rooms database' : (Number(cableLength) > 90) ? 'Data links exceed 90m limit' : 'None',
        confidence: confidenceScore > 80 ? 'HIGH' : confidenceScore > 50 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'CCTV Agent',
        status: rooms.length === 0 ? 'Blocked' : 'Ready',
        issues: rooms.length === 0 ? 'No rooms database' : 'None',
        confidence: confidenceScore > 85 ? 'HIGH' : confidenceScore > 55 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'Wi-Fi Planning Agent',
        status: rooms.some(r => !r.ceilingHeight) ? 'Needs Input' : 'Ready',
        issues: rooms.some(r => !r.ceilingHeight) ? 'Missing Ceiling Heights' : 'None',
        confidence: confidenceScore > 80 ? 'HIGH' : confidenceScore > 50 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'Access Control Agent',
        status: rooms.length === 0 ? 'Blocked' : 'Ready',
        issues: rooms.length === 0 ? 'No rooms database' : 'None',
        confidence: confidenceScore > 85 ? 'HIGH' : confidenceScore > 55 ? 'MEDIUM' : 'LOW'
      },
      {
        agent: 'Compliance Checklist Agent',
        status: critCount > 0 ? 'Needs Input' : 'Ready',
        issues: critCount > 0 ? 'Resolve critical design basis items' : 'None',
        confidence: confidenceScore > 80 ? 'HIGH' : confidenceScore > 50 ? 'MEDIUM' : 'LOW'
      }
    ];

    // Priority Escalation Flag (CRITICAL or HIGH items exist)
    const reviewEscalationRequired = critCount > 0 || highCount > 0;

    // Sort list by severity
    const severityOrder = { CRITICAL: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
    const sortedList = [...list].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    // Top 5 priority actions ("Fix These First")
    const fixTheseFirst = sortedList.slice(0, 5);

    return {
      list: sortedList,
      critCount,
      highCount,
      medCount,
      lowCount,
      confidenceScore,
      readiness,
      reviewEscalationRequired,
      fixTheseFirst
    };
  }, [supplyVoltage, powerFactor, cableLength, installationMethod, ambientTemp, rooms, boqItems, sitePhotos, assets, selectedSystems]);

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
          Project Intelligence Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
          Missing Information & Scan Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Scans space schedules, cable routes, load schedules, and BOQs to identify gaps, calculate data confidence, and flag risks.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active scanned values & Manual adjustments */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. Project Environment Scanner & Toggles</h3>
            <p className="text-xs text-slate-400">
              Scanned values from workspace context: <span className="font-semibold text-white">{projectName}</span> ({projectCountry}, Level: {projectLevel}). Adjust values below to run real-time confidence testing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Supply Grid Voltages</label>
                <select
                  value={supplyVoltage}
                  onChange={(e) => setSupplyVoltage(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="415V_3P">415V 3-Phase + Neutral</option>
                  <option value="230V_1P">230V Single Phase</option>
                  <option value="">-- Unspecified / Default --</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Power Factor (Cos φ)</label>
                <input
                  type="text"
                  placeholder="e.g. 0.85 (empty for default)"
                  value={powerFactor}
                  onChange={(e) => setPowerFactor(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Cable Length (Meters)</label>
                <input
                  type="text"
                  placeholder="e.g. 85 (empty for default)"
                  value={cableLength}
                  onChange={(e) => setCableLength(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Installation Method</label>
                <select
                  value={installationMethod}
                  onChange={(e) => setInstallationMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="In Conduit">In Conduit / Trunking</option>
                  <option value="In Ground">Underground Direct Buried</option>
                  <option value="Free Air">On Perforated Cable Tray</option>
                  <option value="">-- Unspecified / Default --</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Ambient Temperature (°C)</label>
                <input
                  type="text"
                  placeholder="e.g. 45 (empty for default)"
                  value={ambientTemp}
                  onChange={(e) => setAmbientTemp(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Workspace Context Scans</label>
                <div className="bg-slate-950 p-2 rounded border border-white/10 space-y-1 text-[11px] text-slate-300">
                  <div>Rooms: <span className="text-cyan-400 font-bold">{rooms.length}</span></div>
                  <div>BOQ items: <span className="text-cyan-400 font-bold">{boqItems.length}</span></div>
                  <div>Deviations: <span className="text-cyan-400 font-bold">{sitePhotos.flatMap(p => p.findings).length}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Info List Table */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> Scanned Gaps & Omissions ({calculated.list.length})
            </h3>
            {calculated.list.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-950 rounded-lg">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                All mandatory and optional information validated. Ready for final design.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400">
                      <th className="py-2 px-3">Field Gap</th>
                      <th className="py-2 px-3">Impacted Agent</th>
                      <th className="py-2 px-3 text-center">Severity</th>
                      <th className="py-2 px-3">Scanned Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {calculated.list.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/20">
                        <td className="py-3 px-3">
                          <span className="font-semibold block text-white">{l.field}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{l.action}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 text-[11px]">{l.module}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            l.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            l.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            l.severity === 'MEDIUM' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {l.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-300">{l.currentValue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Module Readiness Grid */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">2. Active Agent Module Readiness Grid</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calculated.readiness.map((r, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{r.agent}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      r.status === 'Ready' ? 'bg-emerald-500/20 text-emerald-400' :
                      r.status === 'Needs Input' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    <span className="block font-semibold">Issue: {r.issues}</span>
                    <span className="block mt-0.5">Confidence Impact: <span className="font-bold text-slate-300">{r.confidence}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="space-y-6">
          {/* Data Confidence Score Gauge */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Design Confidence Score
            </h3>

            <div className="text-center space-y-2">
              <div className="relative inline-flex items-center justify-center">
                {/* Visual score circle */}
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 flex items-center justify-center">
                  <span className={`text-3xl font-extrabold ${
                    calculated.confidenceScore > 80 ? 'text-emerald-400' :
                    calculated.confidenceScore > 50 ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>
                    {calculated.confidenceScore}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-tight">
                Confidence rating based on inputs completeness. High confidence indicates values match actual field constraints.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[10px] border-t border-white/5 pt-3">
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-400 block font-semibold">Critical/High Gaps</span>
                <span className="text-white font-extrabold text-sm block">{calculated.critCount + calculated.highCount}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-400 block font-semibold">Medium/Low Gaps</span>
                <span className="text-white font-extrabold text-sm block">{calculated.medCount + calculated.lowCount}</span>
              </div>
            </div>

            {calculated.reviewEscalationRequired && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 block uppercase">Engineer Review Escalated</span>
                  <p className="text-[10px] text-rose-400 leading-tight">
                    Calculations contain CRITICAL gaps or HIGH risks. Output cannot be presented for municipality submissions until details are verified.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* "Fix These First" priority panel */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              🛠️ "Fix These First" Priority
            </h3>
            <p className="text-xs text-slate-400">
              Address these issues first to maximize calculation confidence.
            </p>
            <div className="space-y-3">
              {calculated.fixTheseFirst.map((f, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-white/5 relative pl-8">
                  <span className="absolute left-2.5 top-3.5 w-4 h-4 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center text-[9px] font-bold text-amber-500">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white leading-none">{f.field}</span>
                      <span className={`text-[8px] font-bold px-1.5 rounded uppercase ${
                        f.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-300 leading-normal">{f.action}</p>
                    <span className="text-[9px] text-slate-400 block">Agent: {f.module}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
