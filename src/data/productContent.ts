export type AgentConfidence = 'High' | 'Medium' | 'Low' | 'Needs Review';

export interface SaqrAgentDefinition {
  id: string;
  name: string;
  shortName: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  status: 'Ready' | 'Active' | 'Review Required' | 'Draft' | 'Warning';
  confidence: AgentConfidence;
  nextAction: string;
  buttonLabel: string;
  iconKey: 'design' | 'boq' | 'report' | 'site' | 'claims' | 'facility' | 'compliance';
}

export interface EngineeringFormulaDefinition {
  id: string;
  title: string;
  formula: string;
  purpose: string;
  definitions: Array<{ term: string; meaning: string }>;
  example: {
    title: string;
    steps: string[];
    result: string;
  };
  warning: string;
  usedInModule: string;
}

export interface CaseStudyDefinition {
  title: string;
  type: string;
  area: string;
  systems: string[];
  problem: string;
  workflow: string[];
  outputs: string[];
  businessValue: string;
  agents: string[];
}

export const saqrAgents: SaqrAgentDefinition[] = [
  {
    id: 'design',
    name: 'Design Agent',
    shortName: 'Design Agent',
    purpose: 'Generates preliminary lighting, power, data, CCTV, Wi-Fi, access control, BMS, and server room design concepts.',
    inputs: ['Rooms', 'Area', 'Ceiling height', 'Occupancy', 'Design level', 'Project type'],
    outputs: ['Point schedules', 'Design assumptions', 'Warnings', 'Engineer review notes'],
    status: 'Ready',
    confidence: 'High',
    nextAction: 'Generate preliminary point schedules from current rooms.',
    buttonLabel: 'Run Design Agent',
    iconKey: 'design'
  },
  {
    id: 'boq',
    name: 'BOQ Agent',
    shortName: 'BOQ Agent',
    purpose: 'Converts design outputs into editable BOQ quantities, cost summaries, and procurement-ready item lines.',
    inputs: ['Room schedule', 'Calculated points', 'System assumptions', 'Unit rates'],
    outputs: ['BOQ table', 'System cost breakdown', 'Total estimate', 'Confidence level'],
    status: 'Active',
    confidence: 'High',
    nextAction: 'Regenerate quantities from the current design model.',
    buttonLabel: 'Run BOQ Agent',
    iconKey: 'boq'
  },
  {
    id: 'report',
    name: 'Report Agent',
    shortName: 'Report Agent',
    purpose: 'Generates professional engineering reports from project data.',
    inputs: ['Project info', 'Rooms', 'Calculations', 'BOQ', 'Warnings'],
    outputs: ['Executive summary', 'Technical report', 'Assumptions', 'Exclusions', 'Disclaimer'],
    status: 'Ready',
    confidence: 'Medium',
    nextAction: 'Generate an engineering report with formulas and assumptions.',
    buttonLabel: 'Generate Engineering Report',
    iconKey: 'report'
  },
  {
    id: 'site',
    name: 'Site Validation Agent',
    shortName: 'Site Agent',
    purpose: 'Reviews site photos and identifies visible installation issues.',
    inputs: ['Site photos', 'Room name', 'System category', 'Expected installation scope'],
    outputs: ['Findings', 'Severity', 'Engineer action', 'Handover notes'],
    status: 'Review Required',
    confidence: 'Needs Review',
    nextAction: 'Validate uploaded site photos against design and checklist.',
    buttonLabel: 'Validate Site Photo',
    iconKey: 'site'
  },
  {
    id: 'claims',
    name: 'Claims Agent',
    shortName: 'Claims Agent',
    purpose: 'Helps identify potential variation claims and scope changes.',
    inputs: ['Original BOQ', 'Revised scope', 'Site evidence', 'Changes', 'Notes'],
    outputs: ['Claim summary', 'Estimated value', 'Evidence list', 'Draft claim letter'],
    status: 'Draft',
    confidence: 'Medium',
    nextAction: 'Create or review draft variation claims.',
    buttonLabel: 'Create Variation Claim',
    iconKey: 'claims'
  },
  {
    id: 'facility',
    name: 'Facility Twin Agent',
    shortName: 'Facility Agent',
    purpose: 'Converts project delivery data into asset records and maintenance intelligence.',
    inputs: ['Installed equipment', 'Asset data', 'Warranties', 'Testing status'],
    outputs: ['Asset register', 'Warranty tracker', 'Maintenance schedule', 'QR-ready handover records'],
    status: 'Active',
    confidence: 'High',
    nextAction: 'Build facility asset records from delivered systems.',
    buttonLabel: 'Build Facility Twin',
    iconKey: 'facility'
  },
  {
    id: 'compliance',
    name: 'Compliance Agent',
    shortName: 'Compliance Agent',
    purpose: 'Checks missing inputs, incomplete assumptions, review requirements, and engineering disclaimers.',
    inputs: ['Design outputs', 'Project templates', 'Warnings', 'Missing fields'],
    outputs: ['Compliance checklist', 'Missing information', 'Engineer review status'],
    status: 'Warning',
    confidence: 'Needs Review',
    nextAction: 'Review missing assumptions and approval requirements.',
    buttonLabel: 'Review Engineering Assumptions',
    iconKey: 'compliance'
  }
];

export const engineeringFormulasKnowledge: EngineeringFormulaDefinition[] = [
  {
    id: 'lighting-fixture-estimate',
    title: 'Lighting Fixture Estimate',
    formula: 'Number of Fixtures = (Required Lux × Room Area) / (Fixture Lumens × Utilization Factor × Maintenance Factor)',
    purpose: 'Estimate the number of fixtures required to reach a target illumination level.',
    definitions: [
      { term: 'Required Lux', meaning: 'Target illumination level for the room type.' },
      { term: 'Room Area', meaning: 'Room size in square meters.' },
      { term: 'Fixture Lumens', meaning: 'Light output of one fixture.' },
      { term: 'Utilization Factor', meaning: 'How efficiently light reaches the working plane.' },
      { term: 'Maintenance Factor', meaning: 'Allowance for light loss over time.' }
    ],
    example: {
      title: 'Open office area',
      steps: [
        'Area = 420 sqm, Target lux = 500, Fixture lumen = 3,200, UF = 0.6, MF = 0.8',
        '(500 × 420) / (3,200 × 0.6 × 0.8) = 136.7'
      ],
      result: 'Rounded estimate: 137 fixtures'
    },
    warning: 'Validate with professional lighting software and engineer review before procurement or construction.',
    usedInModule: 'Design Agent, Lighting Assistant, Room Intelligence, BOQ Agent'
  },
  {
    id: 'preliminary-power-load',
    title: 'Preliminary Power Load',
    formula: 'Estimated Load = Connected Load × Demand Factor',
    purpose: 'Convert connected equipment load into a preliminary expected operating load.',
    definitions: [
      { term: 'Connected Load', meaning: 'Total rated power of connected devices.' },
      { term: 'Demand Factor', meaning: 'Percentage of load expected to operate simultaneously.' }
    ],
    example: {
      title: 'Commercial office connected load',
      steps: [
        'Connected Load = 40 kW, Demand Factor = 0.65',
        'Estimated Load = 40 × 0.65 = 26 kW'
      ],
      result: 'Preliminary diversified load: 26 kW'
    },
    warning: 'Does not replace detailed electrical load calculation by a qualified engineer.',
    usedInModule: 'Design Agent, Power Assistant, Compliance Agent'
  },
  {
    id: 'socket-requirement-estimate',
    title: 'Socket Requirement Estimate',
    formula: 'Socket Count = Workstations × Sockets per Workstation + Dedicated Equipment Sockets',
    purpose: 'Estimate power outlet requirements based on user workpoints and special equipment.',
    definitions: [
      { term: 'Workstations', meaning: 'Number of desks or users.' },
      { term: 'Sockets per Workstation', meaning: 'Typical number of power outlets per desk.' },
      { term: 'Dedicated Equipment Sockets', meaning: 'Sockets for printers, screens, pantry devices, server racks, or special equipment.' }
    ],
    example: {
      title: 'Open office socket count',
      steps: [
        'Workstations = 48, Sockets per workstation = 2, Dedicated equipment sockets = 8',
        'Socket Count = 48 × 2 + 8 = 104'
      ],
      result: 'Preliminary requirement: 104 socket points'
    },
    warning: 'Final circuiting, load grouping, and outlet positions require engineer review.',
    usedInModule: 'Design Agent, Power Assistant, BOQ Agent'
  },
  {
    id: 'data-outlet-estimate',
    title: 'Data Outlet Estimate',
    formula: 'Data Points = Workstations × Data Points per Workstation + Shared Equipment Data Points',
    purpose: 'Estimate structured cabling outlets for users and shared equipment.',
    definitions: [
      { term: 'Data Points per Workstation', meaning: 'Usually 1 to 2 outlets per workstation.' },
      { term: 'Shared Equipment Data Points', meaning: 'Printers, access points, meeting room screens, IP phones, and similar equipment.' }
    ],
    example: {
      title: 'Office data outlets',
      steps: [
        'Workstations = 48, Data points per workstation = 2, Shared equipment points = 12',
        'Data Points = 48 × 2 + 12 = 108'
      ],
      result: 'Preliminary requirement: 108 data points'
    },
    warning: 'Final data outlet layout depends on furniture, rack capacity, pathways, and IT standards.',
    usedInModule: 'Design Agent, Data & ELV Assistant, BOQ Agent'
  },
  {
    id: 'wifi-access-point-estimate',
    title: 'Wi-Fi Access Point Estimate',
    formula: 'AP Count = Ceiling(Room Area / Coverage Area per AP)',
    purpose: 'Create a first-pass access point count for Wi-Fi coverage planning.',
    definitions: [
      { term: 'Room Area', meaning: 'Total area to cover.' },
      { term: 'Coverage Area per AP', meaning: 'Estimated coverage based on walls, density, and device load.' }
    ],
    example: {
      title: 'Office Wi-Fi planning',
      steps: [
        'Area = 1,000 sqm, Coverage Area per AP = 150 sqm',
        'AP Count = Ceiling(1,000 / 150) = 7'
      ],
      result: 'Preliminary requirement: 7 access points'
    },
    warning: 'Final Wi-Fi design requires site survey, wall material review, interference analysis, and capacity planning.',
    usedInModule: 'Design Agent, Data & ELV Assistant, Compliance Agent'
  },
  {
    id: 'cctv-camera-estimate',
    title: 'CCTV Camera Estimate',
    formula: 'Rule: Cover entrances, reception areas, corridors, server room entrances, restricted areas, and critical movement paths.',
    purpose: 'Identify the primary security coverage zones before detailed camera placement.',
    definitions: [
      { term: 'Field of View', meaning: 'The visible angle and distance captured by the camera lens.' },
      { term: 'Blind Spot', meaning: 'An area not covered by any camera view.' },
      { term: 'Critical Movement Path', meaning: 'A route where access, security, or operational movement needs recordable visibility.' }
    ],
    example: {
      title: 'Office security coverage',
      steps: [
        'Entrances = 2, Reception = 1, Corridor zones = 6, Server room entrance = 1',
        'Rule-based estimate = 2 + 1 + 6 + 1 = 10'
      ],
      result: 'Preliminary requirement: 10 CCTV cameras'
    },
    warning: 'Camera quantity depends on field of view, lens type, mounting height, blind spots, and security requirements.',
    usedInModule: 'Design Agent, Site Validation Agent, Compliance Agent'
  },
  {
    id: 'boq-total',
    title: 'BOQ Total',
    formula: 'BOQ Total = Σ(Quantity × Unit Rate)',
    purpose: 'Aggregate estimated quantities and rates into a preliminary project value.',
    definitions: [
      { term: 'Quantity', meaning: 'Estimated number of units.' },
      { term: 'Unit Rate', meaning: 'Cost per unit.' },
      { term: 'Total', meaning: 'Quantity multiplied by unit rate.' }
    ],
    example: {
      title: 'Fixture cost line',
      steps: [
        'Quantity = 137 fixtures, Unit Rate = QAR 220',
        'Line Total = 137 × 220 = QAR 30,140'
      ],
      result: 'BOQ totals are the sum of all line totals.'
    },
    warning: 'BOQ values are preliminary unless approved quantities, supplier rates, and final drawings are confirmed.',
    usedInModule: 'BOQ Agent, Claims Agent, Report Agent'
  }
];

export const caseStudies: CaseStudyDefinition[] = [
  {
    title: 'Doha Smart Office Fit-Out',
    type: 'Commercial office',
    area: '1,000 sqm',
    systems: ['Lighting', 'Power', 'Data', 'CCTV', 'Wi-Fi', 'Access Control', 'BMS', 'Server Room'],
    problem: 'Manual design preparation, BOQ estimation, and report writing takes days.',
    workflow: [
      'Room schedule imported',
      'Design Agent calculates preliminary points',
      'BOQ Agent generates estimated cost',
      'Report Agent creates concept report',
      'Site Agent validates installation photos',
      'Facility Agent creates asset register'
    ],
    outputs: [
      '12 rooms analyzed',
      'QAR 116,375 BOQ estimate',
      '9 BOQ items',
      '1 site finding',
      '1 facility asset'
    ],
    businessValue: 'Reduces early concept and commercial preparation time while giving consultants a clearer review trail.',
    agents: ['Design Agent', 'BOQ Agent', 'Report Agent', 'Site Agent', 'Facility Agent']
  },
  {
    title: 'Lusail Clinic ELV Upgrade',
    type: 'Healthcare clinic',
    area: '650 sqm',
    systems: ['Data', 'CCTV', 'Access Control', 'Wi-Fi', 'BMS', 'Server Room'],
    problem: 'Clinic requires secure network, camera coverage, controlled access, and documented handover.',
    workflow: [
      'Design Agent identifies critical rooms',
      'ELV logic estimates data and CCTV points',
      'Compliance Agent flags restricted area review',
      'BOQ Agent generates ELV quantity estimate',
      'Facility Agent prepares handover asset list'
    ],
    outputs: [
      'Critical rooms identified',
      'Access control recommended',
      'Server room requires UPS-backed circuits',
      'Engineer review warning generated'
    ],
    businessValue: 'Makes security, network, and handover gaps visible before procurement begins.',
    agents: ['Design Agent', 'BOQ Agent', 'Compliance Agent', 'Facility Agent']
  },
  {
    title: 'West Bay Data Room Fit-Out',
    type: 'Small data room / IT infrastructure',
    area: '120 sqm',
    systems: ['Power', 'UPS', 'Data', 'Rack', 'Cooling notes', 'Access Control', 'CCTV', 'BMS'],
    problem: 'Data room requires careful coordination between power, cooling, security, and monitoring.',
    workflow: [
      'Design Agent creates infrastructure concept',
      'Power Agent flags dedicated circuits and UPS requirement',
      'ELV Agent generates rack and patch panel assumptions',
      'BMS Agent recommends temperature sensors',
      'Facility Agent creates asset and warranty records'
    ],
    outputs: [
      'UPS-backed load warning',
      'Rack and patch panel estimate',
      'BMS sensor recommendation',
      'Maintenance schedule generated'
    ],
    businessValue: 'Turns a high-risk technical room into a structured engineering review package.',
    agents: ['Design Agent', 'BOQ Agent', 'Facility Agent', 'Compliance Agent']
  }
];
