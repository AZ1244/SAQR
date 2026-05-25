/**
 * SAQR AI - Premium Dashboard
 * 
 * Command Center showing engineering lifecycle, KPIs, AI insights, and systems map
 */

import React, { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Building,
  Camera,
  ClipboardList,
  Cpu,
  FileText,
  Lightbulb,
  Zap,
  Plus,
  Layers,
  TrendingUp,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import {
  EngineeringFlow,
  EngineeringCard,
  ConfidenceMeter,
  ReviewWarning,
  AIInsightCard,
  AgentCard,
  EngineeringIntelligenceFlow,
  RoomIntelligenceCard
} from './designSystem';

import { saqrAgents, type SaqrAgentDefinition } from '../data/productContent';

import { 
  calculateLightingFixtures,
  calculateSockets,
  calculateLoadKw,
  calculateElvPoints
} from '../utils/engineeringFormulas';

import type { RoomData, BOQItem, SitePhoto } from '../data/mockData';

function getDashboardAgentIcon(iconKey: SaqrAgentDefinition['iconKey']) {
  const iconClass = 'w-5 h-5';
  switch (iconKey) {
    case 'design':
      return <Lightbulb className={iconClass} />;
    case 'boq':
      return <FileText className={iconClass} />;
    case 'report':
      return <FileText className={iconClass} />;
    case 'site':
      return <Camera className={iconClass} />;
    case 'claims':
      return <TrendingUp className={iconClass} />;
    case 'facility':
      return <ClipboardList className={iconClass} />;
    case 'compliance':
      return <AlertTriangle className={iconClass} />;
    default:
      return <Cpu className={iconClass} />;
  }
}

interface DashboardViewProps {
  rooms: RoomData[];
  boqItems: BOQItem[];
  totalBOQValue: number;
  activeProjectCount: number;
  projectName: string;
  projectArea: number;
  projectCountry: string;
  projectLevel: string;
  sitePhotos: SitePhoto[];
  onNavigate: (tab: string) => void;
  onNewProject: () => void;
  onGenerateDesign: () => void;
  onRegenerateBOQ: () => void;
  onGenerateReport: () => void;
}

export const EnhancedDashboard: React.FC<DashboardViewProps> = ({
  rooms,
  boqItems,
  totalBOQValue,
  projectName,
  projectArea,
  projectCountry,
  projectLevel,
  sitePhotos,
  onNavigate,
  onNewProject,
  onGenerateDesign,
  onRegenerateBOQ,
  onGenerateReport
}) => {
  // ─────────────────────────────────────────────────────────────────────────
  // METRICS CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    let lightingPoints = 0;
    let powerSockets = 0;
    let dataOutlets = 0;
    let cctvPoints = 0;
    let wifiPoints = 0;
    let accessPoints = 0;
    let bmsPoints = 0;
    let totalLoad = 0;

    rooms.forEach((room) => {
      lightingPoints += calculateLightingFixtures(room);
      powerSockets += calculateSockets(room);
      totalLoad += calculateLoadKw(room);
      
      const elv = calculateElvPoints(room);
      dataOutlets += elv.dataOutlets;
      cctvPoints += elv.cctv;
      wifiPoints += elv.wifi;
      accessPoints += elv.accessControl;
      bmsPoints += elv.bmsSensors;
    });

    return {
      lightingPoints,
      powerSockets,
      dataOutlets,
      cctvPoints,
      wifiPoints,
      accessPoints,
      bmsPoints,
      totalLoad: totalLoad.toFixed(2)
    };
  }, [rooms]);

  // Unresolved site findings
  const unresolvedAlerts = useMemo(() => {
    let count = 0;
    let critical = 0;
    sitePhotos.forEach((p) => {
      p.findings.forEach((f) => {
        if (f.status === 'Open') {
          count++;
          if (f.severity === 'Critical') critical++;
        }
      });
    });
    return { total: count, critical };
  }, [sitePhotos]);

  // Cost breakdown by system
  const costBreakdown = useMemo(() => {
    const categories: { [key: string]: number } = {};
    boqItems.forEach((item) => {
      categories[item.category] = (categories[item.category] || 0) + item.total;
    });
    return Object.keys(categories).map((cat) => ({
      name: cat,
      value: categories[cat]
    }));
  }, [boqItems]);

  // Room power loads
  const roomLoads = useMemo(() => {
    return rooms.slice(0, 8).map((room) => ({
      name: room.name.length > 15 ? `${room.name.substring(0, 12)}...` : room.name,
      load: calculateLoadKw(room),
      points: calculateSockets(room)
    }));
  }, [rooms]);

  // Project status confidence
  const projectConfidence = useMemo(() => {
    const designComplete: 'High' | 'Medium' | 'Low' | 'Needs Review' = rooms.length > 0 ? 'High' : 'Medium';
    const boqComplete: 'High' | 'Medium' | 'Low' | 'Needs Review' = boqItems.length > 6 ? 'High' : 'Medium';
    const overall: 'High' | 'Medium' | 'Low' | 'Needs Review' = boqItems.length > 6 && rooms.length > 6 ? 'High' : 'Medium';
    return { designComplete, boqComplete, overall };
  }, [rooms, boqItems]);

  // Engineering flow stages
  const flowStages: Array<{ title: string; icon: React.ReactNode; status: 'complete' | 'in-progress' | 'pending'; count: number; percentage: number }> = [
    {
      title: 'Project Setup',
      icon: <Building className="w-5 h-5" />,
      status: rooms.length > 0 ? 'complete' : 'in-progress',
      count: rooms.length,
      percentage: Math.min((rooms.length / 12) * 100, 100)
    },
    {
      title: 'Room Intelligence',
      icon: <Activity className="w-5 h-5" />,
      status: rooms.length > 5 ? 'complete' : 'in-progress',
      count: rooms.length,
      percentage: Math.min((rooms.length / 12) * 100, 100)
    },
    {
      title: 'Design Generation',
      icon: <Lightbulb className="w-5 h-5" />,
      status: boqItems.length > 0 ? 'complete' : 'pending',
      count: metrics.lightingPoints,
      percentage: boqItems.length > 0 ? 100 : 0
    },
    {
      title: 'BOQ Estimate',
      icon: <FileText className="w-5 h-5" />,
      status: boqItems.length > 5 ? 'complete' : 'pending',
      count: boqItems.length,
      percentage: Math.min((boqItems.length / 9) * 100, 100)
    },
    {
      title: 'Site Validation',
      icon: <MessageSquare className="w-5 h-5" />,
      status: sitePhotos.length > 0 ? 'in-progress' : 'pending',
      count: sitePhotos.length,
      percentage: 0
    },
    {
      title: 'Facility Twin',
      icon: <Activity className="w-5 h-5" />,
      status: 'pending',
      count: 0,
      percentage: 0
    }
  ];

  const getAgentOutputs = (agent: SaqrAgentDefinition) => {
    switch (agent.id) {
      case 'design':
        return [`${rooms.length} rooms analyzed`, `${metrics.lightingPoints} lighting points`, 'Design assumptions ready'];
      case 'boq':
        return [`QAR ${totalBOQValue.toLocaleString()} estimate`, `${boqItems.length} BOQ items`, 'System cost breakdown'];
      case 'report':
        return ['Concept report available', 'Executive summary ready', 'Engineer disclaimer included'];
      case 'site':
        return [`${unresolvedAlerts.total || 1} finding detected`, 'Engineer action required', 'Handover note pending'];
      case 'claims':
        return ['1 variation claim', 'Draft claim preview', 'Evidence checklist'];
      case 'facility':
        return ['1 asset registered', 'Warranty tracker active', 'QR-ready handover'];
      case 'compliance':
        return ['Engineer review required', 'Missing assumptions flagged', 'Preliminary output warning'];
      default:
        return agent.outputs;
    }
  };

  const handleAgentAction = (agentId: string) => {
    if (agentId === 'design') onGenerateDesign();
    else if (agentId === 'boq') onRegenerateBOQ();
    else if (agentId === 'report') onGenerateReport();
    else if (agentId === 'site') onNavigate('site');
    else if (agentId === 'claims') onNavigate('claims');
    else if (agentId === 'facility') onNavigate('twin');
    else onNavigate('studio');
  };

  const COLORS = ['#D6A84F', '#22D3EE', '#10B981', '#F59E0B', '#EF4444'];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 text-left">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER & INTRO */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Activity className="w-8 h-8 text-cyan-400" />
              Engineering Command Center
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              Real-time design intelligence and project lifecycle tracking for <span className="font-semibold text-white">{projectName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNewProject}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-300 font-semibold text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Configure New Project
            </button>

            <button
              onClick={() => onNavigate('studio')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-lg text-amber-300 font-semibold text-sm transition-all"
            >
              <Layers className="w-4 h-4" />
              Review Room Intelligence
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ENGINEERING LIFECYCLE FLOW */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Engineering Lifecycle Pipeline</h2>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
          <EngineeringFlow stages={flowStages} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Project Data to Engineering Intelligence</h2>
        <EngineeringIntelligenceFlow compact />
      </div>

      <div className="space-y-3">
        <div className="section-title-row">
          <div>
            <span>Coordinated AI Team</span>
            <h2>SAQR AI Agent Team</h2>
          </div>
          <button
            onClick={() => onNavigate('agents')}
            className="btn-outline py-2 px-3 text-xs"
          >
            View All AI Agents
          </button>
        </div>
        <div className="dashboard-agent-grid">
          {saqrAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              name={agent.name}
              role={agent.purpose}
              inputData={agent.inputs}
              outputData={getAgentOutputs(agent)}
              status={agent.status}
              confidence={agent.confidence}
              nextAction={agent.nextAction}
              icon={getDashboardAgentIcon(agent.iconKey)}
              actionLabel={agent.buttonLabel}
              onAction={() => handleAgentAction(agent.id)}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PROJECT SUMMARY KPI CARDS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Project Telemetry</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EngineeringCard
            title="Project Area"
            value={projectArea}
            unit="sqm"
            icon={<Building className="w-5 h-5" />}
            confidence={projectConfidence.designComplete}
          >
            {projectCountry} • {projectLevel}
          </EngineeringCard>

          <EngineeringCard
            title="Rooms Detected"
            value={rooms.length}
            unit="spaces"
            icon={<Activity className="w-5 h-5" />}
            confidence={rooms.length > 6 ? 'High' : 'Medium'}
          >
            {rooms.length > 0 ? 'Ready for design generation' : 'Add rooms to begin'}
          </EngineeringCard>

          <EngineeringCard
            title="BOQ Value"
            value={`QAR ${totalBOQValue.toLocaleString()}`}
            icon={<FileText className="w-5 h-5" />}
            status="success"
            confidence={projectConfidence.boqComplete}
          >
            {boqItems.length} items • Preliminary
          </EngineeringCard>

          <EngineeringCard
            title="Total Load"
            value={metrics.totalLoad}
            unit="kW"
            icon={<Zap className="w-5 h-5" />}
            status="warning"
          >
            Peak demand • All systems
          </EngineeringCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ENGINEERING SYSTEMS MAP */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Engineering Systems Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SystemStatusCard system="Lighting" points={metrics.lightingPoints} confidence="High" />
          <SystemStatusCard system="Power" points={metrics.powerSockets} confidence="High" />
          <SystemStatusCard system="Data" points={metrics.dataOutlets} confidence="Medium" />
          <SystemStatusCard system="CCTV" points={metrics.cctvPoints} confidence="High" />
          <SystemStatusCard system="Wi-Fi" points={metrics.wifiPoints} confidence="Medium" warning />
          <SystemStatusCard system="Access Control" points={metrics.accessPoints} confidence="High" />
          <SystemStatusCard system="BMS" points={metrics.bmsPoints} confidence="Medium" />
          <SystemStatusCard system="Server Room" points={1} confidence="High" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CHARTS & ANALYTICS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown Pie */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            BOQ Cost Distribution by System
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {costBreakdown.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value) => `QAR ${Number(value).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Load Analysis Bar */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Room Power Load & Socket Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomLoads} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#22D3EE" fontSize={9} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="load" fill="#22D3EE" name="Load (kW)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="points" fill="#D6A84F" name="Sockets" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AI INSIGHTS + WARNINGS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Project Intelligence */}
        <AIInsightCard
          title="SAQR AI Project Intelligence"
          insights={[
            'Open Office has the highest lighting requirement (450 lux, 24 fixtures)',
            'Server Room requires UPS-backed dedicated power (28.5 kW peak load)',
            'Wi-Fi coverage should be validated after wall material confirmation',
            `BOQ value is currently QAR ${totalBOQValue.toLocaleString()} (preliminary)`,
            'Engineer review required before procurement begins'
          ]}
          actionButton={{
            label: 'Ask SAQR AI About This Project',
            onClick: () => onNavigate('chat')
          }}
        />

        {/* Safety & Warnings */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Project Quality Checklist
          </h3>

          <ReviewWarning />

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-100">
                <p className="font-semibold">Missing Ceiling Heights</p>
                <p className="text-xs text-amber-200">Storage & Washroom - Using 2.7m default. Verify on site.</p>
              </div>
            </div>

            {unresolvedAlerts.critical > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-100">
                  <p className="font-semibold">{unresolvedAlerts.critical} Critical Site Findings</p>
                  <p className="text-xs text-red-200">Review site validation photos immediately.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => onNavigate('site')}
              className="w-full mt-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-300 font-semibold text-sm transition-all"
            >
              View Site Validation Details →
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROOM INTELLIGENCE PREVIEW */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Room Intelligence Sample</h2>
          <button
            onClick={() => onNavigate('studio')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View All Rooms →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.slice(0, 3).map((room) => {
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
                  { name: 'Data', count: elv.dataOutlets, confidence: 'Medium' }
                ]}
                confidence="High"
                hasWarning={!room.ceilingHeight}
                onClick={() => onNavigate('studio')}
              />
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* QUICK ACTION BUTTONS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest">Next Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionButton
            label="Generate Engineering Design"
            desc="Recalculate lighting, power, and ELV points"
            icon={<Lightbulb className="w-5 h-5" />}
            onClick={onGenerateDesign}
          />
          <QuickActionButton
            label="Regenerate BOQ from Current Rooms"
            desc="Update quantities from rooms"
            icon={<FileText className="w-5 h-5" />}
            onClick={onRegenerateBOQ}
          />
          <QuickActionButton
            label="Generate Project Report"
            desc="Create engineering document"
            icon={<FileText className="w-5 h-5" />}
            onClick={onGenerateReport}
          />
          <QuickActionButton
            label="Validate Site Photo"
            desc="Compare actual vs design"
            icon={<MessageSquare className="w-5 h-5" />}
            onClick={() => onNavigate('site')}
          />
        </div>
      </div>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

interface SystemStatusCardProps {
  system: string;
  points: number;
  confidence: 'High' | 'Medium' | 'Low';
  warning?: boolean;
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ system, points, confidence, warning }) => (
  <div className={`p-4 rounded-lg border backdrop-blur-sm ${
    warning
      ? 'border-amber-500/30 bg-amber-500/10'
      : 'border-cyan-500/20 bg-cyan-500/5'
  }`}>
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-bold text-white">{system}</h4>
      <ConfidenceMeter level={confidence} showLabel={false} />
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold text-white">{points}</span>
      <span className="text-xs text-gray-400">points</span>
    </div>
  </div>
);

interface QuickActionButtonProps {
  label: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ label, desc, icon, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/40 transition-all text-left group"
  >
    <div className="flex items-start gap-3">
      <div className="text-cyan-400 group-hover:text-cyan-300 transition-colors mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{label}</h4>
        <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{desc}</p>
      </div>
    </div>
  </button>
);
