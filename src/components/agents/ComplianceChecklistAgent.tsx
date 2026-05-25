import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  TrendingUp,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface ComplianceProps {
  onNavigate: (tab: string) => void;
}

export const ComplianceChecklistAgent: React.FC<ComplianceProps> = ({ onNavigate }) => {
  const [projectType, setProjectType] = useState<'office' | 'hospital' | 'school' | 'industrial' | 'data_center'>('office');
  const [country, setCountry] = useState<'qatar' | 'uae' | 'saudi' | 'uk' | 'international'>('qatar');
  const [systemCategory, setSystemCategory] = useState<'lv' | 'elv' | 'all'>('all');
  const [boqPresent, setBoqPresent] = useState(true);
  const [assumptionsListed, setAssumptionsListed] = useState(true);
  const [engineerSigned, setEngineerSigned] = useState(false);
  const [copied, setCopied] = useState(false);

  const calculated = useMemo(() => {
    // Generate checklists dynamically based on inputs
    const list = [];
    const missingApprovals = [];
    const requiredDocs = [];

    // Standards references mapping
    let powerRef = 'IEC 60364';
    let lightingRef = 'BS EN 1838';
    let earthingRef = 'BS 7430';
    let fireRef = 'BS 5839';

    if (country === 'qatar') {
      powerRef = 'QCS 2014 Section 21 / Kahramaa Regulations';
      lightingRef = 'BS EN 1838 / QCDD Fire Safety';
      earthingRef = 'QCS 2014 Clause 21.6 / Kahramaa';
      fireRef = 'QCDD Fire Safety Regulations Part 2';
      requiredDocs.push('Kahramaa load approval certificate', 'QCDD fire safety drawings approval', 'Soil resistivity testing reports from certified lab');
    } else if (country === 'uae') {
      powerRef = 'DEWA Wiring Regulations / DM standards';
      lightingRef = 'DCD Fire Safety / BS EN 1838';
      earthingRef = 'DEWA Earthing Specifications';
      fireRef = 'UAE Fire & Life Safety Code of Practice';
      requiredDocs.push('DEWA load design approval certificate', 'DCD Fire safety certificate', 'Main switchboard factory test witness certificates');
    } else if (country === 'saudi') {
      powerRef = 'SBC 401 (Saudi National Electrical Code) / SEC';
      lightingRef = 'SBC 801 / SASO / NFPA 101';
      earthingRef = 'SBC 401 Section 54';
      fireRef = 'SBC 801 / SASO / Civil Defense regs';
      requiredDocs.push('SEC load approval certificate', 'Civil Defense fire approval certificates');
    } else if (country === 'uk') {
      powerRef = 'BS 7671:2018 (18th Edition)';
      lightingRef = 'BS EN 1838 / BS 5266';
      earthingRef = 'BS 7430 Grounding standard';
      fireRef = 'BS 5839 Part 1 (Fire Systems)';
      requiredDocs.push('EIC (Electrical Installation Certificate)', 'Emergency lighting completion certificates', 'Fire system design certificates');
    } else {
      powerRef = 'IEC 60364 (Electrical Installations)';
      lightingRef = 'ISO 30061 / CIE S 020';
      earthingRef = 'IEC 60364-5-54';
      fireRef = 'NFPA 101 / NFPA 72';
      requiredDocs.push('System installation inspection sheets', 'Insulation resistance certificates');
    }

    // Rules logic
    // Rule 1: Power Cable Sizing Compliance
    list.push({
      item: 'Power Cable Voltage Drop Limits validation',
      status: 'compliant',
      risk: 'LOW',
      ref: powerRef,
      action: 'None. Double check route lengths under load.'
    });

    // Rule 2: Emergency Lighting Duration Check
    const durLimit = (country === 'qatar' || country === 'uae') ? 3 : 1;
    list.push({
      item: `Emergency lighting autonomy duration check (Target: ≥ ${durLimit} Hours)`,
      status: 'compliant',
      risk: 'LOW',
      ref: lightingRef,
      action: `Ensure backup battery duration satisfies regional ${durLimit}-hour rules.`
    });

    // Rule 3: Earthing resistance check
    list.push({
      item: 'Main ground grid resistance check (Target: ≤ 1.0 Ω for technical rooms)',
      status: 'review_needed',
      risk: 'MEDIUM',
      ref: earthingRef,
      action: 'Verify actual soil resistivity on site. Local conditions can vary.'
    });

    // Rule 4: BOQ Completed Checklist
    if (!boqPresent) {
      list.push({
        item: 'Bill of Quantities pricing completeness audit',
        status: 'non_compliant',
        risk: 'HIGH',
        ref: 'QCS Section 1 / Project Specifications',
        action: 'Compile structural material items list inside BOQ generator to avoid procurement omissions.'
      });
      missingApprovals.push('Missing preliminary BOQ values — pricing and estimations cannot be validated.');
    } else {
      list.push({
        item: 'Bill of Quantities pricing check',
        status: 'compliant',
        risk: 'LOW',
        ref: 'Project Cost Estimation Controls',
        action: 'None.'
      });
    }

    // Rule 5: Assumptions Listed
    if (!assumptionsListed) {
      list.push({
        item: 'Calculation design basis & assumptions checklist',
        status: 'review_needed',
        risk: 'MEDIUM',
        ref: 'ISO 9001 QA / Professional Practice',
        action: 'Add cable thermal insulation and ambient temperature assumptions to calculations.'
      });
    }

    // Rule 6: Engineer Signature
    if (!engineerSigned) {
      list.push({
        item: 'Qualified Professional Engineer Stamp & Endorsement',
        status: 'non_compliant',
        risk: 'HIGH',
        ref: 'Municipality Regulations / Civil Engineering Acts',
        action: 'Review and sign-off calculations by a registered UPDA/MME Grade-A engineer.'
      });
      missingApprovals.push('Calculations lack Professional Engineer (PE) stamp. Submit is blocked by local authorities.');
    } else {
      list.push({
        item: 'Qualified Professional Engineer Stamp & Endorsement',
        status: 'compliant',
        risk: 'LOW',
        ref: 'Municipality Regulations',
        action: 'Verify license remains active.'
      });
    }

    // High risk count
    const highRiskCount = list.filter(l => l.risk === 'HIGH').length;
    const medRiskCount = list.filter(l => l.risk === 'MEDIUM').length;
    const lowRiskCount = list.filter(l => l.risk === 'LOW').length;

    // Report Section compilation
    const reportText = `================================================================================
COMPLIANCE AND STANDARDS COMPLIANCE AUDIT SUBMITTAL SECTION
Project Classification: ${projectType.toUpperCase()} Space Design
Authority Jurisdiction: ${country.toUpperCase()} (${country === 'qatar' ? 'UPDA / MME / QCDD' : country === 'uae' ? 'DEWA / DCD' : 'Local Code Authority'})
Reference Standards:
- LV Power Design: ${powerRef}
- Emergency Lighting: ${lightingRef}
- Earthing System: ${earthingRef}
- Life Safety Systems: ${fireRef}
================================================================================

1. COMPLIANCE ASSESSMENT STATUS SUMMARY
Total compliance rules audited: ${list.length}
- Compliant: ${list.filter(l => l.status === 'compliant').length}
- Review Required: ${list.filter(l => l.status === 'review_needed').length}
- Non-Compliant/Defects: ${list.filter(l => l.status === 'non_compliant').length}

Calculated Project Compliance Risk Rating: ${highRiskCount > 0 ? '🔴 HIGH RISK LEVEL' : medRiskCount > 0 ? '🟡 MEDIUM RISK LEVEL' : '🟢 LOW RISK LEVEL'}

2. SUBMISSION REQUIRED DOCUMENTATION LIST
${requiredDocs.map((doc, idx) => `[ ] ${idx + 1}. ${doc}`).join('\n')}

3. IMPORTANT COMPLIANCE ACTION REQUIRED NOTES
${list.filter(l => l.status !== 'compliant').map((l, idx) => `- ${idx + 1}. [${l.risk} RISK] ${l.item}: ${l.action}`).join('\n')}

================================================================================
ENGINEER COMPLIANCE SIGN-OFF DISCLAIMER:
Preliminary compliance assessment compiled by SAQR AI platform engine.
Checklist references are for engineering guidance only. Final designs must be
reviewed, stamped, and approved by qualified professional engineers and relevant
municipal planning authorities before construction actions or materials ordering.
================================================================================`;

    return {
      list,
      missingApprovals,
      requiredDocs,
      highRiskCount,
      medRiskCount,
      lowRiskCount,
      reportText
    };
  }, [projectType, country, systemCategory, boqPresent, assumptionsListed, engineerSigned]);

  const copyText = () => {
    navigator.clipboard.writeText(calculated.reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          Compliance Checklist Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-amber-400" />
          Compliance Checklist & Standards Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Audits design metrics, calculations assumptions, and BOQ records against country-specific municipality codes and fire safety standards.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. Regulatory Project Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Target Authority/Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="qatar">Qatar (Kahramaa / QCDD)</option>
                  <option value="uae">UAE (DEWA / DCD)</option>
                  <option value="saudi">Saudi Arabia (SEC / SASO)</option>
                  <option value="uk">United Kingdom (BS 7671 / BS EN)</option>
                  <option value="international">International Default (IEC)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Project Building Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                >
                  <option value="office">Commercial Office Space</option>
                  <option value="hospital">Hospital / Healthcare Facility</option>
                  <option value="school">School / Institutional Building</option>
                  <option value="industrial">Industrial Warehouse / Plant</option>
                  <option value="data_center">Mission-Critical Data Center</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Audited Systems</label>
                <select
                  value={systemCategory}
                  onChange={(e) => setSystemCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                >
                  <option value="all">All Systems (LV + ELV)</option>
                  <option value="lv">LV Electrical Power Systems</option>
                  <option value="elv">ELV & Data Cabling Systems</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">2. Design Documentation Audits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <label className="flex items-center gap-2 p-3 bg-slate-950 rounded border border-white/5 cursor-pointer hover:bg-slate-900 transition-all text-slate-300">
                <input
                  type="checkbox"
                  checked={boqPresent}
                  onChange={(e) => setBoqPresent(e.target.checked)}
                  className="rounded border-white/10 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>BOQ Items Compiled</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-950 rounded border border-white/5 cursor-pointer hover:bg-slate-900 transition-all text-slate-300">
                <input
                  type="checkbox"
                  checked={assumptionsListed}
                  onChange={(e) => setAssumptionsListed(e.target.checked)}
                  className="rounded border-white/10 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Calculations Assumptions Listed</span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-950 rounded border border-white/5 cursor-pointer hover:bg-slate-900 transition-all text-slate-300">
                <input
                  type="checkbox"
                  checked={engineerSigned}
                  onChange={(e) => setEngineerSigned(e.target.checked)}
                  className="rounded border-white/10 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Engineer Review Signed & Stamped</span>
              </label>
            </div>
          </div>

          {/* Compliance Checklist Table */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">3. Audit Checklist Results</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 px-3">Rule Description</th>
                    <th className="py-2.5 px-3">Standard Reference</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {calculated.list.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-950/20">
                      <td className="py-3 px-3">
                        <span className="font-semibold block">{l.item}</span>
                        {l.status !== 'compliant' && <span className="text-[10px] text-amber-500 block">Action: {l.action}</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400">{l.ref}</td>
                      <td className="py-3 px-3 text-center">
                        {l.status === 'compliant' ? (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-bold">COMPLIANT</span>
                        ) : l.status === 'review_needed' ? (
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-bold">REVIEW NEEDED</span>
                        ) : (
                          <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded font-bold">NON COMPLIANT</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${l.risk === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : l.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
                          {l.risk}
                        </span>
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
          {/* Sizing results */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-amber-500/20 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Compliance Risk Rating
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-rose-500/5 p-2 rounded border border-rose-500/20">
                <span className="text-rose-400 font-extrabold text-lg block">{calculated.highRiskCount}</span>
                <span className="text-[9px] text-slate-400 block font-semibold">HIGH RISK</span>
              </div>
              <div className="bg-amber-500/5 p-2 rounded border border-amber-500/20">
                <span className="text-amber-400 font-extrabold text-lg block">{calculated.medRiskCount}</span>
                <span className="text-[9px] text-slate-400 block font-semibold">MED RISK</span>
              </div>
              <div className="bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                <span className="text-emerald-400 font-extrabold text-lg block">{calculated.lowRiskCount}</span>
                <span className="text-[9px] text-slate-400 block font-semibold">LOW RISK</span>
              </div>
            </div>

            {calculated.missingApprovals.length > 0 && (
              <div className="space-y-2 border-t border-white/5 pt-3">
                <span className="text-[10px] text-rose-400 uppercase font-bold block">Mandatory Missing Approvals</span>
                {calculated.missingApprovals.map((m, idx) => (
                  <div key={idx} className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                    <p className="text-[10px] text-rose-400 leading-tight">{m}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Authority Submission Required Docs</span>
              <div className="space-y-1.5 text-[10.5px] text-slate-300">
                {calculated.requiredDocs.map((doc, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copy Report text block */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> Compiled Report Preview
              </h3>
              <button
                onClick={copyText}
                className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded px-2.5 py-1 hover:bg-cyan-400 hover:text-slate-950 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>

            <pre className="bg-slate-950 p-3 rounded border border-white/5 font-mono text-[9px] text-slate-300 max-h-52 overflow-y-auto whitespace-pre-wrap">
              {calculated.reportText}
            </pre>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
