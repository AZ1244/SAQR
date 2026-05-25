export interface RoomData {
  id: string;
  name: string;
  type: string;
  area: number;
  ceilingHeight: number;
  occupancy: number;
  luxTarget: number;
  fixtureLumens: number;
  uf: number; // Utilization Factor
  mf: number; // Maintenance Factor
  fixtureType: string;
  
  // Power Sockets
  workstationsCount: number;
  hasPantryEquipment: boolean;
  hasPrinter: boolean;
  dedicatedEquipment: string[];
  
  // ELV/Data
  dataOutletsCount: number;
  hasCctv: boolean;
  cctvCount: number;
  hasWifi: boolean;
  wifiCount: number;
  hasAccessControl: boolean;
  accessControlCount: number;
  hasBmsSensors: boolean;
  bmsSensorsCount: number;
  
  notes?: string;
}

export interface BOQItem {
  id: string;
  category: 'Lighting' | 'Power' | 'ELV' | 'Containment' | 'Labor & Services';
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  total: number;
  confidenceLevel: 'High' | 'Medium' | 'Low' | 'Needs Review';
  source: string;
  notes?: string;
}

export interface SitePhoto {
  id: string;
  roomName: string;
  systemType: string;
  imageUrl: string;
  timestamp: string;
  status: 'Approved' | 'Deviation Detected' | 'Pending Review';
  findings: {
    category: 'Anomaly' | 'Standard Met' | 'Minor Deviation';
    description: string;
    severity: 'Critical' | 'Moderate' | 'Info' | 'None';
    status: 'Open' | 'Resolved';
  }[];
}

export interface VariationClaim {
  id: string;
  title: string;
  description: string;
  estimatedValue: number;
  requestedBy: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  evidenceCount: number;
  date: string;
}

export interface AssetTwin {
  id: string;
  name: string;
  tag: string;
  system: string;
  location: string;
  status: 'Operational' | 'Maintenance Due' | 'Faulty';
  installationDate: string;
  warrantyExpiry: string;
  maintenanceSchedule: string;
}

// Initial case study room list
export const initialRooms: RoomData[] = [
  {
    id: 'room-1',
    name: 'Reception & Waiting Area',
    type: 'Reception',
    area: 80,
    ceilingHeight: 3.0,
    occupancy: 25,
    luxTarget: 300,
    fixtureLumens: 1800,
    uf: 0.6,
    mf: 0.8,
    fixtureType: 'LED Downlight 18W Circular',
    workstationsCount: 2,
    hasPantryEquipment: false,
    hasPrinter: true,
    dedicatedEquipment: ['Reception Console', 'Information Display Screen'],
    dataOutletsCount: 4,
    hasCctv: true,
    cctvCount: 2,
    hasWifi: true,
    wifiCount: 1,
    hasAccessControl: true,
    accessControlCount: 1,
    hasBmsSensors: true,
    bmsSensorsCount: 1,
    notes: 'Premium architectural look with acoustic wood ceiling boards. Lighting needs to align with logo features.'
  },
  {
    id: 'room-2',
    name: 'Main Open Office Area',
    type: 'Open Office',
    area: 420,
    ceilingHeight: 2.8,
    occupancy: 60,
    luxTarget: 450,
    fixtureLumens: 3200,
    uf: 0.65,
    mf: 0.8,
    fixtureType: '60x60 LED Grid Panel Recessed',
    workstationsCount: 60,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: [],
    dataOutletsCount: 120, // 2 per workstation
    hasCctv: true,
    cctvCount: 4,
    hasWifi: true,
    wifiCount: 4,
    hasAccessControl: false,
    accessControlCount: 0,
    hasBmsSensors: true,
    bmsSensorsCount: 3,
    notes: 'Large open workspace. Cable management trays running overhead. Layout must avoid glare on screens.'
  },
  {
    id: 'room-3',
    name: 'Boardroom / Meeting Room 1',
    type: 'Meeting Room',
    area: 40,
    ceilingHeight: 3.0,
    occupancy: 12,
    luxTarget: 400,
    fixtureLumens: 2800,
    uf: 0.6,
    mf: 0.8,
    fixtureType: 'Linear LED Pendant Fixture',
    workstationsCount: 0,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: ['Conference VC System', 'Projector & Motorized Screen', 'Floor Box Console'],
    dataOutletsCount: 8,
    hasCctv: true,
    cctvCount: 1,
    hasWifi: true,
    wifiCount: 1,
    hasAccessControl: true,
    accessControlCount: 1,
    hasBmsSensors: true,
    bmsSensorsCount: 1,
    notes: 'Requires lighting dimming scenes. Central floor box for AV connections.'
  },
  {
    id: 'room-4',
    name: 'Huddle Room / Meeting Room 2',
    type: 'Meeting Room',
    area: 35,
    ceilingHeight: 3.0,
    occupancy: 8,
    luxTarget: 400,
    fixtureLumens: 2800,
    uf: 0.6,
    mf: 0.8,
    fixtureType: 'Linear LED Pendant Fixture',
    workstationsCount: 0,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: ['Collaboration Screen', 'Floor Box'],
    dataOutletsCount: 6,
    hasCctv: false,
    cctvCount: 0,
    hasWifi: true,
    wifiCount: 1,
    hasAccessControl: false,
    accessControlCount: 0,
    hasBmsSensors: true,
    bmsSensorsCount: 1
  },
  {
    id: 'room-5',
    name: 'Executive Manager Office 1',
    type: 'Manager Room',
    area: 25,
    ceilingHeight: 3.0,
    occupancy: 2,
    luxTarget: 400,
    fixtureLumens: 2400,
    uf: 0.6,
    mf: 0.8,
    fixtureType: 'Dimmable Recessed LED Downlights',
    workstationsCount: 1,
    hasPantryEquipment: false,
    hasPrinter: true,
    dedicatedEquipment: ['Executive Desk Display'],
    dataOutletsCount: 4,
    hasCctv: false,
    cctvCount: 0,
    hasWifi: true,
    wifiCount: 1,
    hasAccessControl: true,
    accessControlCount: 1,
    hasBmsSensors: true,
    bmsSensorsCount: 1
  },
  {
    id: 'room-6',
    name: 'Executive Manager Office 2',
    type: 'Manager Room',
    area: 25,
    ceilingHeight: 3.0,
    occupancy: 2,
    luxTarget: 400,
    fixtureLumens: 2400,
    uf: 0.6,
    mf: 0.8,
    fixtureType: 'Dimmable Recessed LED Downlights',
    workstationsCount: 1,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: [],
    dataOutletsCount: 4,
    hasCctv: false,
    cctvCount: 0,
    hasWifi: true,
    wifiCount: 1,
    hasAccessControl: true,
    accessControlCount: 1,
    hasBmsSensors: true,
    bmsSensorsCount: 1
  },
  {
    id: 'room-7',
    name: 'Staff Pantry & Breakroom',
    type: 'Pantry',
    area: 30,
    ceilingHeight: 2.8,
    occupancy: 8,
    luxTarget: 250,
    fixtureLumens: 1500,
    uf: 0.55,
    mf: 0.8,
    fixtureType: 'Recessed LED Spotlights',
    workstationsCount: 0,
    hasPantryEquipment: true,
    hasPrinter: false,
    dedicatedEquipment: ['Refrigerator', 'Microwave Oven x2', 'Water Dispenser', 'Espresso Machine'],
    dataOutletsCount: 2,
    hasCctv: false,
    cctvCount: 0,
    hasWifi: true,
    wifiCount: 1,
    hasAccessControl: false,
    accessControlCount: 0,
    hasBmsSensors: true,
    bmsSensorsCount: 1,
    notes: 'Power outlets need to accommodate high current startup loads from multiple kitchen appliances.'
  },
  {
    id: 'room-8',
    name: 'Mission-Critical Server Room',
    type: 'Server Room',
    area: 20,
    ceilingHeight: 3.0,
    occupancy: 0,
    luxTarget: 400,
    fixtureLumens: 3200,
    uf: 0.6,
    mf: 0.8,
    fixtureType: 'Standard 60x60 LED Panel',
    workstationsCount: 0,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: ['IT Server Rack 42U x3', 'Precision A/C Unit x2', 'Online UPS System 20kVA'],
    dataOutletsCount: 24, // Fiber and copper backbone links
    hasCctv: true,
    cctvCount: 2, // 1 front of racks, 1 rear of racks
    hasWifi: false,
    wifiCount: 0,
    hasAccessControl: true,
    accessControlCount: 1, // Double verification reader (biometric + card)
    hasBmsSensors: true,
    bmsSensorsCount: 4, // Temp sensors top/mid/bottom rack, leak sensor
    notes: 'Server Room requires dedicated 30A command breakers and clean agent fire suppression integration.'
  },
  {
    id: 'room-9',
    name: 'Main Corridor & Lobbies',
    type: 'Corridor',
    area: 150,
    ceilingHeight: 2.7,
    occupancy: 0,
    luxTarget: 120,
    fixtureLumens: 1200,
    uf: 0.5,
    mf: 0.75,
    fixtureType: 'LED Downlight Circular Recessed',
    workstationsCount: 0,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: [],
    dataOutletsCount: 2,
    hasCctv: true,
    cctvCount: 4,
    hasWifi: true,
    wifiCount: 2,
    hasAccessControl: false,
    accessControlCount: 0,
    hasBmsSensors: true,
    bmsSensorsCount: 1,
    notes: 'Emergency lighting exit signs integrated with normal layout.'
  },
  {
    id: 'room-10',
    name: 'Doha Office Washrooms',
    type: 'Washroom',
    area: 55,
    ceilingHeight: 2.7,
    occupancy: 0,
    luxTarget: 150,
    fixtureLumens: 1000,
    uf: 0.5,
    mf: 0.7,
    fixtureType: 'IP44 Splashproof Circular LED Downlight',
    workstationsCount: 0,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: ['Exhaust Fan Extractors'],
    dataOutletsCount: 0,
    hasCctv: false,
    cctvCount: 0,
    hasWifi: false,
    wifiCount: 0,
    hasAccessControl: false,
    accessControlCount: 0,
    hasBmsSensors: true,
    bmsSensorsCount: 1
  },
  {
    id: 'room-11',
    name: 'Office Storage Room',
    type: 'Storage',
    area: 20,
    ceilingHeight: 2.7,
    occupancy: 0,
    luxTarget: 150,
    fixtureLumens: 1200,
    uf: 0.5,
    mf: 0.75,
    fixtureType: 'Batten LED Fixture surface-mounted',
    workstationsCount: 0,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: [],
    dataOutletsCount: 1,
    hasCctv: false,
    cctvCount: 0,
    hasWifi: false,
    wifiCount: 0,
    hasAccessControl: true,
    accessControlCount: 1,
    hasBmsSensors: false,
    bmsSensorsCount: 0
  },
  {
    id: 'room-12',
    name: 'Dedicated Prayer Room (Musalla)',
    type: 'Prayer Room',
    area: 100,
    ceilingHeight: 3.0,
    occupancy: 30,
    luxTarget: 250,
    fixtureLumens: 1800,
    uf: 0.6,
    mf: 0.8,
    fixtureType: 'Sconces + Recessed LED Warm Downlights',
    workstationsCount: 0,
    hasPantryEquipment: false,
    hasPrinter: false,
    dedicatedEquipment: [],
    dataOutletsCount: 2,
    hasCctv: false,
    cctvCount: 0,
    hasWifi: true,
    wifiCount: 1,
    hasAccessControl: false,
    accessControlCount: 0,
    hasBmsSensors: true,
    bmsSensorsCount: 1,
    notes: 'Ablution area and prayer rugs. Warm lighting to foster focus.'
  }
];

// Initial mock BOQ
export const initialBOQItems: BOQItem[] = [
  {
    id: 'boq-1',
    category: 'Lighting',
    itemCode: 'EL-LT-001',
    description: 'Recessed 600x600 mm LED Grid Panel Luminaire, 36W, 3200lm, 4000K, Ra>80, IP20 rated. Brand recommendation: Zumtobel / Philips or approved equivalent.',
    unit: 'Pcs',
    quantity: 65,
    unitRate: 180,
    total: 11700,
    confidenceLevel: 'High',
    source: 'AI Lighting Estimator',
    notes: 'Covers Open Office and Server room.'
  },
  {
    id: 'boq-2',
    category: 'Lighting',
    itemCode: 'EL-LT-002',
    description: 'Circular Recessed LED Downlight, 18W, 1800lm, 3000K, Dimmable driver. Brand: Philips Ledinaire / Erco or approved equivalent.',
    unit: 'Pcs',
    quantity: 32,
    unitRate: 95,
    total: 3040,
    confidenceLevel: 'High',
    source: 'AI Lighting Estimator',
    notes: 'For Reception, Managers, and Prayer room.'
  },
  {
    id: 'boq-3',
    category: 'Lighting',
    itemCode: 'EL-LT-003',
    description: 'IP44 Rated Circular Recessed LED Downlight, 12W, 1000lm, 4000K. Brand: Philips CoreLine.',
    unit: 'Pcs',
    quantity: 12,
    unitRate: 110,
    total: 1320,
    confidenceLevel: 'Medium',
    source: 'AI Lighting Estimator',
    notes: 'For toilet zones.'
  },
  {
    id: 'boq-4',
    category: 'Lighting',
    itemCode: 'EL-LT-EMG',
    description: 'Self-contained Emergency LED luminaire, Non-maintained, 3-hour backup battery pack, includes Exit routing legend signage.',
    unit: 'Pcs',
    quantity: 15,
    unitRate: 250,
    total: 3750,
    confidenceLevel: 'Medium',
    source: 'AI Safety Assumptions',
    notes: 'Meets Civil Defense requirements for evacuation pathway.'
  },
  {
    id: 'boq-5',
    category: 'Power',
    itemCode: 'EL-PWR-SK1',
    description: '13A Double Gang Switched Power Socket outlet, Recessed Wall mounted, BS1363 compliant. Color: Steel / White. Brand: Legrand Arteor / MK.',
    unit: 'Pcs',
    quantity: 80,
    unitRate: 65,
    total: 5200,
    confidenceLevel: 'High',
    source: 'AI Load Assessor',
    notes: '2 sockets per workstation, plus spares.'
  },
  {
    id: 'boq-6',
    category: 'Power',
    itemCode: 'EL-PWR-FB',
    description: 'Heavy duty Flush Floor Box containing 4-compartments (2x 13A Double Sockets, 2x RJ45 Data Points) with stainless steel trim cover.',
    unit: 'Pcs',
    quantity: 16,
    unitRate: 380,
    total: 6080,
    confidenceLevel: 'High',
    source: 'AI Load Assessor',
    notes: 'Assigned to Boardrooms and Huddle Rooms.'
  },
  {
    id: 'boq-7',
    category: 'Power',
    itemCode: 'EL-PWR-SP',
    description: 'Dedicated Single Phase 16A/32A Industrial Socket outlet with isolator, fed from Clean UPS DB for server rack distribution.',
    unit: 'Pcs',
    quantity: 3,
    unitRate: 420,
    total: 1260,
    confidenceLevel: 'Medium',
    source: 'AI Load Assessor',
    notes: 'Requires engineer confirmation of rack plug type.'
  },
  {
    id: 'boq-8',
    category: 'ELV',
    itemCode: 'LC-DAT-001',
    description: 'Cat6 U/UTP LSZH Copper Data Cable, 4-pair, Violet jacket, 305m drum. Brand: CommScope / Panduit or approved equivalent.',
    unit: 'Drum',
    quantity: 15,
    unitRate: 680,
    total: 10200,
    confidenceLevel: 'Medium',
    source: 'AI Cable Estimator',
    notes: 'Assumes average cable run is 65 meters.'
  },
  {
    id: 'boq-9',
    category: 'ELV',
    itemCode: 'LC-DAT-RJ45',
    description: 'Cat6 RJ45 Single/Double Outlet Faceplate with shutter and identification labels.',
    unit: 'Pcs',
    quantity: 90,
    unitRate: 45,
    total: 4050,
    confidenceLevel: 'High',
    source: 'AI ELV Assessor',
    notes: 'Workstation and printer connections.'
  },
  {
    id: 'boq-10',
    category: 'ELV',
    itemCode: 'LC-CCTV-CAM',
    description: '5MP H.265 Dome IP Network Camera, 2.8mm fixed lens, IR range 30m, PoE, WDR, Analytics enabled. Brand: Hikvision / Axis.',
    unit: 'Pcs',
    quantity: 15,
    unitRate: 550,
    total: 8250,
    confidenceLevel: 'High',
    source: 'AI Security Assessor',
    notes: 'Covers entrances, reception, open area, and servers.'
  },
  {
    id: 'boq-11',
    category: 'ELV',
    itemCode: 'LC-WIFI-AP',
    description: 'Dual-Band Wi-Fi 6 Enterprise-Grade Access Point, Ceiling mounted, MIMO 4x4. Brand: Aruba / Cisco.',
    unit: 'Pcs',
    quantity: 11,
    unitRate: 850,
    total: 9350,
    confidenceLevel: 'High',
    source: 'AI ELV Assessor',
    notes: 'Based on density layout.'
  },
  {
    id: 'boq-12',
    category: 'ELV',
    itemCode: 'LC-ACS-DR',
    description: 'Single Door Access Control Package: IP Reader, Magnetic Lock (600 lbs), Door Contact, Emergency Break-Glass glass, Exit Push Button.',
    unit: 'Set',
    quantity: 6,
    unitRate: 2800,
    total: 16800,
    confidenceLevel: 'High',
    source: 'AI ELV Assessor',
    notes: 'Assigned to server, managers, boardrooms, and storage.'
  },
  {
    id: 'boq-13',
    category: 'ELV',
    itemCode: 'LC-BMS-SNS',
    description: 'BMS Wall-mounted Temperature/Humidity Sensor, Modbus RTU/BACnet protocol, includes interface wiring.',
    unit: 'Pcs',
    quantity: 15,
    unitRate: 350,
    total: 5250,
    confidenceLevel: 'Medium',
    source: 'AI Smart Building suggestions',
    notes: 'Linked to VRF A/C system and thermostat zones.'
  },
  {
    id: 'boq-14',
    category: 'ELV',
    itemCode: 'LC-RK-42U',
    description: '42U Server Cabinet Rack, 800 x 1000 mm size, glass front door, mesh rear door, includes 2x 10-way PDU, fan kit, and cable tray managers.',
    unit: 'Pcs',
    quantity: 3,
    unitRate: 4500,
    total: 13500,
    confidenceLevel: 'High',
    source: 'AI Server Planner',
    notes: 'For Server Room.'
  },
  {
    id: 'boq-15',
    category: 'Containment',
    itemCode: 'EL-CNT-TR',
    description: 'Galvanized Steel Perforated Cable Tray, 150mm x 50mm size, 1.2mm thickness, includes joint connectors, bracket supports, and accessories.',
    unit: 'Mtr',
    quantity: 350,
    unitRate: 48,
    total: 16800,
    confidenceLevel: 'Low',
    source: 'AI Structural Assumption',
    notes: 'Requires ceiling layout coordination to finalize pathways.'
  },
  {
    id: 'boq-16',
    category: 'Labor & Services',
    itemCode: 'SV-LAB-INS',
    description: 'Testing, Commissioning, Labeling, Cable Certification reports, and Civil Defense Authority approval facilitation.',
    unit: 'Lot',
    quantity: 1,
    unitRate: 15000,
    total: 15000,
    confidenceLevel: 'Medium',
    source: 'AI Service Standards',
    notes: 'Standard engineering services package.'
  }
];

export const initialSitePhotos: SitePhoto[] = [
  {
    id: 'photo-1',
    roomName: 'Server Room',
    systemType: 'ELV / Racks',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    timestamp: '2026-05-20 14:32:00',
    status: 'Deviation Detected',
    findings: [
      {
        category: 'Anomaly',
        description: 'Server rack grounding cable is missing. Rack must be bonded to the main clean earth bar.',
        severity: 'Critical',
        status: 'Open'
      },
      {
        category: 'Minor Deviation',
        description: 'Cable bundle routing inside Rack 2 is blocking rear airflow mesh. Needs re-dressing with velcro ties.',
        severity: 'Moderate',
        status: 'Open'
      },
      {
        category: 'Standard Met',
        description: 'Access control magnetic lock installation matches design coordinates on door frame.',
        severity: 'None',
        status: 'Resolved'
      }
    ]
  },
  {
    id: 'photo-2',
    roomName: 'Open Office Area',
    systemType: 'Lighting',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    timestamp: '2026-05-21 09:15:00',
    status: 'Approved',
    findings: [
      {
        category: 'Standard Met',
        description: 'Fixture spacing matches the 2.4m grid layout. Average lux levels show 445 lux on desk surfaces.',
        severity: 'None',
        status: 'Resolved'
      },
      {
        category: 'Standard Met',
        description: 'Emergency exit signs are illuminated and correctly oriented towards corridor pathways.',
        severity: 'None',
        status: 'Resolved'
      }
    ]
  }
];

export const initialVariationClaims: VariationClaim[] = [
  {
    id: 'claim-1',
    title: 'Pantry Dedicated Circuit Modification',
    description: 'Client requested addition of two high-power microwave points and a commercial espresso machine circuit not specified in original pantry requirements. Requires routing 3x 4mm2 cables in dedicated PVC conduits from DB-1.',
    estimatedValue: 4200,
    requestedBy: 'Client Representative / Consultant Email #322',
    status: 'Approved',
    evidenceCount: 2,
    date: '2026-05-18'
  },
  {
    id: 'claim-2',
    title: 'Additional Access Control for Boardroom',
    description: 'Add access control system (card reader + electromagnetic lock) to the Boardroom entrance to enable secure client meetings. Not included in the original tender drawings.',
    estimatedValue: 3100,
    requestedBy: 'Client representative verbally requested during site walk',
    status: 'Draft',
    evidenceCount: 1,
    date: '2026-05-22'
  }
];

export const initialAssets: AssetTwin[] = [
  {
    id: 'asset-1',
    name: 'UPS Unit 20kVA Clean Power',
    tag: 'SAQR-UPS-SR01',
    system: 'Power / UPS',
    location: 'Server Room',
    status: 'Operational',
    installationDate: '2026-05-01',
    warrantyExpiry: '2029-05-01',
    maintenanceSchedule: 'Quarterly Battery Health & Bypass check'
  },
  {
    id: 'asset-2',
    name: 'Access Control Controller - 8 Door',
    tag: 'SAQR-ELV-ACC01',
    system: 'Access Control',
    location: 'Server Room IT Rack 1',
    status: 'Operational',
    installationDate: '2026-05-02',
    warrantyExpiry: '2028-05-02',
    maintenanceSchedule: 'Bi-annual Database backup and magnetic force inspection'
  },
  {
    id: 'asset-3',
    name: 'CCTV Network Video Recorder 64ch',
    tag: 'SAQR-ELV-NVR01',
    system: 'CCTV Video System',
    location: 'Server Room IT Rack 2',
    status: 'Maintenance Due',
    installationDate: '2026-05-02',
    warrantyExpiry: '2028-05-02',
    maintenanceSchedule: 'Monthly hard drive disk array status check'
  },
  {
    id: 'asset-4',
    name: 'BMS DDC Panel DDC-L1',
    tag: 'SAQR-BMS-DDC01',
    system: 'Smart Buildings / BMS',
    location: 'Electrical Cupboard Corridor',
    status: 'Operational',
    installationDate: '2026-05-03',
    warrantyExpiry: '2027-05-03',
    maintenanceSchedule: 'Annual I/O loop validation and relay test'
  }
];

export const faqList = [
  {
    question: "What is included in this scope?",
    answer: "The current project scope covers the design and supply of Lighting, Power Sockets, Data, CCTV, Wi-Fi, Access Control, and BMS sensors for a 1,000 sqm office layout in Doha. Fire Alarm systems are represented as basic placeholders."
  },
  {
    question: "What items are missing from the BOQ?",
    answer: "Based on our compliance checks, the ceiling height values for the Washrooms and Storage rooms are missing from the main upload schedule. Additionally, specific vendor fixture lumen data for linear lighting is flagged for manual review."
  },
  {
    question: "Which room has the highest power requirement?",
    answer: "The Server Room has the highest power density, requiring dedicated circuits for 3x 42U Server Racks, 2x Precision A/C units, and an Online UPS system. Total calculated load placeholder is 28.5 kW."
  },
  {
    question: "Find possible variation items.",
    answer: "We have detected 2 possible variation items: 1) Addition of high-load pantry microwave circuits (already approved for QAR 4,200), and 2) A draft claim for Boardroom access control (estimated at QAR 3,100) requested verbally by the client."
  }
];
