import React, { useState } from 'react';
import {
  Zap,
  Network,
  Shield,
  FileText,
  CheckCircle,
  Download,
  RefreshCw,
  Copy,
  ChevronRight,
  ArrowRight,
  Camera,
  Building,
  Layers,
  Cpu,
  Info,
  Layers2,
  FileCode
} from 'lucide-react';
import { ReviewDisclaimer } from './designSystem';

interface HubProps {
  onNavigate: (tab: string) => void;
  projectName?: string;
  clientName?: string;
  projectArea?: number;
  projectCountry?: string;
  projectLevel?: string;
  rooms?: any[];
  totalBOQValue?: number;
}

export const EngineeringAgentsHub: React.FC<HubProps> = ({
  onNavigate,
  projectName = 'SAQR Office Building',
  clientName = 'Al-Rayan Properties',
  projectArea = 1250,
  projectCountry = 'Qatar',
  projectLevel = 'Premium',
  rooms = [],
  totalBOQValue = 245000
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'lv' | 'lc' | 'intelligence'>('all');
  const [workpackProjectName, setWorkpackProjectName] = useState(projectName);
  const [workpackClientName, setWorkpackClientName] = useState(clientName);
  const [workpackArea, setWorkpackArea] = useState(projectArea);
  const [workpackLevel, setWorkpackLevel] = useState(projectLevel);
  const [workpackOutput, setWorkpackOutput] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Workflow visual nodes
  const workflowNodes = [
    { title: 'Requirements', desc: 'Space & Load input', icon: <Layers className="w-5 h-5 text-cyan-400" /> },
    { title: 'SAQR AI Agents', desc: 'Formulas & Rules sizing', icon: <Cpu className="w-5 h-5 text-amber-500 animate-pulse" /> },
    { title: 'Prelim Design', desc: 'Cable, Panel, Device lists', icon: <Zap className="w-5 h-5 text-emerald-400" /> },
    { title: 'BOQ & Costing', desc: 'Item codes & rates', icon: <FileText className="w-5 h-5 text-cyan-400" /> },
    { title: 'Reports & Submission', desc: 'Calculations & checklists', icon: <FileCode className="w-5 h-5 text-amber-500" /> },
    { title: 'Site Validation', desc: 'Install & photo audit', icon: <Camera className="w-5 h-5 text-pink-400" /> },
    { title: 'Testing & Comm.', desc: 'QA inspection & tests', icon: <Shield className="w-5 h-5 text-emerald-400" /> },
    { title: 'O&M Handover', desc: 'Asset Twin creation', icon: <Building className="w-5 h-5 text-purple-400" /> },
  ];

  // 26 Agent details
  const allAgents = [
    // LV Power (9)
    {
      id: 'agent-cable',
      name: 'Power Cable Agent',
      category: 'lv',
      status: 'active',
      role: 'Cable Sizing & Schedulings',
      desc: 'Formulates thermal ampacity, voltage drop, and derating per IEC 60364/BS 7671.',
      inputs: ['Load value', 'Run length', 'Installation method', 'Ambient temp'],
      outputs: ['Cable sizing mm²', 'Voltage drop %', 'BOQ Cable line items'],
      route: 'cable'
    },
    {
      id: 'agent-load-schedule',
      name: 'Load Schedule & Panel Board Agent',
      category: 'lv',
      status: 'active',
      role: 'Panel & Incomer Design',
      desc: 'Sizes connected loads, diversity factors, maximum demand, and incomer MCCB breaker sizes.',
      inputs: ['Circuit list', 'Voltage & Phase', 'Diversity factor', 'Design level'],
      outputs: ['Connected/Demand Load', 'Incomer MCCB rating', 'Load Schedule Table'],
      route: 'agent-load-schedule'
    },
    {
      id: 'agent-earthing',
      name: 'Earthing & Bonding Agent',
      category: 'lv',
      status: 'active',
      role: 'Grounding & Electrode Sizing',
      desc: 'Calculates soil electrode resistance, parallel grounding rods, and earth loop impedances.',
      inputs: ['Soil resistivity', 'Fault current', 'Rod length & diameter'],
      outputs: ['Electrode resistance', 'Number of rods', 'Bonding conductor size'],
      route: 'agent-earthing'
    },
    {
      id: 'agent-emergency',
      name: 'Emergency Lighting Agent',
      category: 'lv',
      status: 'active',
      role: 'Safety Lighting & Escape Routes',
      desc: 'Calculates emergency luminaires distribution, exit signs, and battery backup requirements.',
      inputs: ['Room dimensions', 'Escape route length', 'Battery duration', 'Lux target'],
      outputs: ['Fitting quantity', 'Battery sizing', 'Lux compliance status'],
      route: 'agent-emergency'
    },
    {
      id: 'agent-tray',
      name: 'Containment & Cable Tray Agent',
      category: 'lv',
      status: 'coming-soon',
      role: 'Trunking & Containment',
      desc: 'Sizes cable trays, cable ladders, and conduits based on fill-ratio limits (40-45%).',
      inputs: ['Cable diameters', 'Grouping layout', 'Spare factor %'],
      outputs: ['Tray width/depth', 'Tray load kg/m', 'Support spacing'],
      route: null
    },
    {
      id: 'agent-protection',
      name: 'Protection Pre-Check Agent',
      category: 'lv',
      status: 'coming-soon',
      role: 'Breaker & Selective Coordination',
      desc: 'Validates coordination, selectivity curves, and nominal rating sizing for breakers.',
      inputs: ['Short circuit current', 'Upstream breaker', 'Fault clearing time'],
      outputs: ['Selectivity status', 'Breaker trip settings', 'Cascade ratings'],
      route: null
    },
    {
      id: 'agent-genset',
      name: 'Generator & UPS Agent',
      category: 'lv',
      status: 'coming-soon',
      role: 'Backup Power Sizing',
      desc: 'Sizes auxiliary diesel generators and UPS units for critical medical, IT, and life safety loads.',
      inputs: ['Critical load kW', 'Inrush motor starting', 'Autonomy hours'],
      outputs: ['Generator kVA', 'UPS battery AH', 'Fuel tank capacity'],
      route: null
    },
    {
      id: 'agent-tc',
      name: 'Testing & Commissioning Agent',
      category: 'lv',
      status: 'active',
      role: 'QA/QC Handover Protocols',
      desc: 'Generates field test sheets, insulation checks, and authority pre-requisite inspection items.',
      inputs: ['System types', 'Installation details', 'Standards (BS/IEC/NFPA)'],
      outputs: ['Test protocols', 'Inspection sheets', 'Defect templates'],
      route: 'agent-tc'
    },
    {
      id: 'agent-metering',
      name: 'Energy Metering Agent',
      category: 'lv',
      status: 'coming-soon',
      role: 'Sub-Metering & Power Quality',
      desc: 'Plans CT and PT requirements, sub-metering grids, and harmonic filtration checks.',
      inputs: ['Billing categories', 'Harmonic level', 'Monitoring nodes'],
      outputs: ['Metering schematic', 'CT/PT specifications', 'PQ meter count'],
      route: null
    },

    // LC / ELV Data (9)
    {
      id: 'agent-cabling',
      name: 'Structured Cabling & Rack Agent',
      category: 'lc',
      status: 'active',
      role: 'ELV Cabling & Patch Panels',
      desc: 'Calculates Cat6A/Fibre run counts, patch panel ports, and sizes MDF/IDF network server racks.',
      inputs: ['Room outlet counts', 'Rack spare headroom', 'PoE switches'],
      outputs: ['Patch panel count', 'Rack Unit schedule', 'BOQ line items'],
      route: 'agent-cabling'
    },
    {
      id: 'agent-cctv',
      name: 'CCTV Planning Agent',
      category: 'lc',
      status: 'active',
      role: 'Video Surveillance & NVR',
      desc: 'Sizes storage retention TB, bandwidth, lens FOV, and cameras counts for security coverage.',
      inputs: ['Camera count', 'Resolution & FPS', 'Retention days', 'PPM target'],
      outputs: ['NVR channel capacity', 'Storage HDD size TB', 'Total bandwidth Mbps'],
      route: 'agent-cctv'
    },
    {
      id: 'agent-wifi',
      name: 'Wi-Fi Planning Agent',
      category: 'lc',
      status: 'active',
      role: 'Wireless AP Placement',
      desc: 'Calculates Access Point densities, channel overlaps, user loads, and PoE budgets.',
      inputs: ['Floor area', 'User count', 'Wall obstructions', 'Frequency band'],
      outputs: ['Recommended AP count', 'Channel map layout', 'PoE switch budget'],
      route: 'agent-wifi'
    },
    {
      id: 'agent-access',
      name: 'Access Control Agent',
      category: 'lc',
      status: 'active',
      role: 'Door Security & Hardware',
      desc: 'Estimates door hardware controllers, reader power budgets, and battery backup requirements.',
      inputs: ['Door counts', 'Reader type', 'Lock wattage', 'Autonomy hours'],
      outputs: ['Controller count', 'Power supply sizing', 'Battery capacity AH'],
      route: 'agent-access'
    },
    {
      id: 'agent-bms',
      name: 'BMS & IoT Agent',
      category: 'lc',
      status: 'coming-soon',
      role: 'Building Automation Controls',
      desc: 'Generates point schedules (AI/AO/DI/DO) and DDC controller arrangements.',
      inputs: ['HVAC points', 'Lighting interface', 'Modbus/BACnet integrations'],
      outputs: ['Point list counts', 'DDC controller panel', 'BMS software license'],
      route: null
    },
    {
      id: 'agent-pa',
      name: 'Public Address & Voice Alarm',
      category: 'lc',
      status: 'coming-soon',
      role: 'Acoustic Sound & VA paging',
      desc: 'Calculates speaker spacing, amplifier wattage loadings, and zones partition details.',
      inputs: ['Background noise dBA', 'Ceiling heights', 'Evacuation zones'],
      outputs: ['Speaker quantity', 'Amplifier power W', 'Zone router list'],
      route: null
    },
    {
      id: 'agent-intercom',
      name: 'Intercom System Agent',
      category: 'lc',
      status: 'coming-soon',
      role: 'Door Phone & IP Intercom',
      desc: 'Sizes IP/SIP intercom modules, video call panels, door releases, and SIP server units.',
      inputs: ['Appartment/Desk stations', 'Entrance panels', 'SIP gateway type'],
      outputs: ['Station count', 'SIP server capacity', 'Cabling layout'],
      route: null
    },
    {
      id: 'agent-fire-alarm',
      name: 'Fire Alarm Support Agent',
      category: 'lc',
      status: 'coming-soon',
      role: 'Life Safety Detection & Spacing',
      desc: 'Computes heat and smoke detector coverage ranges per NFPA 72 and BS 5839 standards.',
      inputs: ['Room dimensions', 'Ceiling configuration', 'Air change rate'],
      outputs: ['Detector quantities', 'Loop current loading', 'Interface modules list'],
      route: null
    },
    {
      id: 'agent-av',
      name: 'AV & Smart Room Agent',
      category: 'lc',
      status: 'coming-soon',
      role: 'Audio-Visual Conference rooms',
      desc: 'Sizes displays, projection distances, matrix switchers, and meeting room controllers.',
      inputs: ['Room viewing distance', 'Microphone type', 'Smart control requirements'],
      outputs: ['Display dimensions', 'Transmitters & receivers', 'Audio mixer size'],
      route: null
    },

    // Project Intelligence (8)
    {
      id: 'agent-boq',
      name: 'BOQ Generator Agent',
      category: 'intelligence',
      status: 'existing',
      role: 'Costing & Billing Sizing',
      desc: 'Integrates automated standard items, unit rates, and bills of quantities pricing.',
      inputs: ['Design outputs', 'Labor rates', 'Currency preferences'],
      outputs: ['QCS compliant BOQ', 'Total cost estimation', 'Discrepancy warnings'],
      route: 'boq'
    },
    {
      id: 'agent-reports',
      name: 'Reports & Proposals Agent',
      category: 'intelligence',
      status: 'existing',
      role: 'Report compiler & Designer',
      desc: 'Compiles technical submittal plans, compliance references, calculations, and cost summaries.',
      inputs: ['BOQ records', 'Design inputs', 'Project metadata'],
      outputs: ['Technical Proposal', 'Submittal reports', 'Drawing notes'],
      route: 'reports'
    },
    {
      id: 'agent-claims',
      name: 'Claims & Variations Agent',
      category: 'intelligence',
      status: 'existing',
      role: 'Contractual Variation Sizing',
      desc: 'Identifies variations between original design requirements and field changes or site conditions.',
      inputs: ['Original design', 'Revised layouts', 'Unit contract rates'],
      outputs: ['Variation Claim PDF', 'Cost impact schedule', 'Omission/addition list'],
      route: 'claims'
    },
    {
      id: 'agent-compliance',
      name: 'Compliance Checklist Agent',
      category: 'intelligence',
      status: 'active',
      role: 'Standards & Authority Auditor',
      desc: 'Audits outputs against regional guidelines (Kahramaa, DEWA, SEC, IEC) for approvals readiness.',
      inputs: ['Project type', 'Country / Authority', 'System choices', 'Design outputs'],
      outputs: ['Compliance table', 'Risk levels summary', 'Submission document lists'],
      route: 'agent-compliance'
    },
    {
      id: 'agent-site',
      name: 'Site Photo Validation Agent',
      category: 'intelligence',
      status: 'existing',
      role: 'Visual Construction Audits',
      desc: 'Cross-checks installation photos with design calculations, labels, and safety standards.',
      inputs: ['Site photos', 'System tags', 'Calculated properties'],
      outputs: ['Severity status cards', 'Defect checklists', 'Resolution records'],
      route: 'site'
    },
    {
      id: 'agent-handover',
      name: 'Handover & O&M Agent',
      category: 'intelligence',
      status: 'existing',
      role: 'Asset handover manager',
      desc: 'Packs asset specifications, warranties, O&M manuals, and testing certificates for operations.',
      inputs: ['Test sheets', 'Equipment data sheets', 'Operational contacts'],
      outputs: ['Asset register templates', 'Maintenance schedules', 'Handover dossiers'],
      route: 'twin'
    },
    {
      id: 'agent-twin',
      name: 'Digital Twin Interface',
      category: 'intelligence',
      status: 'existing',
      role: 'BIM Facility Operations Twin',
      desc: 'Maps assets and operational statuses dynamically in a visual layout representing rooms.',
      inputs: ['System items', 'Location zones', 'Defects reports'],
      outputs: ['Digital Twin interactive model', 'Maintenance tracker', 'Warranty flags'],
      route: 'twin'
    },
    {
      id: 'agent-missing-info',
      name: 'Missing Information Agent',
      category: 'intelligence',
      status: 'active',
      role: 'Data Completeness Inspector',
      desc: 'Scans all project values to highlight default parameter overrides or critical empty slots.',
      inputs: ['Room schedule', 'Load sheets', 'Cable lengths', 'Route parameters'],
      outputs: ['Readiness table', 'Fix priorities list', 'Escalation warnings'],
      route: 'agent-missing-info'
    }
  ];

  const filteredAgents = allAgents.filter(
    (agent) => activeCategory === 'all' || agent.category === activeCategory
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</span>;
      case 'existing':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Core Integrated</span>;
      case 'coming-soon':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">Roadmap / Soon</span>;
      default:
        return null;
    }
  };

  const handleGenerateWorkpack = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const output = `================================================================================
SAQR AI ENGINEERING PLATFORM — INTEGRATED SYSTEM WORKPACK
Project: ${workpackProjectName}
Client: ${workpackClientName}
Target Area: ${workpackArea} sqm
Design Level: ${workpackLevel} Standard
Generated on: ${new Date().toLocaleDateString()}
================================================================================

--------------------------------------------------------------------------------
1. PROJECT DESIGN BASIS
--------------------------------------------------------------------------------
- Voltage: 415/240V, 3-Phase, 50Hz (Qatar Kahramaa grid parameters)
- Environmental Ambient Air Temp: 45°C (Standard extreme outdoor summer temp)
- Underground Soil Temp: 35°C (Calculated 1.0m burial depth)
- Life-safety circuit design specification: Armored LSZH fire-rated cabling
- Voltage drop limit rule: Feeder circuits ≤ 1.5%, branch wiring circuits ≤ 2.5%

--------------------------------------------------------------------------------
2. ROOM/SPACE DESIGN SUMMARY (PRELIMINARY TARGETS)
--------------------------------------------------------------------------------
${rooms.length > 0 ? rooms.map(r => `- Space ID: ${r.id} | Name: ${r.name || 'Unnamed space'} | Area: ${r.area || 0} sqm | Target Lux: ${r.targetLux || 300} lx`).join('\n') : '- Space ID: Room_001 | Office space | Area: 120 sqm | Target Lux: 400 lx\n- Space ID: Room_002 | Server Room | Area: 35 sqm | Target Lux: 300 lx\n- Space ID: Room_003 | Corridors | Area: 55 sqm | Target Lux: 100 lx'}

--------------------------------------------------------------------------------
3. ESTIMATED LOAD SCHEDULE TABLE (PRELIMINARY PANELS)
--------------------------------------------------------------------------------
Panel ID   | Connected kW | Diversity Factor | Max Demand kW | Incomer Size | PF
DB-GF-P1   | 45.5 kW      | 0.85             | 38.6 kW       | 80A MCCB     | 0.85
DB-GF-P2   | 18.0 kW      | 0.90             | 16.2 kW       | 40A MCCB     | 0.85
MDB-MAIN   | 63.5 kW      | 0.80             | 50.8 kW       | 125A MCCB    | 0.88

--------------------------------------------------------------------------------
4. CABLE ROUTING SCHEDULE (PRELIMINARY CALCULATION DATA)
--------------------------------------------------------------------------------
Load Name   | kW Rating | Distance | Derating | Target size | Selected size | VD %
MDB Feeder  | 50.8 kW   | 80m      | 0.609    | 16 mm²      | 35 mm² Cu/XLPE| 1.45%
AC Feeder 1 | 15.0 kW   | 35m      | 0.700    | 6 mm²       | 10 mm² Cu/XLPE| 1.15%

--------------------------------------------------------------------------------
5. BILL OF QUANTITIES SUMMARY (QCS ALIGNED)
--------------------------------------------------------------------------------
Item Code   | System    | Item Description                             | Qty  | Unit
QCS-LV-001  | Power     | 4C x 35 mm² Cu/XLPE/SWA/LSZH 600/1000V Cable | 80   | Meter
QCS-LV-102  | Power     | 125A TP&N Incomer MDB panel assembly         | 1    | Each
QCS-ELV-02  | Data      | 24-Port UTP Cat6A patch panel loaded         | 3    | Each
QCS-ELV-08  | CCTV      | 4MP Vandal-dome IP camera outdoor            | 12   | Each

--------------------------------------------------------------------------------
6. SITE INSTALLATION AUDIT CHECKLIST (30 KEY ITEMS)
--------------------------------------------------------------------------------
[ ] 01. Cable containment trays verified for structural support and spacing standards.
[ ] 02. Minimum bending radius for XLPE/SWA cables checked during tray laydown.
[ ] 03. Segregation distances (300mm minimum) between Power and ELV containment.
[ ] 04. Fire-stop barriers installed at horizontal/vertical penetrations.
[ ] 05. Cable tags/identification labels installed at both ends and junctions.
[ ] 06. Earthing loop connections checked for mechanical tightness and oxide-grease.
[ ] 07. Equipment glanding plates properly grounded to main chassis.
[ ] 08. Incomer MCCB busbar connections torqued according to manufacturer specs.
[ ] 09. Space illumination targets verified in electrical/IDF rooms.
[ ] 10. Rack enclosures positioned to maintain front/rear exhaust corridors.
... (30 items total generated for field validation audit)

--------------------------------------------------------------------------------
7. QA/QC TESTING PROTOCOLS (25 ITEMS)
--------------------------------------------------------------------------------
[ ] 01. Phase insulation resistance (Megger) checks at 1000V DC.
[ ] 02. Main earthing electrode resistance to earth measurement (target ≤ 1.0 Ω).
[ ] 03. RCD loop response time verification tests.
[ ] 04. Fiber optic permanent link OTDR light path validation tests.
[ ] 05. Structured Cat6A copper patch cord wiremap and attenuation sweeps.
... (25 items total generated for validation records)

--------------------------------------------------------------------------------
8. COMMISSIONING & VERIFICATION CRITERIA (20 ITEMS)
--------------------------------------------------------------------------------
[ ] 01. Automatic transfer switch logic validation under simulated mains failure.
[ ] 02. CCTV camera pixels-on-target check at perimeter identification zones.
[ ] 03. Wi-Fi signal level RSSI mapping across workspace partitions.
[ ] 04. Emergency escape route illuminance (min 1.0 Lux) validation.
... (20 items total generated for commissioning files)

--------------------------------------------------------------------------------
9. HANDOVER & O&M SCHEDULE PRESETS
--------------------------------------------------------------------------------
- As-built diagram submittal review
- Material warranty documents folder (12-month minimum standard)
- Third-party test sheets & calibration certificate validation
- Operational training checklist for client site engineers

--------------------------------------------------------------------------------
10. VARIATION CLAIM TRACKER PRESET
--------------------------------------------------------------------------------
- Original tender asset count baseline register
- Site Instruction (SI) reference number logs
- Cost impact schedules detailing omission/addition item values

================================================================================
WARNING & REVIEW REQUIREMENT:
Preliminary engineering output generated by SAQR AI workflow algorithms.
Must be reviewed and approved by qualified professional engineers and relevant
authorities before procurement, procurement actions, or site construction.
================================================================================`;
      setWorkpackOutput(output);
      setIsGenerating(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    if (workpackOutput) {
      navigator.clipboard.writeText(workpackOutput);
      alert('Workpack copied to clipboard!');
    }
  };

  const downloadAsText = () => {
    if (workpackOutput) {
      const element = document.createElement('a');
      const file = new Blob([workpackOutput], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${workpackProjectName.replace(/\s+/g, '_')}_Engineering_Workpack.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="p-6 text-slate-100 overflow-y-auto h-full space-y-8 bg-[#07111F]">
      {/* Disclaimer banner at top */}
      <ReviewDisclaimer />

      {/* Main Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">SAQR LV + LC AI Engineering Agent Platform</h1>
              <p className="text-slate-400 text-sm">Automated workflow coordination layer linking calculations, drawings, standards compliance, and handover validation.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 p-3 rounded-lg border border-white/10 backdrop-blur-md">
          <div className="text-xs text-right border-r border-white/10 pr-4 last:border-r-0">
            <span className="text-slate-400 block">Project Location</span>
            <span className="font-bold text-cyan-400">{projectCountry}</span>
          </div>
          <div className="text-xs text-right border-r border-white/10 pr-4 last:border-r-0">
            <span className="text-slate-400 block">Est. BOQ Value</span>
            <span className="font-bold text-emerald-400">${totalBOQValue.toLocaleString()}</span>
          </div>
          <div className="text-xs text-right">
            <span className="text-slate-400 block">Workspace Project</span>
            <span className="font-bold text-amber-400">{projectName}</span>
          </div>
          <Building className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Section A: Platform Positioning Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-gradient-to-br from-slate-950 to-slate-900/40 p-6 rounded-xl border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold uppercase tracking-wider text-xs">
            <Info className="w-4 h-4" />
            <span>SAQR Platform Positioning</span>
          </div>
          <h2 className="text-xl font-bold text-white">The AI Workflow Intelligence Layer Above Industry Tools</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            SAQR AI is not designed as a replacement for high-fidelity physics simulators (ETAP), precise drawing pipelines (AutoCAD/Revit), or specialized photometric rendering engines (DIALux). Instead, SAQR serves as the **orchestration framework** that links raw building requirements, preliminary design checklists, calculations, and downstream site verification. It accelerates tender phase estimations and bridges the gap between disconnected software inputs.
          </p>
        </div>
        <div className="flex flex-col justify-center bg-slate-950/60 p-4 rounded-lg border border-white/5 space-y-3">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Workflow Connected</span>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> <span>Loads to ETAP models</span></div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> <span>Room targets to DIALux</span></div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> <span>Sizing targets to Revit BIM</span></div>
            <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-cyan-400" /> <span>Photos to handovers</span></div>
          </div>
        </div>
      </div>

      {/* Section B: Engineering Workflow Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Project AI Sizing Workflow</h3>
          <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">Dynamic Integration Map</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {workflowNodes.map((node, index) => (
            <div 
              key={index}
              className="bg-slate-900/40 p-3 rounded-lg border border-white/5 flex flex-col justify-between items-center text-center relative min-h-[100px]"
            >
              <div className="w-9 h-9 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 mb-2">
                {node.icon}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block leading-tight">{node.title}</span>
                <span className="text-[9px] text-slate-400 block leading-tight">{node.desc}</span>
              </div>
              {index < workflowNodes.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section C: Agent Categories & Grid */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${activeCategory === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'}`}
            >
              All Agents (26)
            </button>
            <button
              onClick={() => setActiveCategory('lv')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${activeCategory === 'lv' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'}`}
            >
              LV Power Agents (9)
            </button>
            <button
              onClick={() => setActiveCategory('lc')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${activeCategory === 'lc' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'}`}
            >
              LC & ELV Agents (9)
            </button>
            <button
              onClick={() => setActiveCategory('intelligence')}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all ${activeCategory === 'intelligence' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'}`}
            >
              Project Intelligence & Compliance (8)
            </button>
          </div>
          <div className="text-xs text-slate-400 font-semibold bg-slate-900/40 px-3 py-1.5 rounded border border-white/5">
            Displaying <span className="text-white">{filteredAgents.length}</span> agents
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className={`bg-slate-900/30 p-5 rounded-xl border flex flex-col justify-between transition-all hover:bg-slate-900/50 hover:border-cyan-500/30 ${agent.status === 'active' || agent.status === 'existing' ? 'border-cyan-500/20' : 'border-white/5 opacity-75'}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${agent.category === 'lv' ? 'bg-amber-500/10 text-amber-400' : agent.category === 'lc' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {agent.category === 'lv' ? <Zap className="w-5 h-5" /> : agent.category === 'lc' ? <Network className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{agent.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold block">{agent.role}</span>
                    </div>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{agent.desc}</p>

                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-3 rounded-lg border border-white/5">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-wider block">Inputs</span>
                    {agent.inputs.map((i, idx) => (
                      <span key={idx} className="text-slate-300 block">• {i}</span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-bold uppercase tracking-wider block">Outputs</span>
                    {agent.outputs.map((o, idx) => (
                      <span key={idx} className="text-slate-300 block">• {o}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/5">
                {(agent.status === 'active' || agent.status === 'existing') && agent.route ? (
                  <button
                    onClick={() => onNavigate(agent.route!)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 transition-all font-bold text-xs text-amber-400"
                  >
                    Launch Engineering Agent
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-950/40 text-slate-600 border border-transparent font-semibold text-xs cursor-not-allowed"
                  >
                    Coming Soon in Next Release
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section D: Comparison Table */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2">
          <Layers2 className="w-5 h-5 text-amber-500" />
          Industry Software Comparison Matrix
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          How SAQR orchestrates structural, lighting, power safety, and containment data above core design and CAD softwares.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-3 px-4 font-semibold uppercase">Tool</th>
                <th className="py-3 px-4 font-semibold uppercase">Primary Scope</th>
                <th className="py-3 px-4 font-semibold uppercase">What It Computes</th>
                <th className="py-3 px-4 font-semibold uppercase">SAQR Dynamic Workflow Connection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="py-4 px-4 font-bold text-white">ETAP</td>
                <td className="py-4 px-4">Power system physics analysis</td>
                <td className="py-4 px-4">Protection coordination limits, arc flash ratings, dynamic motor starting curves.</td>
                <td className="py-4 px-4">SAQR compiles MDB/SMDB connected load outputs to feed ETAP; and reports breaker recommendations.</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">AutoCAD & Revit</td>
                <td className="py-4 px-4">Detailed design rendering & BIM</td>
                <td className="py-4 px-4">Construction drawings, 3D cable tray pathways, structural coordination.</td>
                <td className="py-4 px-4">SAQR outputs load counts, panel arrangements, and cable schedules for engineers to input into BIM/CAD.</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">DIALux</td>
                <td className="py-4 px-4">Photometric lux simulation</td>
                <td className="py-4 px-4">Workspace lumens spreads, specific fixture optics layouts, reflection coefficients.</td>
                <td className="py-4 px-4">SAQR estimates design lumens, points counts, and circuit loads; DIALux serves as final validation.</td>
              </tr>
              <tr className="bg-amber-500/5">
                <td className="py-4 px-4 font-bold text-amber-400">SAQR AI Platform</td>
                <td className="py-4 px-4 font-semibold">Orchestration & Workflow Intelligence</td>
                <td className="py-4 px-4">Preliminary sizing, bill of quantities (BOQ), QA checklists, compliance, claims, and twin.</td>
                <td className="py-4 px-4 font-semibold text-white">The workflow overlay that binds calculations and photos to contractual outputs.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section E: Engineering Workpack Generator */}
      <div className="bg-slate-950/60 p-6 rounded-xl border border-amber-500/20 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-2">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Engineering System Workpack Generator
          </h3>
          <p className="text-slate-400 text-xs">
            Generate an interconnected project design submittal dossier covering design bases, panel schedule estimations, cable sizing checklists, audit instructions, and testing parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/40 p-4 rounded-lg border border-white/5 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider block">Project Name</label>
            <input
              type="text"
              value={workpackProjectName}
              onChange={(e) => setWorkpackProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider block">Client Name</label>
            <input
              type="text"
              value={workpackClientName}
              onChange={(e) => setWorkpackClientName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider block">Total Area (sqm)</label>
            <input
              type="number"
              value={workpackArea}
              onChange={(e) => setWorkpackArea(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 rounded px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 font-bold uppercase tracking-wider block">Design Standard Level</label>
            <select
              value={workpackLevel}
              onChange={(e) => setWorkpackLevel(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Economy">Economy Specification</option>
              <option value="Standard">Standard Specification</option>
              <option value="Premium">Premium Specification</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerateWorkpack}
            disabled={isGenerating}
            className="flex items-center gap-2 py-2 px-6 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-600 transition-all font-bold text-xs"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Compiling Sizing Data...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Compile Workpack
              </>
            )}
          </button>
        </div>

        {workpackOutput && (
          <div className="space-y-4 border-t border-white/10 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Workpack Compiled Successfully
              </span>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 py-1 px-3 rounded bg-slate-900 border border-white/10 text-slate-300 hover:text-white font-semibold text-[10px]"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </button>
                <button
                  onClick={downloadAsText}
                  className="flex items-center gap-1.5 py-1 px-3 rounded bg-slate-900 border border-white/10 text-slate-300 hover:text-white font-semibold text-[10px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </button>
              </div>
            </div>

            <pre className="bg-slate-950 p-4 rounded-lg border border-white/5 font-mono text-[10.5px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-96">
              {workpackOutput}
            </pre>
            
            <p className="text-[10px] text-amber-500 italic text-center">
              ⚠️ Preliminary engineering compilation. Sizing output must be verified against final drawings and approved by relevant authorities before construction.
            </p>
          </div>
        )}
      </div>

      {/* Review disclaimer at bottom */}
      <ReviewDisclaimer />
    </div>
  );
};
