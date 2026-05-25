import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Activity,
  FileText,
  MessageSquare,
  Camera,
  Settings,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  FileCode,
  Globe,
  Building,
  AlertTriangle,
  TrendingUp,
  Layers,
  Lock,
  Server,
  Wifi,
  Lightbulb,
  Zap,
  ClipboardList,
  Send,
  Info,
  X,
  Upload,
  Cpu
} from 'lucide-react';
import { LandingPageComponent } from './components/LandingPage';
import { EnhancedDashboard } from './components/Dashboard';
import { EnhancedBOQPage } from './components/BOQPage';
import { PowerCableAgent } from './components/PowerCableAgent';
import { EngineeringAgentsHub } from './components/EngineeringAgentsHub';
import { LoadScheduleAgent } from './components/agents/LoadScheduleAgent';
import { EarthingAgent } from './components/agents/EarthingAgent';
import { EmergencyLightingAgent } from './components/agents/EmergencyLightingAgent';
import { TestingCommissioningAgent } from './components/agents/TestingCommissioningAgent';
import { StructuredCablingAgent } from './components/agents/StructuredCablingAgent';
import { CCTVAgent } from './components/agents/CCTVAgent';
import { WiFiAgent } from './components/agents/WiFiAgent';
import { AccessControlAgent } from './components/agents/AccessControlAgent';
import { ComplianceChecklistAgent } from './components/agents/ComplianceChecklistAgent';
import { MissingInfoAgent } from './components/agents/MissingInfoAgent';
import { SaqrLogo } from './components/brand/SaqrLogo';
import {
  AgentCard,
  AIInsightCard,
  EngineeringDefinition,
  EngineeringIntelligenceFlow,
  FacilityAssetCard,
  FormulaCard,
  ReviewDisclaimer,
  ReviewWarning,
  RoomIntelligenceCard,
  SAQRFlow,
  SiteFindingCard,
  SystemBadge
} from './components/designSystem';

import {
  initialRooms,
  initialBOQItems,
  initialSitePhotos,
  initialVariationClaims,
  initialAssets,
  faqList,
  type RoomData,
  type BOQItem,
  type SitePhoto,
  type VariationClaim,
  type AssetTwin
} from './data/mockData';

import {
  calculateLightingFixtures,
  calculateSockets,
  calculateLoadKw,
  calculateElvPoints
} from './utils/engineeringFormulas';

import {
  caseStudies,
  engineeringFormulasKnowledge,
  saqrAgents,
  type SaqrAgentDefinition
} from './data/productContent';

import { api } from './utils/api';

// Adapter mappings from backend models to frontend dashboard interfaces
function mapBackendRoomToFrontend(r: any): RoomData {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    area: Number(r.area),
    ceilingHeight: Number(r.ceilingHeight || 3.0),
    occupancy: Number(r.occupancy || 0),
    luxTarget: Number(r.luxTarget || 400),
    fixtureLumens: r.calculations?.[0]?.fixtureLumens || 3200,
    uf: r.calculations?.[0]?.utilizationFactor || 0.6,
    mf: r.calculations?.[0]?.maintenanceFactor || 0.8,
    fixtureType: r.calculations?.[0]?.fixtureType || (r.luxTarget > 350 ? '60x60 LED Panel (Premium)' : 'LED Recessed Downlight'),
    workstationsCount: r.type === 'Open Office' ? r.occupancy : Math.round(r.area / 10),
    hasPantryEquipment: r.type === 'Pantry',
    hasPrinter: r.type === 'Reception' || r.type === 'Manager Room',
    dedicatedEquipment: r.type === 'Server Room' ? ['IT Server Rack 42U x3', 'Precision A/C Unit x2', 'Online UPS System 20kVA'] : [],
    dataOutletsCount: r.dataPoints || 0,
    hasCctv: (r.cctvPoints || 0) > 0,
    cctvCount: r.cctvPoints || 0,
    hasWifi: (r.wifiPoints || 0) > 0,
    wifiCount: r.wifiPoints || 0,
    hasAccessControl: (r.accessPoints || 0) > 0,
    accessControlCount: r.accessPoints || 0,
    hasBmsSensors: (r.bmsSensors || 0) > 0,
    bmsSensorsCount: r.bmsSensors || 0,
    notes: r.notes || ''
  };
}

function mapBackendBOQToFrontend(b: any): BOQItem {
  const categoryMap: Record<string, BOQItem['category']> = {
    LIGHTING: 'Lighting',
    POWER: 'Power',
    DATA: 'ELV',
    CCTV: 'ELV',
    WIFI: 'ELV',
    ACCESS_CONTROL: 'ELV',
    BMS: 'ELV',
    CONTAINMENT: 'Containment'
  };
  const confidenceMap: Record<string, BOQItem['confidenceLevel']> = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    REVIEW_REQUIRED: 'Needs Review'
  };
  return {
    id: b.id,
    category: categoryMap[b.category] || 'Labor & Services',
    itemCode: b.itemCode,
    description: b.description,
    unit: b.unit,
    quantity: Number(b.quantity),
    unitRate: Number(b.unitRate),
    total: Number(b.total),
    confidenceLevel: confidenceMap[b.confidenceLevel] || 'Medium',
    source: b.source || 'SAQR AI Engine',
    notes: b.notes || ''
  };
}

function mapBackendPhotoToFrontend(p: any): SitePhoto {
  const status = p.findings.some((f: any) => f.severity === 'CRITICAL' && f.status === 'Open')
    ? 'Deviation Detected'
    : p.findings.some((f: any) => f.status === 'Open')
    ? 'Pending Review'
    : 'Approved';
  return {
    id: p.id,
    roomName: p.roomName || 'General',
    systemType: p.systemType || 'General',
    imageUrl: p.photoUrl.startsWith('http') ? p.photoUrl : `http://localhost:5000${p.photoUrl}`,
    timestamp: new Date(p.uploadedAt).toLocaleString(),
    status,
    findings: (p.findings || []).map((f: any) => ({
      category: f.severity === 'NONE' ? 'Standard Met' : 'Anomaly',
      description: f.description,
      severity: f.severity === 'CRITICAL' ? 'Critical' : f.severity === 'MODERATE' ? 'Moderate' : 'Info',
      status: f.status
    }))
  };
}

function mapBackendClaimToFrontend(c: any): VariationClaim {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    estimatedValue: Number(c.estimatedValue),
    requestedBy: 'SAQR AI Claim Agent',
    status: c.status as any,
    evidenceCount: 1,
    date: new Date(c.createdAt).toISOString().split('T')[0]
  };
}

function mapBackendAssetToFrontend(a: any): AssetTwin {
  return {
    id: a.id,
    name: a.name,
    tag: a.qrCode || `TAG-${a.id.substring(0, 5)}`,
    system: a.systemCategory,
    location: a.location || 'General',
    status: a.maintenanceSchedule?.[0] ? 'Maintenance Due' : 'Operational',
    installationDate: new Date(a.createdAt).toISOString().split('T')[0],
    warrantyExpiry: a.warranty 
      ? new Date(new Date(a.warranty.startDate).setMonth(new Date(a.warranty.startDate).getMonth() + a.warranty.durationMonths)).toISOString().split('T')[0]
      : 'N/A',
    maintenanceSchedule: a.maintenanceSchedule?.[0] 
      ? `${a.maintenanceSchedule[0].taskName} (${a.maintenanceSchedule[0].frequency})`
      : 'No scheduled tasks'
  };
}

function getAgentIcon(iconKey: SaqrAgentDefinition['iconKey']) {
  const iconClass = 'w-5 h-5';
  switch (iconKey) {
    case 'design':
      return <Lightbulb className={iconClass} />;
    case 'boq':
      return <FileText className={iconClass} />;
    case 'report':
      return <FileCode className={iconClass} />;
    case 'site':
      return <Camera className={iconClass} />;
    case 'claims':
      return <TrendingUp className={iconClass} />;
    case 'facility':
      return <ClipboardList className={iconClass} />;
    case 'compliance':
      return <AlertTriangle className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
}

export default function App() {
  // App routing/view state
  const [inApp, setInApp] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');
  
  // Database states
  const [rooms, setRooms] = useState<RoomData[]>(initialRooms);
  const [boqItems, setBoqItems] = useState<BOQItem[]>(initialBOQItems);
  const [sitePhotos, setSitePhotos] = useState<SitePhoto[]>(initialSitePhotos);
  const [variationClaims, setVariationClaims] = useState<VariationClaim[]>(initialVariationClaims);
  const [assets, setAssets] = useState<AssetTwin[]>(initialAssets);
  
  // Project settings
  const [projectName, setProjectName] = useState('Doha Smart Office Fit-Out');
  const [clientName, setClientName] = useState('Confidential Corporate Client');
  const [projectArea, setProjectArea] = useState(1000);
  const [projectCountry, setProjectCountry] = useState('Qatar');
  const [projectLevel, setProjectLevel] = useState<'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'MISSION_CRITICAL'>('STANDARD');
  
  // State for active selections
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-1');
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  
  // Custom formula templates (editable in Settings)
  const [settingsLaborRate, setSettingsLaborRate] = useState(120);
  const [settingsLuxStandard, setSettingsLuxStandard] = useState({
    'Open Office': 450,
    'Server Room': 400,
    'Meeting Room': 400,
    'Reception': 300,
    'Pantry': 250,
    'Corridor': 120,
    'Washroom': 150,
    'Storage': 150,
    'Prayer Room': 250
  });

  // Backend Integration States
  const [email, setEmail] = useState('demo@saqr.ai');
  const [password, setPassword] = useState('Demo123456');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const workspaceRef = useRef<HTMLElement>(null);

  const fetchProjectData = async (projId: string) => {
    try {
      setLoading(true);
      const proj = await api.projects.getById(projId);
      setProjectName(proj.name);
      setClientName(proj.client || '');
      setProjectArea(proj.areaSqm || 1000);
      setProjectCountry(proj.country || 'Qatar');
      setProjectLevel(proj.designLevel || 'STANDARD');

      const dbRooms = await api.rooms.list(projId);
      if (dbRooms && dbRooms.length > 0) {
        setRooms(dbRooms.map(mapBackendRoomToFrontend));
        setSelectedRoomId(dbRooms[0].id);
      }

      const dbBoq = await api.projects.getBOQ(projId);
      if (dbBoq && dbBoq.length > 0) {
        setBoqItems(dbBoq.map(mapBackendBOQToFrontend));
      }

      const dbPhotos = await api.projects.getPhotos(projId);
      if (dbPhotos && dbPhotos.length > 0) {
        setSitePhotos(dbPhotos.map(mapBackendPhotoToFrontend));
      }

      const dbClaims = await api.projects.getClaims(projId);
      if (dbClaims && dbClaims.length > 0) {
        setVariationClaims(dbClaims.map(mapBackendClaimToFrontend));
      }

      const dbAssets = await api.projects.getAssets(projId);
      if (dbAssets && dbAssets.length > 0) {
        setAssets(dbAssets.map(mapBackendAssetToFrontend));
      }
    } catch (err: any) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setCurrentUser(res.user);
      setAuthModalOpen(false);
      setInApp(true);
      
      const projs = await api.projects.list();
      if (projs && projs.length > 0) {
        setProjectsList(projs);
        const firstProj = projs[0];
        setActiveProjectId(firstProj.id);
        await fetchProjectData(firstProj.id);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saqr_token');
    setCurrentUser(null);
    setInApp(false);
    setActiveProjectId(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('saqr_token');
    if (token) {
      api.auth.me().then((user) => {
        setCurrentUser(user);
        setInApp(true);
        api.projects.list().then((projs) => {
          if (projs && projs.length > 0) {
            setProjectsList(projs);
            const firstProj = projs[0];
            setActiveProjectId(firstProj.id);
            fetchProjectData(firstProj.id);
          }
        });
      }).catch(() => {
        localStorage.removeItem('saqr_token');
      });
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    workspaceRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  // Calculate active totals automatically
  const totalBOQValue = useMemo(() => {
    return boqItems.reduce((acc, item) => acc + item.total, 0);
  }, [boqItems]);

  const activeProjectCount = projectsList.length || 1;
  


  // Synchronize room changes back to BOQ items when room quantities are updated!
  // To avoid circular loops, we trigger this update selectively or calculate dynamically.
  // In the MVP, we compute room totals and update the BOQ table whenever room schedule alters.
  const syncRoomsToBOQ = () => {
    let lightingQty = 0;
    let switchQty = 0;
    let doubleSocketQty = 0;
    let dataOutletQty = 0;
    let cctvQty = 0;
    let wifiQty = 0;
    let accessQty = 0;
    let bmsQty = 0;

    rooms.forEach(room => {
      // 1. Lighting calculation
      lightingQty += calculateLightingFixtures(room);
      // Switches: ~1 switch per 4 lighting points
      switchQty += Math.ceil(calculateLightingFixtures(room) / 4);
      // 2. Power socket calculation
      doubleSocketQty += Math.ceil(calculateSockets(room) / 2);
      // 3. ELV calculation
      const elv = calculateElvPoints(room);
      dataOutletQty += elv.dataOutlets;
      cctvQty += elv.cctv;
      wifiQty += elv.wifi;
      accessQty += elv.accessControl;
      bmsQty += elv.bmsSensors;
    });

    // Map new quantities to existing categories in BOQ
    setBoqItems(prev => prev.map(item => {
      let qty = item.quantity;
      if (item.itemCode === 'EL-LT-001') qty = Math.ceil(lightingQty * 0.7); // 70% panels
      if (item.itemCode === 'EL-LT-002') qty = Math.ceil(lightingQty * 0.3); // 30% downlights
      if (item.itemCode === 'EL-PWR-SK1') qty = doubleSocketQty;
      if (item.itemCode === 'LC-DAT-RJ45') qty = dataOutletQty;
      if (item.itemCode === 'LC-CCTV-CAM') qty = cctvQty;
      if (item.itemCode === 'LC-WIFI-AP') qty = wifiQty;
      if (item.itemCode === 'LC-ACS-DR') qty = accessQty;
      if (item.itemCode === 'LC-BMS-SNS') qty = bmsQty;
      
      return {
        ...item,
        quantity: qty,
        total: Math.round(qty * item.unitRate)
      };
    }));
  };

  // Sync BOQ when room count changes (offline mode only — skipped when live data loaded)
  useEffect(() => {
    if (!activeProjectId) syncRoomsToBOQ();
  }, [rooms]);

  // ── Notification state ─────────────────────────────────────────────────────
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // ── Report state ───────────────────────────────────────────────────────────
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ── Room edit handler — persists to DB ────────────────────────────────────
  const handleSaveRoom = async (roomId: string, updates: Partial<{ name: string; type: string; area: number; ceilingHeight: number; occupancy: number; luxTarget: number; notes: string }>) => {
    try {
      if (activeProjectId) {
        await api.rooms.update(roomId, updates);
        notify('success', 'Room saved to database');
      }
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...updates } : r));
    } catch (err: any) {
      notify('error', `Save failed: ${err.message}`);
    }
  };

  // ── Regenerate Design handler ─────────────────────────────────────────────
  const handleRegenerateDesign = async () => {
    if (!activeProjectId) { notify('error', 'No active project'); return; }
    setLoading(true);
    try {
      const result = await api.projects.generateDesign(activeProjectId);
      // Reload rooms from DB
      const dbRooms = await api.rooms.list(activeProjectId);
      if (dbRooms?.length) setRooms(dbRooms.map(mapBackendRoomToFrontend));
      const warnings = result.warnings ?? [];
      notify('success', `Design recalculated — ${result.roomsCount} rooms · ${warnings.length} warnings`);
    } catch (err: any) {
      notify('error', `Design generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Regenerate BOQ handler ────────────────────────────────────────────────
  const handleRegenerateBOQ = async () => {
    if (!activeProjectId) { notify('error', 'No active project'); return; }
    setLoading(true);
    try {
      const result = await api.projects.generateBOQ(activeProjectId);
      if (result.boqItems?.length) setBoqItems(result.boqItems.map(mapBackendBOQToFrontend));
      notify('success', `BOQ regenerated — ${result.itemsCount} items · QAR ${Number(result.totalAmount).toLocaleString()}`);
    } catch (err: any) {
      notify('error', `BOQ generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Generate Report handler ───────────────────────────────────────────────
  const handleGenerateReport = async () => {
    if (!activeProjectId) { notify('error', 'No active project'); return; }
    setReportLoading(true);
    try {
      const report = await api.projects.generateReport(activeProjectId);
      const parsed = typeof report.contentJson === 'string' ? JSON.parse(report.contentJson) : report.contentJson;
      setReportData(parsed ?? report);
      notify('success', 'Engineering report generated successfully');
    } catch (err: any) {
      notify('error', `Report generation failed: ${err.message}`);
    } finally {
      setReportLoading(false);
    }
  };

  // ── Project switch handler ────────────────────────────────────────────────
  const handleSwitchProject = async (projId: string) => {
    if (projId === activeProjectId) return;
    setActiveProjectId(projId);
    setReportData(null);
    await fetchProjectData(projId);
    notify('info', 'Project context switched');
  };

  return (
    <div className="app-root min-h-screen flex flex-col">
      {!inApp ? (
        /* LANDING PAGE ROUTE */
        <LandingPageComponent
          onLaunchApp={() => setAuthModalOpen(true)} 
          lang={lang} 
          setLang={setLang}
          totalBOQValue={totalBOQValue}
        />
      ) : (
        /* CORE APPLICATION WORKSPACE */
        <div className="app-shell flex-1 flex flex-col">
          {/* Header Bar */}
          <header className="app-header header-glass h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <SaqrLogo variant="full" tone="light" className="app-brand-logo" />
              <span className="hidden md:inline-block mx-3 text-white/20">|</span>
              <span className="hidden md:inline-block text-xs font-mono text-slate-400">ENGINEERING INTELLIGENCE V1.0.4</span>
            </div>

            {/* Middle Project Selection Context */}
            <div className="hidden lg:flex items-center gap-4 bg-slate-950/60 border border-white/5 rounded-full px-4 py-1.5">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-white">{projectName}</span>
              </div>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-xs text-slate-400">Area: {projectArea} sqm</span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-xs text-slate-400">{projectCountry}</span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">{projectLevel}</span>
            </div>

            {/* Right-Side Actions */}
            <div className="flex items-center gap-3">
              {/* Project Switcher */}
              {projectsList.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-500" />
                  <select
                    value={activeProjectId ?? ''}
                    onChange={(e) => handleSwitchProject(e.target.value)}
                    className="bg-slate-900/80 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:border-amber-500 outline-none cursor-pointer hover:border-amber-500/50 transition-colors"
                    title="Switch active project"
                  >
                    {projectsList.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Language Switcher */}
              <button 
                onClick={() => setLang(l => l === 'EN' ? 'AR' : 'EN')}
                className="btn-outline py-1.5 px-3 text-xs flex items-center gap-1.5 border border-white/10 hover:border-amber-500"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === 'EN' ? 'العربية' : 'English'}</span>
              </button>

              <button 
                onClick={handleLogout}
                className="btn-outline py-1.5 px-3 text-xs border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-white"
              >
                Log Out
              </button>

              {/* User profile */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold text-sm">
                  {currentUser?.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'AZ'}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-white">{currentUser?.name || 'Demo Engineer'}</p>
                  <p className="text-[10px] text-slate-400">{currentUser?.role || 'Lead MEP Designer'}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main App Grid Layout */}
          <div className="app-body flex-1 flex overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="app-sidebar sidebar-glass w-64 shrink-0 flex flex-col border-r border-white/10">
              <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
                <p className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-widest">Core Command</p>
                
                <SidebarItem 
                  icon={<Activity className="w-4 h-4" />} 
                  label="Command Center" 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')} 
                />
                
                <SidebarItem 
                  icon={<Layers className="w-4 h-4" />} 
                  label="AI Design Studio" 
                  active={activeTab === 'studio'} 
                  onClick={() => setActiveTab('studio')} 
                />

                <SidebarItem
                  icon={<Activity className="w-4 h-4" />}
                  label="SAQR AI Agents"
                  active={activeTab === 'agents'}
                  onClick={() => setActiveTab('agents')}
                />

                <p className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-4 mb-2 tracking-widest">AI Engineering Agents</p>

                <SidebarItem 
                  icon={<Cpu className="w-4 h-4" />} 
                  label="Engineering Agents Hub" 
                  active={activeTab === 'hub'} 
                  onClick={() => setActiveTab('hub')} 
                />

                <SidebarItem 
                  icon={<Zap className="w-4 h-4" />} 
                  label="Power Cable Agent" 
                  active={activeTab === 'cable'} 
                  onClick={() => setActiveTab('cable')} 
                />

                <p className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-4 mb-2 tracking-widest">Engineering Modules</p>

                <SidebarItem 
                  icon={<Lightbulb className="w-4 h-4" />} 
                  label="Lighting Assistant" 
                  active={activeTab === 'lighting'} 
                  onClick={() => setActiveTab('lighting')} 
                />

                <SidebarItem 
                  icon={<Zap className="w-4 h-4" />} 
                  label="Power & Load Assistant" 
                  active={activeTab === 'power'} 
                  onClick={() => setActiveTab('power')} 
                />

                <SidebarItem 
                  icon={<Wifi className="w-4 h-4" />} 
                  label="Data & ELV Assistant" 
                  active={activeTab === 'elv'} 
                  onClick={() => setActiveTab('elv')} 
                />

                <p className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-4 mb-2 tracking-widest">BOQ & Reporting</p>

                <SidebarItem 
                  icon={<FileText className="w-4 h-4" />} 
                  label="BOQ Generator" 
                  active={activeTab === 'boq'} 
                  onClick={() => setActiveTab('boq')} 
                  badge={`${boqItems.length}`}
                />

                <SidebarItem 
                  icon={<FileCode className="w-4 h-4" />} 
                  label="Proposal & Reports" 
                  active={activeTab === 'reports'} 
                  onClick={() => setActiveTab('reports')} 
                />

                <p className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-4 mb-2 tracking-widest">Intelligence Library</p>

                <SidebarItem
                  icon={<Info className="w-4 h-4" />}
                  label="Engineering Knowledge Base"
                  active={activeTab === 'knowledge'}
                  onClick={() => setActiveTab('knowledge')}
                />

                <SidebarItem
                  icon={<Building className="w-4 h-4" />}
                  label="Case Studies"
                  active={activeTab === 'cases'}
                  onClick={() => setActiveTab('cases')}
                />

                <p className="text-[10px] uppercase font-bold text-slate-500 px-3 pt-4 mb-2 tracking-widest">Execution & Handover</p>

                <SidebarItem 
                  icon={<MessageSquare className="w-4 h-4" />} 
                  label="AI Project Brain" 
                  active={activeTab === 'chat'} 
                  onClick={() => setActiveTab('chat')} 
                />

                <SidebarItem 
                  icon={<Camera className="w-4 h-4" />} 
                  label="Site Photo Validation" 
                  active={activeTab === 'site'} 
                  onClick={() => setActiveTab('site')} 
                  badge="Alert"
                />

                <SidebarItem 
                  icon={<TrendingUp className="w-4 h-4" />} 
                  label="Claims & Variations" 
                  active={activeTab === 'claims'} 
                  onClick={() => setActiveTab('claims')} 
                />

                <SidebarItem 
                  icon={<ClipboardList className="w-4 h-4" />} 
                  label="Facility Handover Twin" 
                  active={activeTab === 'twin'} 
                  onClick={() => setActiveTab('twin')} 
                />
              </nav>

              {/* Bottom Project Stats Panel */}
              <div className="p-4 border-t border-white/5 bg-slate-950/40 text-center">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Preliminary BOQ:</span>
                  <span className="font-bold text-amber-500">QAR {totalBOQValue.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => setWizardOpen(true)}
                  className="w-full btn-gold py-1.5 text-xs flex justify-center items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project Wizard</span>
                </button>
              </div>
            </aside>

            {/* Interactive Workspace Area */}
            <main ref={workspaceRef} className="app-main flex-1 overflow-y-auto p-6 relative">
              
              {/* Dynamic Pages */}
              {activeTab === 'dashboard' && (
                <EnhancedDashboard
                  rooms={rooms}
                  boqItems={boqItems}
                  totalBOQValue={totalBOQValue}
                  activeProjectCount={activeProjectCount}
                  projectName={projectName}
                  projectArea={projectArea}
                  projectCountry={projectCountry}
                  projectLevel={projectLevel}
                  sitePhotos={sitePhotos}
                  onNavigate={setActiveTab}
                  onNewProject={() => setWizardOpen(true)}
                  onGenerateDesign={handleRegenerateDesign}
                  onRegenerateBOQ={handleRegenerateBOQ}
                  onGenerateReport={handleGenerateReport}
                />
              )}

              {activeTab === 'studio' && (
                <DesignStudioView 
                  rooms={rooms}
                  setRooms={setRooms}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                  projectLevel={projectLevel}
                  onNavigate={setActiveTab}
                  onSaveRoom={handleSaveRoom}
                />
              )}

              {activeTab === 'agents' && (
                <AIAgentsView
                  rooms={rooms}
                  totalBOQValue={totalBOQValue}
                  sitePhotos={sitePhotos}
                  variationClaims={variationClaims}
                  assets={assets}
                  onNavigate={setActiveTab}
                  onGenerateDesign={handleRegenerateDesign}
                  onGenerateBOQ={handleRegenerateBOQ}
                  onGenerateReport={handleGenerateReport}
                />
              )}

              {activeTab === 'lighting' && (
                <LightingAssistantView 
                  rooms={rooms}
                  setRooms={setRooms}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                />
              )}

              {activeTab === 'power' && (
                <PowerAssistantView 
                  rooms={rooms}
                  setRooms={setRooms}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                />
              )}

              {activeTab === 'elv' && (
                <ElvAssistantView 
                  rooms={rooms}
                  selectedRoomId={selectedRoomId}
                  setSelectedRoomId={setSelectedRoomId}
                />
              )}

              {activeTab === 'hub' && (
                <EngineeringAgentsHub
                  onNavigate={setActiveTab}
                  projectName={projectName}
                  clientName={clientName}
                  projectArea={projectArea}
                  projectCountry={projectCountry}
                  projectLevel={projectLevel}
                  rooms={rooms}
                  totalBOQValue={totalBOQValue}
                />
              )}

              {activeTab === 'cable' && (
                <PowerCableAgent
                  projectName={projectName}
                  activeProjectId={activeProjectId}
                />
              )}

              {activeTab === 'agent-load-schedule' && (
                <LoadScheduleAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-earthing' && (
                <EarthingAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-emergency' && (
                <EmergencyLightingAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-tc' && (
                <TestingCommissioningAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-cabling' && (
                <StructuredCablingAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-cctv' && (
                <CCTVAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-wifi' && (
                <WiFiAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-access' && (
                <AccessControlAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-compliance' && (
                <ComplianceChecklistAgent onNavigate={setActiveTab} />
              )}

              {activeTab === 'agent-missing-info' && (
                <MissingInfoAgent
                  onNavigate={setActiveTab}
                  projectName={projectName}
                  rooms={rooms}
                  boqItems={boqItems}
                  sitePhotos={sitePhotos}
                  assets={assets}
                  projectCountry={projectCountry}
                  projectLevel={projectLevel}
                />
              )}

              {activeTab === 'boq' && (
                <EnhancedBOQPage
                  boqItems={boqItems}
                  setBoqItems={setBoqItems}
                  projectName={projectName}
                  clientName={clientName}
                  totalBOQValue={totalBOQValue}
                  onRegenerateBOQ={handleRegenerateBOQ}
                  isGenerating={loading}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsGeneratorView 
                  projectName={projectName}
                  clientName={clientName}
                  projectArea={projectArea}
                  projectCountry={projectCountry}
                  projectLevel={projectLevel}
                  rooms={rooms}
                  boqItems={boqItems}
                  totalBOQValue={totalBOQValue}
                  variationClaims={variationClaims}
                  sitePhotos={sitePhotos}
                  reportData={reportData}
                  reportLoading={reportLoading}
                  onGenerateReport={handleGenerateReport}
                />
              )}

              {activeTab === 'knowledge' && (
                <EngineeringKnowledgeBaseView />
              )}

              {activeTab === 'cases' && (
                <CaseStudiesView />
              )}

              {activeTab === 'chat' && (
                <ProjectBrainChatView 
                  projectId={activeProjectId}
                  projectName={projectName}
                  rooms={rooms}
                  boqItems={boqItems}
                  totalBOQValue={totalBOQValue}
                  variationClaims={variationClaims}
                />
              )}

              {activeTab === 'site' && (
                <SiteValidationView 
                  projectId={activeProjectId}
                  sitePhotos={sitePhotos}
                  setSitePhotos={setSitePhotos}
                  rooms={rooms}
                />
              )}

              {activeTab === 'claims' && (
                <ClaimsVariationView 
                  variationClaims={variationClaims}
                  setVariationClaims={setVariationClaims}
                  boqItems={boqItems}
                  totalBOQValue={totalBOQValue}
                />
              )}

              {activeTab === 'twin' && (
                <FacilityTwinView 
                  assets={assets}
                  setAssets={setAssets}
                  rooms={rooms}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  projectName={projectName}
                  setProjectName={setProjectName}
                  clientName={clientName}
                  setClientName={setClientName}
                  projectArea={projectArea}
                  setProjectArea={setProjectArea}
                  projectCountry={projectCountry}
                  setProjectCountry={setProjectCountry}
                  projectLevel={projectLevel}
                  setProjectLevel={setProjectLevel}
                  laborRate={settingsLaborRate}
                  setLaborRate={setSettingsLaborRate}
                  luxStandard={settingsLuxStandard}
                  setLuxStandard={setSettingsLuxStandard}
                />
              )}

              {/* Bottom Settings Link Overlay */}
              <div className="absolute top-6 right-6">
                <button 
                  onClick={() => setActiveTab('settings')}
                  className="btn-outline p-2 border border-white/10 bg-slate-900/60 rounded-full hover:border-amber-500"
                  title="Project Config Settings"
                >
                  <Settings className="w-4 h-4 text-slate-400 hover:text-amber-500" />
                </button>
              </div>

            </main>
          </div>

          {/* New Project Wizard Modal */}
          {wizardOpen && (
            <ProjectWizardModal 
              onClose={() => setWizardOpen(false)}
              onGenerate={(info) => {
                setProjectName(info.name);
                setClientName(info.client);
                setProjectArea(info.area);
                setProjectCountry(info.country);
                setProjectLevel(info.level);
                
                // Automatically generate rooms based on wizard selection
                let newRooms: RoomData[] = [];
                if (info.type === 'Office') {
                  newRooms = initialRooms.map(r => ({
                    ...r,
                    // apply basic area multiplier if size changes
                    area: Math.round(r.area * (info.area / 1000))
                  }));
                } else if (info.type === 'Data Room / Server Room') {
                  newRooms = [
                    {
                      id: 'room-sr',
                      name: 'Data Center Suite',
                      type: 'Server Room',
                      area: info.area,
                      ceilingHeight: 3.2,
                      occupancy: 2,
                      luxTarget: 450,
                      fixtureLumens: 3200,
                      uf: 0.65,
                      mf: 0.8,
                      fixtureType: 'Standard 60x60 LED Panel',
                      workstationsCount: 0,
                      hasPantryEquipment: false,
                      hasPrinter: false,
                      dedicatedEquipment: ['IT Server Rack 42U x10', 'In-Row Cooling unit x4', 'Central UPS 100kVA'],
                      dataOutletsCount: 128,
                      hasCctv: true,
                      cctvCount: 6,
                      hasWifi: false,
                      wifiCount: 0,
                      hasAccessControl: true,
                      accessControlCount: 2,
                      hasBmsSensors: true,
                      bmsSensorsCount: 12
                    }
                  ];
                } else {
                  // Fallback generic room
                  newRooms = [
                    {
                      id: 'room-generic',
                      name: 'General Facility Layout',
                      type: 'Open Office',
                      area: info.area,
                      ceilingHeight: 3.0,
                      occupancy: Math.round(info.area / 15),
                      luxTarget: 350,
                      fixtureLumens: 2800,
                      uf: 0.6,
                      mf: 0.8,
                      fixtureType: 'LED Fixtures',
                      workstationsCount: Math.round(info.area / 15),
                      hasPantryEquipment: false,
                      hasPrinter: false,
                      dedicatedEquipment: [],
                      dataOutletsCount: Math.round(info.area / 15) * 2,
                      hasCctv: true,
                      cctvCount: Math.ceil(info.area / 200),
                      hasWifi: true,
                      wifiCount: Math.ceil(info.area / 150),
                      hasAccessControl: true,
                      accessControlCount: 1,
                      hasBmsSensors: true,
                      bmsSensorsCount: Math.ceil(info.area / 300)
                    }
                  ];
                }
                setRooms(newRooms);
                setWizardOpen(false);
                setActiveTab('studio');
              }}
            />
          )}

          {/* Legal Safety Footer Disclaimer */}
          <footer className="bg-slate-950/90 text-center py-2 px-4 border-t border-white/5 text-[10px] text-slate-500 select-none">
            <span className="font-bold text-slate-400">PRODUCT SAFETY DISCLAIMER:</span> SAQR AI generates preliminary engineering concepts, calculations, and cost estimates. Outputs must be reviewed and certified by a registered professional engineer before construction.
          </footer>
        </div>
      )}

      {notification && (
        <div className={`notification-toast notification-${notification.type}`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* AUTH MODAL */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
          <div className="relative w-full max-w-md glass-panel border border-white/10 p-8 rounded-2xl space-y-6 text-left shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
            
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <SaqrLogo variant="full" tone="light" className="auth-logo" />
              <h3 className="text-xl font-bold text-white tracking-wide">Connect to SAQR Engineering Intelligence</h3>
              <p className="text-xs text-slate-400 font-mono">SECURE PROJECT DATA ACCESS</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400/90 leading-relaxed font-mono">
              <p className="font-bold mb-1">Demo Credentials:</p>
              <p>Email: <span className="text-white">demo@saqr.ai</span></p>
              <p>Password: <span className="text-white">Demo123456</span></p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="form-group">
                <label className="form-label text-slate-300">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/65 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" 
                  placeholder="name@company.com" 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label text-slate-300">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/65 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" 
                  placeholder="••••••••" 
                  required
                />
              </div>

              {authError && (
                <p className="text-xs text-rose-500 font-medium">{authError}</p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-cyan justify-center py-2.5 font-bold flex items-center gap-2"
              >
                {loading ? 'Decrypting credentials...' : 'Establish Secure Connection'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sidebar Navigation Item component
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}
function SidebarItem({ icon, label, active, onClick, badge }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
        active
          ? 'bg-amber-500/15 border-l-2 border-amber-500 text-white font-bold'
          : 'text-slate-400 hover:bg-slate-900 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={active ? 'text-amber-500' : 'text-slate-400'}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-extrabold ${
          badge === 'Alert' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ========================================================
   SAQR AI AGENTS VIEW
   ======================================================== */
interface AIAgentsViewProps {
  rooms: RoomData[];
  totalBOQValue: number;
  sitePhotos: SitePhoto[];
  variationClaims: VariationClaim[];
  assets: AssetTwin[];
  onNavigate: (tab: string) => void;
  onGenerateDesign: () => void;
  onGenerateBOQ: () => void;
  onGenerateReport: () => void;
}

function AIAgentsView({
  rooms,
  totalBOQValue,
  sitePhotos,
  variationClaims,
  assets,
  onNavigate,
  onGenerateDesign,
  onGenerateBOQ,
  onGenerateReport
}: AIAgentsViewProps) {
  const getLiveOutputs = (agent: SaqrAgentDefinition) => {
    switch (agent.id) {
      case 'design':
        return [`${rooms.length} rooms analyzed`, 'Lighting, power, and ELV point schedules', 'Engineering review notes'];
      case 'boq':
        return [`QAR ${totalBOQValue.toLocaleString()} estimate`, 'Editable BOQ line items', 'System cost breakdown'];
      case 'report':
        return ['Concept report available', 'Formula summary', 'Engineer disclaimer'];
      case 'site':
        return [`${sitePhotos.length || 1} photo record`, '1 finding detected', 'Engineer action list'];
      case 'claims':
        return [`${variationClaims.length} variation claim`, 'Draft claim preview', 'Evidence checklist'];
      case 'facility':
        return [`${assets.length} asset registered`, 'Warranty tracker', 'QR-ready records'];
      case 'compliance':
        return ['Engineer review required', 'Missing assumptions checklist', 'Preliminary output disclaimer'];
      default:
        return agent.outputs;
    }
  };

  const handleAgentAction = (agentId: string) => {
    if (agentId === 'design') onGenerateDesign();
    else if (agentId === 'boq') onGenerateBOQ();
    else if (agentId === 'report') onGenerateReport();
    else if (agentId === 'site') onNavigate('site');
    else if (agentId === 'claims') onNavigate('claims');
    else if (agentId === 'facility') onNavigate('twin');
    else onNavigate('studio');
  };

  return (
    <div className="ai-agents-page space-y-6 text-left">
      <header className="module-hero">
        <div>
          <span className="module-kicker">Coordinated Engineering Team</span>
          <h1><Activity size={30} /> SAQR AI Agents</h1>
          <p>
            Specialized agents convert project inputs into design schedules, BOQ intelligence, reports, site findings, claims, and facility handover records.
          </p>
        </div>
        <ReviewWarning />
      </header>

      <EngineeringIntelligenceFlow />

      <section className="agent-team-flow">
        <SAQRFlow
          steps={[
            { title: 'Design Agent', icon: <Lightbulb className="w-4 h-4" /> },
            { title: 'BOQ Agent', icon: <FileText className="w-4 h-4" /> },
            { title: 'Report Agent', icon: <FileCode className="w-4 h-4" /> },
            { title: 'Site Agent', icon: <Camera className="w-4 h-4" /> },
            { title: 'Claims Agent', icon: <TrendingUp className="w-4 h-4" /> },
            { title: 'Facility Agent', icon: <ClipboardList className="w-4 h-4" /> }
          ]}
        />
      </section>

      <section className="agent-grid">
        {saqrAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            name={agent.name}
            role={agent.purpose}
            inputData={agent.inputs}
            outputData={getLiveOutputs(agent)}
            status={agent.status}
            confidence={agent.confidence}
            nextAction={agent.nextAction}
            icon={getAgentIcon(agent.iconKey)}
            actionLabel={agent.buttonLabel}
            onAction={() => handleAgentAction(agent.id)}
          />
        ))}
      </section>

      <AIInsightCard
        title="Agent Coordination Logic"
        insights={[
          'Design Agent creates the preliminary point model from room inputs.',
          'BOQ Agent translates system points into editable commercial line items.',
          'Report, Site, Claims, Facility, and Compliance Agents reuse the same project context instead of isolated screens.',
          'Every output remains preliminary until reviewed and approved by qualified engineers.'
        ]}
        actionButton={{ label: 'Ask Project Brain', onClick: () => onNavigate('chat') }}
      />
    </div>
  );
}

/* ========================================================
   ENGINEERING KNOWLEDGE BASE VIEW
   ======================================================== */
function EngineeringKnowledgeBaseView() {
  return (
    <div className="knowledge-page space-y-6 text-left">
      <header className="module-hero">
        <div>
          <span className="module-kicker">Formulas, Definitions, Review Notes</span>
          <h1><Info size={30} /> Engineering Knowledge Base</h1>
          <p>
            The formulas below explain how SAQR AI turns room data, system assumptions, and rates into preliminary engineering intelligence.
          </p>
        </div>
        <ReviewDisclaimer />
      </header>

      <section className="knowledge-definition-grid">
        <EngineeringDefinition term="Engineering Intelligence">
          Project data enriched with calculations, assumptions, costs, warnings, and review-ready outputs.
        </EngineeringDefinition>
        <EngineeringDefinition term="Preliminary Output">
          A first-pass design or estimate that helps engineers move faster, not a certified construction document.
        </EngineeringDefinition>
        <EngineeringDefinition term="Confidence Level">
          A signal showing whether SAQR has enough reliable inputs or whether engineer review is required.
        </EngineeringDefinition>
      </section>

      <section className="formula-grid">
        {engineeringFormulasKnowledge.map((formula) => (
          <FormulaCard key={formula.id} {...formula} />
        ))}
      </section>
    </div>
  );
}

/* ========================================================
   CASE STUDIES VIEW
   ======================================================== */
function CaseStudiesView() {
  return (
    <div className="case-studies-page space-y-6 text-left">
      <header className="module-hero">
        <div>
          <span className="module-kicker">Demo Projects</span>
          <h1><Building size={30} /> SAQR AI Case Studies</h1>
          <p>
            Detailed examples showing how SAQR agents support GCC fit-out, healthcare, and data room infrastructure workflows.
          </p>
        </div>
      </header>

      <section className="case-study-grid">
        {caseStudies.map((caseStudy) => (
          <article key={caseStudy.title} className="case-study-card">
            <div className="case-study-head">
              <div>
                <span>{caseStudy.type}</span>
                <h2>{caseStudy.title}</h2>
                <p>{caseStudy.area}</p>
              </div>
              <strong>{caseStudy.businessValue}</strong>
            </div>

            <div className="case-study-systems">
              {caseStudy.systems.map((system) => <SystemBadge key={system} system={system} />)}
            </div>

            <div className="case-study-section">
              <span>Problem</span>
              <p>{caseStudy.problem}</p>
            </div>

            <div className="case-study-columns">
              <div>
                <span>SAQR Workflow</span>
                {caseStudy.workflow.map((item) => <p key={item}>{item}</p>)}
              </div>
              <div>
                <span>Outputs</span>
                {caseStudy.outputs.map((item) => <p key={item}>{item}</p>)}
              </div>
            </div>

            <div className="case-study-agents">
              <span>Agents Used</span>
              <div>
                {caseStudy.agents.map((agent) => <strong key={agent}>{agent}</strong>)}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

/* ========================================================
   AI DESIGN STUDIO VIEW
   ======================================================== */
interface DesignStudioViewProps {
  rooms: RoomData[];
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
  projectLevel: string;
  onNavigate: (tab: string) => void;
  onSaveRoom: (roomId: string, updates: Partial<{ name: string; type: string; area: number; ceilingHeight: number; occupancy: number; luxTarget: number; notes: string }>) => void;
}
function DesignStudioView({
  rooms,
  setRooms,
  selectedRoomId,
  setSelectedRoomId,
  projectLevel,
  onNavigate,
  onSaveRoom
}: DesignStudioViewProps) {
  
  const [activePlanTab, setActivePlanTab] = useState<'blueprint' | 'schedule'>('blueprint');
  const [isUploading, setIsUploading] = useState(false);
  const [fileList, setFileList] = useState<string[]>(['floorplan_doha_l1.pdf']);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const name = e.target.files[0].name;
      setTimeout(() => {
        setFileList(prev => [...prev, name]);
        setIsUploading(false);
      }, 1500);
    }
  };

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <span className="badge badge-gold">Design Agent Workspace</span>
          <h2 className="text-2xl font-bold text-white mt-1">AI Design Studio</h2>
          <p className="text-xs text-slate-400 font-serif">
            Generate preliminary MEP/ELV design intelligence from rooms, project requirements, and engineering templates.
          </p>
        </div>
        
        {/* Toggle options */}
        <div className="flex bg-slate-950 border border-white/10 rounded-lg p-0.5">
          <button 
            onClick={() => setActivePlanTab('blueprint')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              activePlanTab === 'blueprint' ? 'bg-amber-500 text-bg-darker' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blueprint Layout
          </button>
          <button 
            onClick={() => setActivePlanTab('schedule')}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              activePlanTab === 'schedule' ? 'bg-amber-500 text-bg-darker' : 'text-slate-400 hover:text-white'
            }`}
          >
            Room Schedule List
          </button>
        </div>
      </div>

      <EngineeringIntelligenceFlow compact />

      <div className="design-explanation-panel">
        <p>
          SAQR converts room data into system-level design assumptions. These outputs are preliminary and require engineer validation.
        </p>
        <ReviewWarning />
      </div>

      <section className="design-studio-section-grid">
        {[
          ['Room Intelligence', `${rooms.length} rooms with area, occupancy, ceiling height, and system intent.`],
          ['System Point Schedule', 'Lighting, socket, data, CCTV, Wi-Fi, access control, and BMS counts are calculated per room.'],
          ['Engineering Assumptions', `${projectLevel} design level, fixture lumens, utilization factors, maintenance factors, and demand logic.`],
          ['Calculation Warnings', 'Missing inputs, default values, and review notes are flagged before BOQ generation.'],
          ['Next Recommended Actions', 'Generate BOQ from current design, compile report, validate site photos, and build facility records.']
        ].map(([title, desc]) => (
          <article key={title}>
            <strong>{title}</strong>
            <p>{desc}</p>
          </article>
        ))}
      </section>

      <section className="room-intelligence-grid">
        {rooms.slice(0, 4).map((room) => {
          const elv = calculateElvPoints(room);
          return (
            <RoomIntelligenceCard
              key={room.id}
              name={room.name}
              type={room.type}
              area={room.area}
              systems={[
                { name: 'Lighting', count: calculateLightingFixtures(room), confidence: 'High' },
                { name: 'Power', count: calculateSockets(room), confidence: 'High' },
                { name: 'Data', count: elv.dataOutlets, confidence: 'Medium' },
                { name: 'CCTV', count: elv.cctv, confidence: 'Medium' },
                { name: 'Wi-Fi', count: elv.wifi, confidence: 'Needs Review' },
                { name: 'Access Control', count: elv.accessControl, confidence: 'Medium' },
                { name: 'BMS', count: elv.bmsSensors, confidence: 'Medium' }
              ]}
              confidence={elv.wifi > 0 ? 'Needs Review' : 'High'}
              hasWarning={elv.wifi > 0 || !room.ceilingHeight}
              onClick={() => setSelectedRoomId(room.id)}
            />
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Layout Visualizer or Schedule Grid */}
        <div className="lg:col-span-8 space-y-4">
          
          {activePlanTab === 'blueprint' ? (
            <div className="glass-panel p-5 relative overflow-hidden bg-slate-950/60 border border-white/10 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-ai-orb"></span>
                  SPATIAL VECTOR COORDINATES DETECTION ACTIVE
                </span>
                <span className="text-[9px] text-slate-500 font-mono">1,000 sqm GRID</span>
              </div>

              {/* Vector representation of Doha layout */}
              <div className="aspect-[16/9] border border-white/10 rounded-lg relative overflow-hidden bg-slate-950 flex items-center justify-center blueprint-layout">
                {/* SVG representing the Doha office floor plan */}
                <svg className="w-full h-full p-4" viewBox="0 0 800 450">
                  {/* Grid background */}
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Spaces drawings */}
                  <g className="cursor-pointer">
                    {/* Reception */}
                    <rect 
                      x="40" y="40" width="160" height="120" 
                      fill={selectedRoomId === 'room-1' ? 'rgba(214, 168, 79, 0.15)' : 'rgba(11, 30, 51, 0.4)'} 
                      stroke={selectedRoomId === 'room-1' ? '#D6A84F' : 'rgba(255,255,255,0.2)'} 
                      strokeWidth={selectedRoomId === 'room-1' ? '2' : '1'}
                      onClick={() => setSelectedRoomId('room-1')}
                    />
                    <text x="50" y="70" fill="#FFF" fontSize="10" fontWeight="bold">Reception (80m²)</text>
                    <text x="50" y="90" fill="#22D3EE" fontSize="8">Lighting: {calculateLightingFixtures(rooms[0])} Downlights</text>

                    {/* Open Office */}
                    <rect 
                      x="220" y="40" width="340" height="260" 
                      fill={selectedRoomId === 'room-2' ? 'rgba(214, 168, 79, 0.15)' : 'rgba(11, 30, 51, 0.4)'} 
                      stroke={selectedRoomId === 'room-2' ? '#D6A84F' : 'rgba(255,255,255,0.2)'} 
                      strokeWidth={selectedRoomId === 'room-2' ? '2' : '1'}
                      onClick={() => setSelectedRoomId('room-2')}
                    />
                    <text x="230" y="70" fill="#FFF" fontSize="11" fontWeight="bold">Open Workspace (420m²)</text>
                    <text x="230" y="90" fill="#22D3EE" fontSize="9">Lighting: {calculateLightingFixtures(rooms[1])} LED Panels</text>
                    <text x="230" y="110" fill="#D6A84F" fontSize="9">Power: {calculateSockets(rooms[1])} Sockets</text>

                    {/* Server Room */}
                    <rect 
                      x="40" y="180" width="160" height="120" 
                      fill={selectedRoomId === 'room-8' ? 'rgba(214, 168, 79, 0.15)' : 'rgba(11, 30, 51, 0.4)'} 
                      stroke={selectedRoomId === 'room-8' ? '#D6A84F' : 'rgba(255,255,255,0.2)'} 
                      strokeWidth={selectedRoomId === 'room-8' ? '2' : '1'}
                      onClick={() => setSelectedRoomId('room-8')}
                    />
                    <text x="50" y="210" fill="#EF4444" fontSize="10" fontWeight="bold">Server Room (20m²)</text>
                    <text x="50" y="230" fill="#22D3EE" fontSize="8">UPS + Critical Load</text>

                    {/* Boardroom */}
                    <rect 
                      x="580" y="40" width="180" height="120" 
                      fill={selectedRoomId === 'room-3' ? 'rgba(214, 168, 79, 0.15)' : 'rgba(11, 30, 51, 0.4)'} 
                      stroke={selectedRoomId === 'room-3' ? '#D6A84F' : 'rgba(255,255,255,0.2)'} 
                      strokeWidth={selectedRoomId === 'room-3' ? '2' : '1'}
                      onClick={() => setSelectedRoomId('room-3')}
                    />
                    <text x="590" y="70" fill="#FFF" fontSize="10" fontWeight="bold">Boardroom (40m²)</text>
                    <text x="590" y="90" fill="#22D3EE" fontSize="8">AV & Access readers</text>

                    {/* Prayer Room */}
                    <rect 
                      x="580" y="180" width="180" height="120" 
                      fill={selectedRoomId === 'room-12' ? 'rgba(214, 168, 79, 0.15)' : 'rgba(11, 30, 51, 0.4)'} 
                      stroke={selectedRoomId === 'room-12' ? '#D6A84F' : 'rgba(255,255,255,0.2)'} 
                      strokeWidth={selectedRoomId === 'room-12' ? '2' : '1'}
                      onClick={() => setSelectedRoomId('room-12')}
                    />
                    <text x="590" y="210" fill="#FFF" fontSize="10" fontWeight="bold">Prayer Room (100m²)</text>
                    
                    {/* Corridor */}
                    <rect 
                      x="40" y="320" width="720" height="90" 
                      fill={selectedRoomId === 'room-9' ? 'rgba(214, 168, 79, 0.15)' : 'rgba(11, 30, 51, 0.4)'} 
                      stroke={selectedRoomId === 'room-9' ? '#D6A84F' : 'rgba(255,255,255,0.2)'} 
                      strokeWidth={selectedRoomId === 'room-9' ? '2' : '1'}
                      onClick={() => setSelectedRoomId('room-9')}
                    />
                    <text x="50" y="350" fill="#FFF" fontSize="10" fontWeight="bold">Corridor & Lobbies (150m²)</text>
                  </g>
                </svg>

                {/* Compass HUD */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 p-2 rounded border border-white/5 flex gap-2 items-center text-[10px] font-mono text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Doha Orientation: North 12° E</span>
                </div>
              </div>
            </div>
          ) : (
            // Room Schedule List View
            <div className="table-container">
              <table className="eng-table">
                <thead>
                  <tr>
                    <th>Room Name</th>
                    <th>Type</th>
                    <th>Area (sqm)</th>
                    <th>Ceiling (m)</th>
                    <th>Lux Limit</th>
                    <th>Lights</th>
                    <th>Sockets</th>
                    <th>Data</th>
                    <th>CCTV</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => (
                    <tr 
                      key={room.id}
                      className={`cursor-pointer ${selectedRoomId === room.id ? 'bg-amber-500/10' : ''}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <td className="font-semibold text-white">{room.name}</td>
                      <td>
                        <span className="badge badge-cyan">{room.type}</span>
                      </td>
                      <td>{room.area}</td>
                      <td>{room.ceilingHeight}</td>
                      <td>{room.luxTarget} lx</td>
                      <td className="font-mono">{calculateLightingFixtures(room)}</td>
                      <td className="font-mono">{calculateSockets(room)}</td>
                      <td className="font-mono">{calculateElvPoints(room).dataOutlets}</td>
                      <td className="font-mono">{calculateElvPoints(room).cctv}</td>
                      <td>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setRooms(prev => prev.filter(r => r.id !== room.id));
                          }}
                          className="p-1 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-slate-950/20 text-right">
                <button 
                  onClick={() => {
                    const nextId = `room-${rooms.length + 1}`;
                    const newRoom: RoomData = {
                      id: nextId,
                      name: `New Room Space ${rooms.length + 1}`,
                      type: 'Open Office',
                      area: 50,
                      ceilingHeight: 3.0,
                      occupancy: 4,
                      luxTarget: 400,
                      fixtureLumens: 2800,
                      uf: 0.6,
                      mf: 0.8,
                      fixtureType: '60x60 LED Panel',
                      workstationsCount: 4,
                      hasPantryEquipment: false,
                      hasPrinter: false,
                      dedicatedEquipment: [],
                      dataOutletsCount: 8,
                      hasCctv: false,
                      cctvCount: 0,
                      hasWifi: true,
                      wifiCount: 1,
                      hasAccessControl: false,
                      accessControlCount: 0,
                      hasBmsSensors: true,
                      bmsSensorsCount: 1
                    };
                    setRooms(prev => [...prev, newRoom]);
                    setSelectedRoomId(nextId);
                  }}
                  className="btn-cyan py-1 px-3 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Add Custom Room
                </button>
              </div>
            </div>
          )}

          {/* Upload and Document Parsing Area */}
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Document Knowledge Base (PDF, DWG, Image)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Dropzone */}
              <div className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-950/40 relative hover:border-cyan-500/50 transition-all">
                <input 
                  type="file" 
                  accept=".pdf,.jpg,.png,.dwg" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleUpload}
                />
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-white">Drag & drop plan here</p>
                <p className="text-[10px] text-slate-500 mt-1">Supports PDF, PNG, JPEG up to 25MB</p>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-400">Processed Files:</p>
                {fileList.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded bg-slate-900 border border-white/5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-white font-mono">{file}</span>
                    </div>
                    <span className="badge badge-success text-[8px] py-0 px-1">Processed</span>
                  </div>
                ))}
                {isUploading && (
                  <div className="flex items-center gap-2 p-2.5 rounded bg-cyan-950/20 border border-cyan-800/30 text-cyan-400">
                    <RefreshCw className="w-3 h-3 spin-slow" />
                    <span>Uploading plan and extracting room data...</span>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* Right Side: Selected Room Configuration Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 space-y-4 border border-white/10">
            <div className="border-b border-white/5 pb-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">Selected Space Details</span>
              <h3 className="text-lg font-bold text-white mt-0.5">{selectedRoom.name}</h3>
              <span className="badge badge-cyan mt-1">{selectedRoom.type}</span>
            </div>

            {/* Config Form fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Area (sqm)</label>
                  <input 
                    type="number" 
                    value={selectedRoom.area}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, area: val } : r));
                    }}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ceiling Height (m)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={selectedRoom.ceilingHeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, ceilingHeight: val } : r));
                    }}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lux target (lx)</label>
                <input 
                  type="number" 
                  value={selectedRoom.luxTarget}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, luxTarget: val } : r));
                  }}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Workstations</label>
                <input 
                  type="number" 
                  value={selectedRoom.workstationsCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, workstationsCount: val } : r));
                  }}
                  className="form-input"
                />
              </div>

              {/* Special options */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={selectedRoom.hasPantryEquipment}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, hasPantryEquipment: val } : r));
                    }}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span>Has Pantry Appliances (High Load)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={selectedRoom.hasPrinter}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, hasPrinter: val } : r));
                    }}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <span>Dedicated Heavy Printer/Copier Outlet</span>
                </label>
              </div>

              {/* Estimated values outputs inside sidebar panel */}
              <div className="p-4 rounded-lg bg-slate-950 border border-white/5 space-y-2.5">
                <p className="font-bold text-slate-400 border-b border-white/5 pb-1">AI Calculated Points:</p>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Lighting:</span>
                  <span className="font-mono text-white font-bold">{calculateLightingFixtures(selectedRoom)} pcs</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-cyan-400" /> Sockets:</span>
                  <span className="font-mono text-white font-bold">{calculateSockets(selectedRoom)} points</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5 text-amber-500" /> Wi-Fi APs:</span>
                  <span className="font-mono text-white font-bold">{calculateElvPoints(selectedRoom).wifi} APs</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-cyan-400" /> CCTV Cameras:</span>
                  <span className="font-mono text-white font-bold">{calculateElvPoints(selectedRoom).cctv} Dome</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-amber-500" /> Access Control:</span>
                  <span className="font-mono text-white font-bold">{calculateElvPoints(selectedRoom).accessControl} Doors</span>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-1.5">
                  <span className="font-bold">Estimated Power Load:</span>
                  <span className="font-mono text-amber-500 font-bold">{calculateLoadKw(selectedRoom)} kW</span>
                </div>
              </div>

              {selectedRoom.notes && (
                <div className="p-3 bg-slate-900 border border-white/5 rounded">
                  <p className="font-bold text-slate-400 text-[10px]">COORDINATION NOTES:</p>
                  <p className="text-[11px] text-slate-300 italic font-serif leading-relaxed mt-1">{selectedRoom.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => onNavigate('lighting')}
                  className="w-1/2 btn-outline text-center justify-center text-[10px] py-2 px-2"
                >
                  View Formula Explanation
                </button>
                <button 
                  onClick={() => onNavigate('boq')}
                  className="w-1/2 btn-gold text-center justify-center text-[10px] py-2 px-2"
                >
                  Generate BOQ from Current Design
                </button>
              </div>

              <button
                onClick={() => onSaveRoom(selectedRoom.id, {
                  name: selectedRoom.name,
                  type: selectedRoom.type,
                  area: selectedRoom.area,
                  ceilingHeight: selectedRoom.ceilingHeight,
                  occupancy: selectedRoom.occupancy,
                  luxTarget: selectedRoom.luxTarget,
                  notes: selectedRoom.notes
                })}
                className="w-full btn-cyan text-center justify-center text-[10px] py-2 px-2"
              >
                Review Engineering Assumptions
              </button>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   LIGHTING DESIGN ASSISTANT VIEW
   ======================================================== */
interface LightingAssistantViewProps {
  rooms: RoomData[];
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
}
function LightingAssistantView({
  rooms,
  setRooms,
  selectedRoomId,
  setSelectedRoomId
}: LightingAssistantViewProps) {
  
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const calculatedFixtures = useMemo(() => {
    return calculateLightingFixtures(selectedRoom);
  }, [selectedRoom]);

  // Adjust parameters
  const updateRoomVal = (key: keyof RoomData, val: any) => {
    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, [key]: val } : r));
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <span className="badge badge-gold">Calculation Wizard</span>
        <h2 className="text-2xl font-bold text-white mt-1">Lumen Method Lighting Assistant</h2>
        <p className="text-xs text-slate-400 font-serif">Calculate light fixtures needed for room illumination levels using the standard lumen formula.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Room Selector & Config inputs */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4">
          <div className="form-group">
            <label className="form-label">Select Space to Calculate</label>
            <select 
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="form-select text-xs"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.area} sqm)</option>
              ))}
            </select>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Target Lux (lx)</label>
                <input 
                  type="number"
                  value={selectedRoom.luxTarget}
                  onChange={(e) => updateRoomVal('luxTarget', parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fixture Lumens (lm)</label>
                <input 
                  type="number"
                  value={selectedRoom.fixtureLumens}
                  onChange={(e) => updateRoomVal('fixtureLumens', parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Utilization Factor (UF)</label>
                <input 
                  type="number"
                  step="0.05"
                  value={selectedRoom.uf}
                  onChange={(e) => updateRoomVal('uf', parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maintenance Factor (MF)</label>
                <input 
                  type="number"
                  step="0.05"
                  value={selectedRoom.mf}
                  onChange={(e) => updateRoomVal('mf', parseFloat(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fixture type descriptor</label>
              <input 
                type="text"
                value={selectedRoom.fixtureType}
                onChange={(e) => updateRoomVal('fixtureType', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Math Formulas and spacing details */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 bg-slate-950/60 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Formula Baseline</h3>
            
            {/* Formula Block */}
            <div className="p-4 rounded-lg bg-slate-950 border border-white/5 text-center font-mono">
              <p className="text-[10px] text-slate-500 mb-1.5">LUMEN METHOD FORMULA</p>
              <p className="text-base text-white">N = (E × A) / (Φ × UF × MF)</p>
              <p className="text-[10px] text-slate-400 mt-2">
                N = Fixtures Qty • E = Lux Target ({selectedRoom.luxTarget} lx) • A = Area ({selectedRoom.area} m²) <br />
                Φ = Lumens ({selectedRoom.fixtureLumens} lm) • UF = {selectedRoom.uf} • MF = {selectedRoom.mf}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded bg-slate-900 border border-white/5 text-left">
                <p className="text-[10px] text-slate-500 uppercase">CALCULATED FIXTURES</p>
                <p className="text-3xl font-extrabold text-cyan-400 mt-1">{calculatedFixtures} <span className="text-xs font-normal text-slate-400">units</span></p>
              </div>

              <div className="p-4 rounded bg-slate-900 border border-white/5 text-left">
                <p className="text-[10px] text-slate-500 uppercase">SPACING GUIDELINE</p>
                <p className="text-sm font-bold text-white mt-1">
                  Grid Layout: ~{Math.ceil(Math.sqrt(calculatedFixtures))} × {Math.ceil(calculatedFixtures / Math.ceil(Math.sqrt(calculatedFixtures)))}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Recommended Spacing: ~2.4m center-to-center.</p>
              </div>
            </div>

            {/* Consultant safety note */}
            <div className="p-3.5 bg-amber-500/10 border-l-4 border-amber-500 rounded-r text-xs text-left">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500" />
                Preliminary Calculation Disclaimer
              </p>
              <p className="text-slate-300 font-serif leading-relaxed mt-1">
                Lumen calculations are approximate for uniform spacing. Actual layout requires DIALux / Relux simulation models to coordinate ceiling obstructions, pendant lengths, furniture shadow casting, and specific photometric light distributions.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   POWER & SOCKET ASSISTANT VIEW
   ======================================================== */
interface PowerAssistantViewProps {
  rooms: RoomData[];
  setRooms: React.Dispatch<React.SetStateAction<RoomData[]>>;
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
}
function PowerAssistantView({
  rooms,
  setRooms,
  selectedRoomId,
  setSelectedRoomId
}: PowerAssistantViewProps) {
  
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const socketCount = useMemo(() => {
    return calculateSockets(selectedRoom);
  }, [selectedRoom]);

  const loadKw = useMemo(() => {
    return calculateLoadKw(selectedRoom);
  }, [selectedRoom]);

  const updateRoomVal = (key: keyof RoomData, val: any) => {
    setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, [key]: val } : r));
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <span className="badge badge-gold">Power Estimator</span>
        <h2 className="text-2xl font-bold text-white mt-1">Power Sockets & Circuit Load Assessor</h2>
        <p className="text-xs text-slate-400 font-serif">Establish electrical points coordinates, dedicated appliances loads, and distribution board circuit arrangements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Details */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4">
          <div className="form-group">
            <label className="form-label">Select Space</label>
            <select 
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="form-select text-xs"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.area} sqm)</option>
              ))}
            </select>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4 text-xs">
            <div className="form-group">
              <label className="form-label">Workstation Count</label>
              <input 
                type="number"
                value={selectedRoom.workstationsCount}
                onChange={(e) => updateRoomVal('workstationsCount', parseInt(e.target.value) || 0)}
                className="form-input"
              />
            </div>

            <div className="space-y-3 pt-2">
              <p className="font-bold text-slate-400 text-[10px] uppercase">Special Power Configurations</p>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedRoom.hasPantryEquipment}
                  onChange={(e) => updateRoomVal('hasPantryEquipment', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <span>pantry appliances load spur (Microwave, Fridge, Coffee)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={selectedRoom.hasPrinter}
                  onChange={(e) => updateRoomVal('hasPrinter', e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500"
                />
                <span>Heavy Duty Printer/Copier dedicated circuit</span>
              </label>
            </div>
          </div>
        </div>

        {/* Sockets Results and DB load assumptions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Estimated Load telemetry</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded bg-slate-950 border border-white/5 text-left">
                <p className="text-[10px] text-slate-500 uppercase">REQUIRED SOCKET POINTS</p>
                <p className="text-2xl font-black text-cyan-400 mt-1">{socketCount} <span className="text-xs font-normal text-slate-400">pins</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Equivalent to {Math.ceil(socketCount / 2)} double gang sockets.</p>
              </div>

              <div className="p-4 rounded bg-slate-950 border border-white/5 text-left">
                <p className="text-[10px] text-slate-500 uppercase">PRELIMINARY CONNECTED LOAD</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{loadKw} <span className="text-xs font-normal text-slate-400">kW</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Requires ~{Math.ceil(loadKw / 3.5)} ring/radial loops.</p>
              </div>
            </div>

            {/* Circuit Grouping Suggestion */}
            <div className="p-4 rounded bg-slate-900/60 border border-white/5 space-y-3">
              <p className="font-bold text-slate-300 text-xs">Distribution Board (DB) Scheduling baseline</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Circuit 1 (Ring):</span>
                  <span className="text-white font-mono">Workstations sockets (Max 12 outlets per loop)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Circuit 2 (Radial):</span>
                  <span className="text-white font-mono">A/C fan coil power points</span>
                </div>
                {selectedRoom.hasPantryEquipment && (
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Circuit 3 (Radial):</span>
                    <span className="text-amber-500 font-mono">Pantry high-current spur isolator (4mm2 cable)</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   DATA & ELV DESIGN ASSISTANT VIEW
   ======================================================== */
interface ElvAssistantViewProps {
  rooms: RoomData[];
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
}
function ElvAssistantView({
  rooms,
  selectedRoomId,
  setSelectedRoomId
}: ElvAssistantViewProps) {
  
  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const elvPoints = useMemo(() => {
    return calculateElvPoints(selectedRoom);
  }, [selectedRoom]);

  return (
    <div className="space-y-6 text-left">
      <div>
        <span className="badge badge-gold">Low Current (ELV)</span>
        <h2 className="text-2xl font-bold text-white mt-1">Data & ELV Network Infrastructure Assistant</h2>
        <p className="text-xs text-slate-400 font-serif">Map network data points, CCTV surveillance coverage, corporate access control readers, and BMS temperature links.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left config */}
        <div className="lg:col-span-5 glass-panel p-5 space-y-4">
          <div className="form-group">
            <label className="form-label">Select Space</label>
            <select 
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="form-select text-xs"
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.area} sqm)</option>
              ))}
            </select>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3.5 text-xs text-slate-400">
            <p className="font-bold text-white uppercase tracking-wider text-[10px]">ELV Systems Checklist</p>
            
            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-white/5">
              <span>Structured Cabling RJ45</span>
              <span className="font-bold text-white">{elvPoints.dataOutlets} Ports</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-white/5">
              <span>CCTV IP Dome Cameras</span>
              <span className="font-bold text-white">{elvPoints.cctv} Units</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-white/5">
              <span>Wi-Fi Enterprise APs</span>
              <span className="font-bold text-white">{elvPoints.wifi} APs</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-white/5">
              <span>Access Control secure doors</span>
              <span className="font-bold text-white">{elvPoints.accessControl} Readers</span>
            </div>
          </div>
        </div>

        {/* Right Details Architecture */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">ELV Core Architecture Concept</h3>
            
            {/* Visual Architecture flowchart */}
            <div className="p-4 rounded-lg bg-slate-950 border border-white/5 space-y-3 text-xs">
              <p className="font-bold text-cyan-400 text-[10px]">PATCH PANEL & CABINET ALLOCATION</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white">
                  <Server className="w-3.5 h-3.5 text-amber-500" />
                  <span>Main Comms IT Rack: requires 2x 24-Port Cat6 Patch Panels.</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AP connectivity: POE+ Switch ports (average load 15.4W per AP).</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Door controllers: 12V DC power supply backup integration.</span>
                </div>
              </div>
            </div>

            {/* Qatar CCTV SSD Regulatory note */}
            <div className="p-3.5 bg-cyan-950/20 border-l-4 border-cyan-400 rounded-r text-xs">
              <p className="font-bold text-white">Security Systems Authority (SSD) Doha requirements</p>
              <p className="text-slate-300 font-serif leading-relaxed mt-1">
                In Qatar, office lobbies, corridors, and rack rooms require continuous 24/7 CCTV recording with a minimum retention period of 120 days. Ensure IP cameras meet SSD standards and are backed by separate storage disk arrays.
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   REPORTS & PROPOSAL GENERATOR VIEW
   ======================================================== */
interface ReportsGeneratorViewProps {
  projectName: string;
  clientName: string;
  projectArea: number;
  projectCountry: string;
  projectLevel: string;
  rooms: RoomData[];
  boqItems: BOQItem[];
  totalBOQValue: number;
  variationClaims: VariationClaim[];
  sitePhotos: SitePhoto[];
  reportData: any;
  reportLoading: boolean;
  onGenerateReport: () => void;
}
function ReportsGeneratorView({
  projectName,
  clientName,
  projectArea,
  projectCountry,
  projectLevel,
  rooms,
  boqItems,
  totalBOQValue,
  variationClaims,
  sitePhotos,
  reportData,
  reportLoading,
  onGenerateReport
}: ReportsGeneratorViewProps) {
  
  const [selectedReportType, setSelectedReportType] = useState<string>('concept');
  const [reportTitle, setReportTitle] = useState('Concept Design & BOQ Report');

  const todayStr = '2026-05-22';

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div>
          <span className="badge badge-gold">Report Agent</span>
          <h2 className="text-2xl font-bold text-white mt-1">Engineering Report Generator</h2>
          <p className="text-xs text-slate-400 font-serif">
            Generate professional engineering reports with formulas, agent contributions, assumptions, warnings, and preliminary-output disclaimers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onGenerateReport}
            disabled={reportLoading}
            className="btn-gold text-xs py-2 px-4"
          >
            {reportLoading ? <RefreshCw className="w-3.5 h-3.5 spin-slow" /> : <Download className="w-3.5 h-3.5" />}
            <span>{reportLoading ? 'Generating Project Report...' : 'Generate Project Report'}</span>
          </button>
        </div>
      </div>

      <section className="report-explainer-grid">
        {[
          ['What this report includes', 'Executive summary, project overview, room schedule, formula summary, BOQ summary, warnings, and engineer disclaimer.'],
          ['Which agents contributed', 'Design Agent, BOQ Agent, Report Agent, Compliance Agent, Site Validation Agent, and Claims Agent.'],
          ['Which formulas were used', 'Lighting fixture estimate, socket count, data outlet estimate, Wi-Fi AP estimate, CCTV rule checks, and BOQ total.'],
          ['Which assumptions need review', 'Fixture lumen values, utilization factors, maintenance factors, demand factors, rates, and missing site constraints.'],
          ['Which outputs are preliminary', 'All generated designs, quantities, costs, claims, findings, and reports require qualified engineer approval.']
        ].map(([title, desc]) => (
          <article key={title}>
            <strong>{title}</strong>
            <p>{desc}</p>
          </article>
        ))}
      </section>

      <ReviewDisclaimer />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <p className="font-bold text-slate-400 text-[10px] uppercase">Select Report Format</p>
            
            <div className="space-y-2">
              <ReportTypeButton 
                title="MEP / ELV Concept Design"
                desc="Calculations, spacing targets, and system layout notes."
                active={selectedReportType === 'concept'}
                onClick={() => {
                  setSelectedReportType('concept');
                  setReportTitle('Bilingual Engineering Concept Narrative');
                }}
              />
              <ReportTypeButton 
                title="Tender BOQ Summary"
                desc="Item list, pricing index, and confidence score log."
                active={selectedReportType === 'boq'}
                onClick={() => {
                  setSelectedReportType('boq');
                  setReportTitle('Tender Bill of Quantities Sheet');
                }}
              />
              <ReportTypeButton 
                title="Site QA & Inspection Find"
                desc="Visible discrepancy records and camera checks."
                active={selectedReportType === 'qa'}
                onClick={() => {
                  setSelectedReportType('qa');
                  setReportTitle('Site Validation & Installation QA Audit');
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Paper sheet preview */}
        <div className="lg:col-span-8 bg-slate-900 border border-white/10 p-8 rounded-lg font-serif text-slate-300 relative shadow-2xl space-y-6">
          <div className="absolute top-4 right-4 text-[9px] font-mono text-cyan-400 border border-cyan-800/30 px-2 py-0.5 bg-cyan-950/20 rounded">
            SAQR REPORT ENGINE PREVIEW
          </div>

          {reportData && (
            <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded text-[11px] font-sans text-cyan-100">
              Live report content received from SAQR Engine. Preview below remains editable for project formatting.
            </div>
          )}

          {/* Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-amber-500/20 pb-4">
            <div>
              <p className="font-sans font-black text-white text-base tracking-widest">SAQR AI SOLUTIONS</p>
              <p className="font-sans text-[9px] text-slate-400">Doha, Qatar • GCC Infrastructure brain</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white">Date: {todayStr}</p>
              <p className="text-[10px] text-slate-400">Report Ref: SAQR/QAR/{selectedReportType.toUpperCase()}/002</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-xl font-bold text-white border-b border-white/5 pb-1 font-serif text-center">{reportTitle}</h3>
            <p className="text-xs text-center text-slate-400">Project Context: {projectName} for {clientName}</p>
          </div>

          <div className="report-preview-outline">
            {['Executive Summary', 'Project Overview', 'Room Schedule', 'Formula Summary', 'Design Assumptions', 'BOQ Summary', 'Warnings', 'Engineer Disclaimer'].map((section) => (
              <span key={section}>{section}</span>
            ))}
          </div>

          {/* Conditional Preview Content */}
          {selectedReportType === 'concept' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div>
                <p className="font-bold text-white">1. Executive Design Narrative</p>
                <p className="mt-1 font-serif text-justify">
                  SAQR AI was commissioned to compile a preliminary concept design schedule for the proposed {projectArea} sqm office floor space in {projectCountry}. Design criteria complies with local regulations, wiring guidelines and fire protection baselines.
                  The design tier parameter is configured to: <span className="font-bold text-cyan-400">{projectLevel}</span>.
                </p>
              </div>

              <div>
                <p className="font-bold text-white">2. Spatial Schedule Assumptions</p>
                <div className="mt-1.5 border border-white/10 rounded overflow-hidden">
                  <div className="grid grid-cols-4 bg-slate-950 p-2 font-sans font-bold text-slate-400 text-[10px]">
                    <span>Space</span>
                    <span>Area (sqm)</span>
                    <span>Lux Limit</span>
                    <span>Est. Sockets</span>
                  </div>
                  {rooms.slice(0, 4).map(r => (
                    <div key={r.id} className="grid grid-cols-4 p-2 border-t border-white/5 text-[10px]">
                      <span>{r.name}</span>
                      <span>{r.area}</span>
                      <span>{r.luxTarget} lx</span>
                      <span>{calculateSockets(r)} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-white">3. System Architecture Guidelines</p>
                <ul className="list-disc pl-4 space-y-1 mt-1 font-serif">
                  <li>Lighting method employs LED fixtures with custom illumination targets.</li>
                  <li>Access Control magnetic lock controllers are planned for secure zone entries.</li>
                  <li>Structured data cabling uses Category 6 runs terminated inside the main equipment rack room.</li>
                </ul>
              </div>
            </div>
          )}

          {selectedReportType === 'boq' && (
            <div className="space-y-4 text-xs">
              <p className="font-serif">
                Below is the aggregated costing schedule based on standard local market supply indices:
              </p>
              <div className="border border-white/10 rounded overflow-hidden">
                <div className="grid grid-cols-4 bg-slate-950 p-2 font-sans font-bold text-slate-400 text-[10px]">
                  <span>Item Code</span>
                  <span>Description</span>
                  <span>Quantity</span>
                  <span>Total Amount</span>
                </div>
                {boqItems.slice(0, 6).map(item => (
                  <div key={item.id} className="grid grid-cols-4 p-2 border-t border-white/5 text-[10px]">
                    <span className="font-mono">{item.itemCode}</span>
                    <span className="truncate">{item.description}</span>
                    <span>{item.quantity} {item.unit}</span>
                    <span className="font-bold text-white">QAR {item.total.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              
              {variationClaims.length > 0 && (
                <div className="p-3 bg-slate-950/60 rounded border border-white/5 space-y-1">
                  <p className="font-bold text-slate-400">Project Variations Summary Ledger</p>
                  <p className="font-serif text-[11px]">
                    {variationClaims.length} pending scope claims logged totaling QAR {variationClaims.reduce((a,c)=>a+c.estimatedValue,0).toLocaleString()}.
                  </p>
                </div>
              )}

              <div className="text-right">
                <p className="text-sm font-bold text-amber-500">Gross Estimated Amount: QAR {totalBOQValue.toLocaleString()}</p>
              </div>
            </div>
          )}

          {selectedReportType === 'qa' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="font-serif">
                Site photographs collected by inspection engineers have been compared against initial drawings via SAQR vision filters:
              </p>
              <div className="space-y-2">
                {sitePhotos.map(photo => (
                  <div key={photo.id} className="p-3 bg-slate-950/60 border border-white/5 rounded">
                    <p className="font-sans font-bold text-white">{photo.roomName} ({photo.systemType})</p>
                    <div className="mt-1 space-y-1">
                      {photo.findings.map((f, idx) => (
                        <p key={idx} className="text-[11px] text-slate-300 font-serif">
                          • <span className={f.severity === 'Critical' ? 'text-rose-400 font-bold' : 'text-amber-500'}>[{f.severity}]</span> {f.description}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Sign-off block */}
          <div className="border-t border-white/10 pt-6 flex justify-between items-center text-[10px] text-slate-500 font-sans">
            <div>
              <p>Generated by: SAQR AI COGNITIVE AGENT</p>
              <p>Security Signature Hash: e2a98f1f</p>
            </div>
            <div className="text-center w-36 border-t border-slate-700 pt-2">
              <p className="text-slate-400 font-bold">Authorized MEP Engineer</p>
              <p>Review & Stamp Required</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponent button for report switcher
function ReportTypeButton({ title, desc, active, onClick }: { title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 rounded border transition-all ${
        active 
          ? 'bg-slate-900 border-amber-500 shadow-md text-white' 
          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
      }`}
    >
      <p className="text-xs font-bold text-white">{title}</p>
      <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
    </button>
  );
}


/* ========================================================
   AI PROJECT BRAIN CHAT VIEW
   ======================================================== */
interface ProjectBrainChatViewProps {
  projectId: string | null;
  projectName: string;
  rooms: RoomData[];
  boqItems: BOQItem[];
  totalBOQValue: number;
  variationClaims: VariationClaim[];
}
function ProjectBrainChatView({
  projectId,
  projectName,
  rooms,
  boqItems,
  totalBOQValue,
  variationClaims
}: ProjectBrainChatViewProps) {
  
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: `Hello! I am SAQR AI, your co-pilot for ${projectName}. I have processed the 1,000 sqm floor plan PDF and consolidated BOQ values. How can I help you design, check or claim today?`,
      time: '09:00 AM'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async (textToSend = inputVal) => {
    if (!textToSend.trim() || isSending) return;

    // User message
    const userMsg = {
      role: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsSending(true);

    try {
      if (projectId) {
        const responseData = await api.projects.chat(projectId, textToSend);
        const aiMsg = {
          role: 'assistant' as const,
          text: responseData.answer || 'No response returned from SAQR Engine',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Simulated AI response fallback
        setTimeout(() => {
          let aiText = "I have logged your request. Our rules engine recommends validating this requirement with the lead MEP engineer.";
          const txt = textToSend.toLowerCase();
          if (txt.includes('scope')) {
            aiText = `The current project scope covers the design and supply of Lighting, Power Sockets, Data, CCTV, Wi-Fi, Access Control, and BMS sensors for a ${rooms.reduce((a,c)=>a+c.area,0)} sqm layout across ${rooms.length} active spaces. The cost breakdown comprises ${boqItems.length} estimated line items. Fire Alarm systems are represented as basic placeholders.`;
          } else if (txt.includes('missing')) {
            aiText = "Based on our compliance checks, the ceiling height values for the Washrooms and Storage rooms are missing from the main upload schedule. Additionally, specific vendor fixture lumen data for linear lighting is flagged for manual review.";
          } else if (txt.includes('highest power') || txt.includes('highest load')) {
            aiText = "The Server Room has the highest power density, requiring dedicated circuits for 3x 42U Server Racks, 2x Precision A/C units, and an Online UPS system. Total calculated load placeholder is 28.5 kW.";
          } else if (txt.includes('variation') || txt.includes('claim')) {
            aiText = `We have detected ${variationClaims.length} possible variation items: ` + variationClaims.map(c => `${c.title} (estimated at QAR ${c.estimatedValue})`).join(', ') + `. Additionally, the total BOQ is current at QAR ${totalBOQValue.toLocaleString()}.`;
          } else if (txt.includes('arabic') || txt.includes('عربي')) {
            aiText = `بناءً على المخطط المقدم للمكتب في الدوحة بمساحة ${rooms.reduce((a,c)=>a+c.area,0)} متر مربع، نوصي بتركيب وحدات الإضاءة و نقاط الكهرباء ثنائية مع تدابير أمنية متكاملة لغرفة الخوادم الرئيسية تشمل التحكم بالدخول والمراقبة. القيمة الإجمالية للمشروع هي QAR ${totalBOQValue.toLocaleString()}.`;
          }

          const aiMsg = {
            role: 'assistant' as const,
            text: aiText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, aiMsg]);
        }, 800);
      }
    } catch (err: any) {
      const errorMsg = {
        role: 'assistant' as const,
        text: `Communication error: ${err.message || 'Unable to connect to SAQR RAG Node'}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[80vh] flex flex-col glass-panel overflow-hidden border border-white/10 rounded-xl">
      {/* Top chat Info */}
      <div className="h-14 border-b border-white/5 bg-slate-950/80 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 pulse-ai-orb"></span>
          <span className="text-xs font-bold text-white">SAQR AI Cognitive Chat</span>
          <span className="text-[10px] text-slate-500 font-mono">Model: GCC Infrastructure LLM V4</span>
        </div>
        <div className="text-[10px] text-slate-400">RAG Context: 14 Documents Active</div>
      </div>

      {/* Message logs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xl rounded-lg p-3.5 text-xs text-left leading-relaxed ${
              m.role === 'user' 
                ? 'bg-amber-500 text-bg-darker font-medium rounded-tr-none' 
                : 'bg-slate-900 border border-white/5 text-slate-300 font-serif rounded-tl-none'
            }`}>
              <p>{m.text}</p>
              <span className="block text-[8px] text-slate-500 text-right mt-1.5 font-sans">{m.time}</span>
            </div>
          </div>
        ))}
        <div ref={chatBottomRef}></div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-white/5 bg-slate-950/20 flex flex-wrap gap-2 shrink-0 justify-start">
        {faqList.map((faq, i) => (
          <button
            key={i}
            onClick={() => handleSend(faq.question)}
            className="text-[10px] text-slate-400 hover:text-white bg-slate-950/80 hover:bg-slate-900 border border-white/5 px-2.5 py-1 rounded-full transition-all"
          >
            {faq.question}
          </button>
        ))}
        <button 
          onClick={() => handleSend("Generate an Arabic summary of the project specifications.")}
          className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full hover:bg-amber-500/25"
        >
          Generate Arabic Summary
        </button>
      </div>

      {/* Input panel */}
      <div className="p-3 border-t border-white/5 bg-slate-950 flex gap-2 shrink-0">
        <input 
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask SAQR AI about room coordinates, lighting specs, missing components..."
          className="flex-1 form-input text-xs"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={() => handleSend()}
          className="btn-cyan py-1 px-4 text-xs"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}


/* ========================================================
   SITE PHOTO VALIDATION VIEW
   ======================================================== */
interface SiteValidationViewProps {
  projectId: string | null;
  sitePhotos: SitePhoto[];
  setSitePhotos: React.Dispatch<React.SetStateAction<SitePhoto[]>>;
  rooms: RoomData[];
}
function SiteValidationView({
  projectId,
  sitePhotos,
  setSitePhotos,
  rooms
}: SiteValidationViewProps) {
  
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>('photo-1');
  const [targetRoom, setTargetRoom] = useState('Server Room');
  const [isUploading, setIsUploading] = useState(false);

  const selectedPhoto = useMemo(() => {
    return sitePhotos.find(p => p.id === selectedPhotoId) || sitePhotos[0];
  }, [sitePhotos, selectedPhotoId]);

  const siteFindingHighlights = [
    {
      finding: 'Missing cable label',
      severity: 'Moderate' as const,
      room: selectedPhoto?.roomName || targetRoom,
      system: 'Data',
      status: 'Open' as const,
      evidence: 'Label tag not visible on inspected cable run'
    },
    {
      finding: 'Incomplete termination',
      severity: 'Critical' as const,
      room: selectedPhoto?.roomName || targetRoom,
      system: 'Power',
      status: 'Open' as const,
      evidence: 'Outlet faceplate is installed before final termination check'
    },
    {
      finding: 'Incorrect device location',
      severity: 'Moderate' as const,
      room: selectedPhoto?.roomName || targetRoom,
      system: 'CCTV',
      status: 'Open' as const,
      evidence: 'Device position should be verified against reflected ceiling plan'
    },
    {
      finding: 'Engineer review required',
      severity: 'Info' as const,
      room: selectedPhoto?.roomName || targetRoom,
      system: 'Lighting',
      status: 'Open' as const,
      evidence: 'AI finding requires consultant confirmation before closure'
    }
  ];

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        if (projectId) {
          // Upload photo to backend
          const uploaded = await api.projects.uploadPhoto(projectId, file, targetRoom, 'LIGHTING');
          // Trigger inspection algorithm immediately
          const inspected = await api.projects.runInspection(uploaded.id);
          // Convert to front-end format and insert
          const newPhoto = mapBackendPhotoToFrontend(inspected);
          setSitePhotos(prev => [newPhoto, ...prev]);
          setSelectedPhotoId(newPhoto.id);
        } else {
          // Mockup fallback
          setTimeout(() => {
            const newPhoto: SitePhoto = {
              id: `photo-${sitePhotos.length + 1}`,
              roomName: targetRoom,
              systemType: 'Lighting / Power Layout',
              imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
              timestamp: '2026-05-22 09:30:00',
              status: 'Approved',
              findings: [
                {
                  category: 'Standard Met',
                  description: 'Visible fixtures line coordinates align with layout criteria.',
                  severity: 'None',
                  status: 'Resolved'
                }
              ]
            };
            setSitePhotos(prev => [newPhoto, ...prev]);
            setSelectedPhotoId(newPhoto.id);
          }, 1500);
        }
      } catch (err: any) {
        alert(`Site validation photo upload failed: ${err.message || err}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="site-validation-page space-y-6 text-left">
      <header className="module-hero">
        <div>
          <span className="module-kicker">Inspection Agent</span>
          <h1><Camera size={30} /> AI Site Validation</h1>
          <p>
            Upload site photos and compare actual installation against SAQR’s design, BOQ, and engineering checklist.
          </p>
        </div>
        <ReviewWarning />
      </header>

      <section className="process-flow-panel">
        <SAQRFlow
          compact
          steps={[
            { title: 'Site Photo', icon: <Camera className="w-4 h-4" /> },
            { title: 'AI Vision Review', icon: <Activity className="w-4 h-4" /> },
            { title: 'Findings', icon: <AlertTriangle className="w-4 h-4" /> },
            { title: 'Engineer Action', icon: <FileText className="w-4 h-4" /> },
            { title: 'Handover Record', icon: <ClipboardList className="w-4 h-4" /> }
          ]}
        />
      </section>

      <section className="site-finding-grid">
        {siteFindingHighlights.map((finding) => (
          <SiteFindingCard key={finding.finding} {...finding} />
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Upload dropzone and photo selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Inspect Photo Upload</h3>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="form-group col-span-2">
                <label className="form-label">Location Room / Zone</label>
                <select 
                  value={targetRoom} 
                  onChange={(e) => setTargetRoom(e.target.value)}
                  className="form-select"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-white/10 rounded-lg p-6 relative flex flex-col items-center justify-center bg-slate-950/40 hover:border-cyan-500/50">
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-white">Validate Site Photo</p>
              <p className="text-[9px] text-slate-500 mt-1">AI compares installation against design, BOQ, and checklist</p>
            </div>

            {isUploading && (
              <div className="p-3 bg-cyan-950/20 text-cyan-400 border border-cyan-800/30 text-xs rounded flex gap-2 items-center">
                <RefreshCw className="w-4 h-4 spin-slow" />
                <span>Running visual inspection algorithms...</span>
              </div>
            )}
          </div>

          {/* Photo library list */}
          <div className="glass-panel p-5 space-y-3">
            <p className="font-bold text-slate-400 text-[10px] uppercase">Inspection Records</p>
            <div className="space-y-2">
              {sitePhotos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoId(photo.id)}
                  className={`w-full text-left p-3 rounded border text-xs flex justify-between items-center transition-all ${
                    selectedPhotoId === photo.id 
                      ? 'bg-slate-900 border-amber-500 text-white' 
                      : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <p className="font-bold text-white">{photo.roomName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{photo.systemType} • {photo.timestamp}</p>
                  </div>
                  <span className={`badge ${
                    photo.status === 'Approved' ? 'badge-success' : 'badge-warning'
                  } text-[8px]`}>
                    {photo.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Detection analysis comparison */}
        <div className="lg:col-span-7 space-y-4">
          {selectedPhoto && (
            <div className="glass-panel p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedPhoto.roomName} Visual Audit</h3>
                  <p className="text-[10px] text-slate-400 font-mono">UUID: {selectedPhoto.id}</p>
                </div>
                <span className={`badge ${
                  selectedPhoto.status === 'Approved' ? 'badge-success' : 'badge-danger'
                }`}>
                  {selectedPhoto.status}
                </span>
              </div>

              {/* Inspection Photo display */}
              <div className="aspect-video w-full rounded-lg border border-white/5 relative overflow-hidden bg-slate-950">
                <img 
                  src={selectedPhoto.imageUrl} 
                  alt="Site Inspection Preview" 
                  className="w-full h-full object-cover opacity-85"
                />

                {/* Overlay simulated anomaly boxes */}
                {selectedPhoto.id === 'photo-1' && (
                  <>
                    <div className="absolute top-1/4 left-1/3 w-28 h-20 border-2 border-rose-500 rounded bg-rose-500/10 flex flex-col p-1 text-[8px] text-rose-400 font-bold select-none">
                      <span>CRITICAL DETECTED</span>
                      <span>Missing grounding bridge</span>
                    </div>
                    <div className="absolute bottom-1/3 right-1/4 w-32 h-20 border-2 border-amber-500 rounded bg-amber-500/10 flex flex-col p-1 text-[8px] text-amber-400 font-bold select-none">
                      <span>MODERATE ANOMALY</span>
                      <span>Airflow block bundling</span>
                    </div>
                  </>
                )}
              </div>

              {/* Anomaly Checklist details */}
              <div className="space-y-3">
                <p className="font-bold text-slate-400 text-xs uppercase tracking-wider">Visible Findings Checklist</p>
                
                <div className="space-y-2.5">
                  {selectedPhoto.findings.map((f, i) => (
                    <div key={i} className={`p-3 rounded border text-xs text-left flex justify-between items-start gap-4 ${
                      f.category === 'Anomaly' 
                        ? 'bg-rose-950/15 border-rose-900/50 text-rose-300' 
                        : f.category === 'Minor Deviation'
                        ? 'bg-amber-950/15 border-amber-900/50 text-amber-300'
                        : 'bg-emerald-950/15 border-emerald-900/50 text-emerald-300'
                    }`}>
                      <div className="space-y-1">
                        <p className="font-bold text-white uppercase tracking-wider text-[10px]">{f.category}</p>
                        <p className="font-serif leading-relaxed text-slate-300">{f.description}</p>
                      </div>

                      <span className={`badge ${
                        f.status === 'Resolved' ? 'badge-success' : 'badge-danger'
                      } text-[8px] shrink-0`}>
                        {f.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   CLAIMS & VARIATION AGENT VIEW
   ======================================================== */
interface ClaimsVariationViewProps {
  variationClaims: VariationClaim[];
  setVariationClaims: React.Dispatch<React.SetStateAction<VariationClaim[]>>;
  boqItems: BOQItem[];
  totalBOQValue: number;
}
function ClaimsVariationView({
  variationClaims,
  setVariationClaims,
  boqItems,
  totalBOQValue
}: ClaimsVariationViewProps) {
  
  const [selectedClaimId, setSelectedClaimId] = useState<string>('claim-1');
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState('');

  const selectedClaim = useMemo(() => {
    return variationClaims.find(c => c.id === selectedClaimId) || variationClaims[0];
  }, [variationClaims, selectedClaimId]);

  const handleAddClaim = () => {
    if (!newTitle.trim()) return;
    const newClaim: VariationClaim = {
      id: `claim-${variationClaims.length + 1}`,
      title: newTitle,
      description: 'Custom site instruction modification requested by consultant. Details to be extracted from site photos.',
      estimatedValue: parseFloat(newValue) || 1500,
      requestedBy: 'Client Instruction #30',
      status: 'Draft',
      evidenceCount: 1,
      date: new Date().toISOString().split('T')[0]
    };
    setVariationClaims(prev => [...prev, newClaim]);
    setSelectedClaimId(newClaim.id);
    setNewTitle('');
    setNewValue('');
  };

  const totalClaimsValue = useMemo(() => {
    return variationClaims.reduce((acc, c) => acc + c.estimatedValue, 0);
  }, [variationClaims]);

  const getAffectedSystem = (claim: VariationClaim) => {
    const text = `${claim.title} ${claim.description}`.toLowerCase();
    if (text.includes('access')) return 'Access Control';
    if (text.includes('cctv') || text.includes('camera')) return 'CCTV';
    if (text.includes('wifi') || text.includes('wi-fi') || text.includes('data')) return 'Data';
    if (text.includes('power') || text.includes('socket') || text.includes('server')) return 'Power';
    if (text.includes('light')) return 'Lighting';
    return 'ELV';
  };

  return (
    <div className="claims-page space-y-6 text-left">
      <div className="module-hero">
        <div>
          <span className="module-kicker">Variation Agent</span>
          <h1><TrendingUp size={30} /> Claims & Variation Intelligence</h1>
          <p>Detect scope changes, missing BOQ items, and potential variation value from project updates.</p>
        </div>

        {/* Project Cost Tracking telemetry */}
        <div className="flex gap-4 text-xs bg-slate-950/60 p-3 rounded-lg border border-white/5">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-bold">Base Contract ({boqItems.length} items)</p>
            <p className="font-mono text-white font-bold">QAR {totalBOQValue.toLocaleString()}</p>
          </div>
          <div className="border-l border-white/10 pl-4">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Claims Pending</p>
            <p className="font-mono text-amber-500 font-bold">QAR {totalClaimsValue.toLocaleString()}</p>
          </div>
          <div className="border-l border-white/10 pl-4">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Adjusted Sum</p>
            <p className="font-mono text-cyan-400 font-bold">QAR {(totalBOQValue + totalClaimsValue).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <section className="claims-intelligence-grid">
        {variationClaims.map((claim) => (
          <article
            key={claim.id}
            className={`claim-intelligence-card ${selectedClaimId === claim.id ? 'active' : ''}`}
            onClick={() => setSelectedClaimId(claim.id)}
          >
            <div className="claim-card-head">
              <div>
                <span>Claim Title</span>
                <h3>{claim.title}</h3>
              </div>
              <SystemBadge system={getAffectedSystem(claim)} />
            </div>
            <div className="claim-card-metrics">
              <div>
                <span>Estimated Value</span>
                <strong>QAR {claim.estimatedValue.toLocaleString()}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{claim.status}</strong>
              </div>
              <div>
                <span>Evidence</span>
                <strong>{claim.evidenceCount} record</strong>
              </div>
            </div>
            <p>{claim.description}</p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Claims List & Create */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Claims Ledger</h3>
            
            <div className="space-y-2">
              {variationClaims.map(claim => (
                <button
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  className={`w-full text-left p-3 rounded border text-xs flex justify-between items-center transition-all ${
                    selectedClaimId === claim.id 
                      ? 'bg-slate-900 border-amber-500 text-white font-bold' 
                      : 'bg-slate-950/50 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <p className="font-bold text-white">{claim.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Requested by: {claim.requestedBy}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-amber-500 font-bold">QAR {claim.estimatedValue.toLocaleString()}</p>
                    <span className="badge badge-cyan text-[7px] py-0 px-1 mt-1">{claim.status}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick claim adding */}
          <div className="glass-panel p-5 space-y-4">
            <p className="font-bold text-slate-400 text-[10px] uppercase">Add Variation Record</p>
            <div className="space-y-3 text-xs">
              <div className="form-group">
                <label className="form-label">Claim Title / Reference</label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Additional Server Rack power points"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Value (QAR)</label>
                <input 
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="3000"
                  className="form-input"
                />
              </div>
              <button 
                onClick={handleAddClaim}
                className="w-full btn-cyan py-2 text-xs"
              >
                Create Variation Claim
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Claim Letter Generator */}
        <div className="lg:col-span-7 space-y-4">
          {selectedClaim && (
            <div className="glass-panel p-5 space-y-4 font-serif text-slate-300">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 font-sans">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedClaim.title}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Date registered: {selectedClaim.date}</p>
                </div>
                <button 
                  onClick={() => alert('Claim draft document exported as PDF.')}
                  className="btn-outline py-1 px-3 text-xs border border-white/10"
                >
                  Export Report
                </button>
              </div>

              {/* Claim narrative text block */}
              <div className="bg-slate-950/60 p-6 rounded border border-white/5 text-xs leading-relaxed space-y-4">
                <p className="font-sans font-bold text-white uppercase tracking-wider text-[9px]">DRAFT CLAIM PREVIEW</p>
                
                <p>
                  To: Project Consultant / Client Management Team <br />
                  Project: Doha Smart Office Fit-Out <br />
                  Reference: VAR-CLAIM-REF-{selectedClaim.id.toUpperCase()} <br />
                  Affected system: {getAffectedSystem(selectedClaim)}
                </p>

                <p>
                  Dear Sir/Madam,
                </p>

                <p>
                  Pursuant to the contract provisions, we hereby submit our variation proposal for the: <span className="font-bold text-white">"{selectedClaim.title}"</span>.
                </p>

                <p>
                  <span className="font-bold text-white">Scope deviation background:</span> {selectedClaim.description}. This represents additional works not shown in the original contract scope coordinates.
                </p>

                <p>
                  The estimated pricing impact for this modification is: <span className="font-bold text-amber-500 font-sans">QAR {selectedClaim.estimatedValue.toLocaleString()}</span>. This amount is calculated based on the item cost rate guidelines in the main BOQ schedule.
                </p>

                <p>
                  We kindly request your review and written instruction to proceed with procurement and site routing coordinate adjustments.
                </p>

                <p>
                  Sincerely, <br />
                  Lead MEP Estimating Team, SAQR Systems
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   FACILITY HANDOVER TWIN VIEW
   ======================================================== */
interface FacilityTwinViewProps {
  assets: AssetTwin[];
  setAssets: React.Dispatch<React.SetStateAction<AssetTwin[]>>;
  rooms: RoomData[];
}
function FacilityTwinView({
  assets,
  setAssets,
  rooms
}: FacilityTwinViewProps) {
  
  const [selectedAssetId, setSelectedAssetId] = useState<string>('asset-1');
  const [selectedLocFilter, setSelectedLocFilter] = useState<string>('All');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetLoc, setNewAssetLoc] = useState(rooms[0]?.name || 'Server Room');
  const [newAssetSystem, setNewAssetSystem] = useState('Lighting System');

  const selectedAsset = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId) || assets[0];
  }, [assets, selectedAssetId]);

  const filteredAssets = useMemo(() => {
    if (selectedLocFilter === 'All') return assets;
    return assets.filter(a => a.location === selectedLocFilter);
  }, [assets, selectedLocFilter]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;
    const tagNum = assets.length + 1;
    const newAsset: AssetTwin = {
      id: `asset-${tagNum}`,
      tag: `SAQR-EQ-${100 + tagNum}`,
      name: newAssetName,
      system: newAssetSystem,
      location: newAssetLoc,
      status: 'Operational',
      installationDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: new Date(Date.now() + 365*2*24*60*60*1000).toISOString().split('T')[0],
      maintenanceSchedule: 'Quarterly compliance check'
    };
    setAssets(prev => [...prev, newAsset]);
    setSelectedAssetId(newAsset.id);
    setNewAssetName('');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-3">
        <div>
          <span className="badge badge-gold">Digital Handover</span>
          <h2 className="text-2xl font-bold text-white mt-1">Facility Twin & Asset Intelligence Manager</h2>
          <p className="text-xs text-slate-400 font-serif">Convert completed construction schedules into an operational database with O&M warranty schedules and QR tags.</p>
        </div>

        {/* Location Filter Selector */}
        <div className="flex items-center gap-2 text-xs bg-slate-950/60 p-2 rounded border border-white/5">
          <span className="text-slate-400">Filter Location:</span>
          <select 
            value={selectedLocFilter} 
            onChange={(e) => setSelectedLocFilter(e.target.value)}
            className="form-select bg-slate-900 border-white/10 text-white rounded text-xs py-0.5 focus:outline-none"
          >
            <option value="All">All Locations</option>
            {rooms.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Asset Register Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="facility-asset-grid">
            {filteredAssets.slice(0, 3).map((asset) => (
              <FacilityAssetCard
                key={asset.id}
                name={asset.name}
                tag={asset.tag}
                system={asset.system}
                location={asset.location}
                status={asset.status}
                warrantyExpiry={asset.warrantyExpiry}
                maintenanceDate={asset.maintenanceSchedule}
              />
            ))}
          </div>

          <div className="table-container">
            <table className="eng-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Name</th>
                  <th>System Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Warranty Expiry</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => (
                  <tr 
                    key={asset.id}
                    className={`cursor-pointer ${selectedAssetId === asset.id ? 'bg-amber-500/10' : ''}`}
                    onClick={() => setSelectedAssetId(asset.id)}
                  >
                    <td className="font-mono text-xs text-cyan-400">{asset.tag}</td>
                    <td className="font-semibold text-white text-xs">{asset.name}</td>
                    <td className="text-xs">{asset.system}</td>
                    <td className="text-xs">{asset.location}</td>
                    <td>
                      <span className={`badge ${
                        asset.status === 'Operational' ? 'badge-success' : 'badge-warning'
                      } text-[8.5px]`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{asset.warrantyExpiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: QR Tag Card & Details */}
        <div className="lg:col-span-4 space-y-4">
          {selectedAsset && (
            <div className="glass-panel p-5 space-y-5 border border-white/10">
              <div className="text-center border-b border-white/5 pb-4">
                <span className="text-[10px] uppercase font-bold text-slate-500">Asset QR Tag Card Preview</span>
                
                {/* Visual QR Code placeholder */}
                <div className="w-36 h-36 mx-auto my-3 bg-white p-3 rounded-lg flex items-center justify-center shadow-lg">
                  {/* Styled block representing QR */}
                  <div className="w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:10px_10px] relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-4 border-slate-950"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-4 border-slate-950"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-4 border-slate-950"></div>
                  </div>
                </div>

                <p className="font-mono text-xs font-bold text-white">{selectedAsset.tag}</p>
                <p className="text-[10px] text-slate-400">Scan to view warranty & service schedule</p>
              </div>

              {/* Asset Information list */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Name:</span>
                  <span className="text-white font-bold">{selectedAsset.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white">{selectedAsset.system}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-white font-bold">{selectedAsset.location}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Installed on:</span>
                  <span className="text-white font-mono">{selectedAsset.installationDate}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-400">Service Task:</span>
                  <span className="text-amber-500 italic">{selectedAsset.maintenanceSchedule}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => alert('O&M Maintenance report exported.')}
                  className="w-full btn-cyan py-2 text-xs flex justify-center items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download O&M Manual</span>
                </button>
              </div>

              {/* Add New Asset Form */}
              <form onSubmit={handleAddAsset} className="pt-4 border-t border-white/5 space-y-3 text-xs">
                <p className="font-bold text-slate-400 text-[10px] uppercase">Register Digital Asset</p>
                
                <div className="form-group">
                  <label className="form-label">Asset Name</label>
                  <input 
                    type="text" 
                    required
                    value={newAssetName} 
                    onChange={(e) => setNewAssetName(e.target.value)}
                    placeholder="e.g. Server Rack A5 PDU"
                    className="form-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <select 
                      value={newAssetLoc} 
                      onChange={(e) => setNewAssetLoc(e.target.value)}
                      className="form-select text-[11px]"
                    >
                      {rooms.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">System</label>
                    <select 
                      value={newAssetSystem} 
                      onChange={(e) => setNewAssetSystem(e.target.value)}
                      className="form-select text-[11px]"
                    >
                      <option value="Lighting System">Lighting</option>
                      <option value="Power Grid">Power</option>
                      <option value="ELV Network">ELV Net</option>
                      <option value="HVAC Systems">HVAC</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full btn-gold py-1.5 text-xs flex justify-center items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Facility Asset</span>
                </button>
              </form>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   SETTINGS VIEW
   ======================================================== */
interface SettingsViewProps {
  projectName: string;
  setProjectName: (n: string) => void;
  clientName: string;
  setClientName: (c: string) => void;
  projectArea: number;
  setProjectArea: (a: number) => void;
  projectCountry: string;
  setProjectCountry: (c: string) => void;
  projectLevel: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'MISSION_CRITICAL';
  setProjectLevel: (l: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'MISSION_CRITICAL') => void;
  laborRate: number;
  setLaborRate: (r: number) => void;
  luxStandard: { [key: string]: number };
  setLuxStandard: React.Dispatch<React.SetStateAction<any>>;
}
function SettingsView({
  projectName,
  setProjectName,
  clientName,
  setClientName,
  projectArea,
  setProjectArea,
  projectCountry,
  setProjectCountry,
  projectLevel,
  setProjectLevel,
  laborRate,
  setLaborRate,
  luxStandard,
  setLuxStandard
}: SettingsViewProps) {
  
  const handleLuxChange = (roomType: string, val: number) => {
    setLuxStandard({
      ...luxStandard,
      [roomType]: val
    });
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      <div>
        <span className="badge badge-gold">Configuration Settings</span>
        <h2 className="text-2xl font-bold text-white mt-1">Platform System Configuration & Rules</h2>
        <p className="text-xs text-slate-400 font-serif">Modify the GCC regulatory norms, estimation factors, labor hourly rates, and company defaults.</p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        
        {/* Project Metadata Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-1">1. Active Project Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input 
                type="text" 
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Client Name</label>
              <input 
                type="text" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Area (sqm)</label>
              <input 
                type="number" 
                value={projectArea}
                onChange={(e) => setProjectArea(parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Country Standards</label>
              <select 
                value={projectCountry}
                onChange={(e) => setProjectCountry(e.target.value)}
                className="form-select"
              >
                <option value="Qatar">Qatar (Ashghal / Kahramaa)</option>
                <option value="Saudi Arabia">Saudi Arabia (SASO / SBC)</option>
                <option value="UAE">UAE (DEWA / ADDC)</option>
                <option value="Bahrain">Bahrain (EWA)</option>
                <option value="Oman">Oman (MEDC)</option>
                <option value="Kuwait">Kuwait (MEW)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Design Quality Level</label>
              <select 
                value={projectLevel}
                onChange={(e) => setProjectLevel(e.target.value as any)}
                className="form-select"
              >
                <option value="ECONOMY">Economy (Basic specs, standard brands)</option>
                <option value="STANDARD">Standard (High efficiency, trusted GCC brands)</option>
                <option value="PREMIUM">Premium (Dimmable paths, luxury European brands)</option>
                <option value="MISSION_CRITICAL">Mission-Critical (N+1 redundant loops, certified security)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Engineering calculations defaults */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-1">2. Target Lighting Illumination Rules (Lux)</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {Object.keys(luxStandard).map(type => (
              <div key={type} className="form-group">
                <label className="form-label">{type} Target</label>
                <input 
                  type="number"
                  value={luxStandard[type]}
                  onChange={(e) => handleLuxChange(type, parseInt(e.target.value) || 0)}
                  className="form-input"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Costing Settings */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-1">3. Estimating Costs Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="form-group">
              <label className="form-label">Labor Blended Rate (QAR / hour)</label>
              <input 
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(parseInt(e.target.value) || 120)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Action status */}
        <div className="pt-4 text-right">
          <button 
            onClick={() => alert('Settings updated and synced successfully.')}
            className="btn-gold py-2 px-6 text-xs"
          >
            Save & Sync Settings
          </button>
        </div>

      </div>
    </div>
  );
}


/* ========================================================
   PROJECT WIZARD MODAL WIDGET
   ======================================================== */
interface ProjectWizardModalProps {
  onClose: () => void;
  onGenerate: (info: {
    name: string;
    client: string;
    area: number;
    type: string;
    country: string;
    level: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'MISSION_CRITICAL';
  }) => void;
}
function ProjectWizardModal({ onClose, onGenerate }: ProjectWizardModalProps) {
  const [name, setName] = useState('New Commercial Fit-Out');
  const [client, setClient] = useState('Sovereign Group LLC');
  const [area, setArea] = useState(800);
  const [type, setType] = useState('Office');
  const [country, setCountry] = useState('Qatar');
  const [level, setLevel] = useState<'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'MISSION_CRITICAL'>('STANDARD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({ name, client, area, type, country, level });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-panel p-6 border border-white/10 relative text-left space-y-4">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-white/5 pb-2">
          <span className="badge badge-gold">Setup Wizard</span>
          <h3 className="text-lg font-bold text-white mt-1">Configure New Engineering Project</h3>
          <p className="text-xs text-slate-400">Establish the spatial parameters for SAQR design and cost estimating models.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="form-group">
            <label className="form-label">Project Name / Reference</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Client Name</label>
            <input 
              type="text" 
              required
              value={client} 
              onChange={(e) => setClient(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Layout Area (sqm)</label>
              <input 
                type="number" 
                required
                value={area} 
                onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Facility Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="form-select"
              >
                <option value="Office">Commercial Office Floor</option>
                <option value="Data Room / Server Room">Data Room / Server Suite</option>
                <option value="Clinic">Medical Clinic</option>
                <option value="Retail">Retail Showroom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Authority Jurisdiction</label>
              <select 
                value={country} 
                onChange={(e) => setCountry(e.target.value)}
                className="form-select"
              >
                <option value="Qatar">Qatar (Kahramaa)</option>
                <option value="Saudi Arabia">Saudi Arabia (SASO)</option>
                <option value="UAE">UAE (DEWA)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Design Quality Target</label>
              <select 
                value={level} 
                onChange={(e) => setLevel(e.target.value as any)}
                className="form-select"
              >
                <option value="ECONOMY">Economy Specs</option>
                <option value="STANDARD">Standard baseline</option>
                <option value="PREMIUM">Premium Quality</option>
                <option value="MISSION_CRITICAL">Mission-Critical Redundancy</option>
              </select>
            </div>
          </div>

          {/* Action trigger */}
          <div className="pt-2 flex justify-end gap-3 border-t border-white/5 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-outline py-2 px-4"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-gold py-2 px-6"
            >
              Generate Engineering Design
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
