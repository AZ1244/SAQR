/**
 * SAQR AI Design System
 * 
 * Premium engineering command center visual components
 * Color Palette:
 * - Deep Navy: #07111F
 * - Midnight Blue: #0B1E33
 * - Falcon Gold: #D6A84F
 * - Electric Cyan: #22D3EE
 * - Steel Gray: #94A3B8
 * - Success Green: #10B981
 * - Warning Amber: #F59E0B
 * - Risk Red: #EF4444
 */

import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Box,
  Camera,
  CheckCircle,
  ClipboardCheck,
  Cpu,
  Info,
  Layers,
  Lightbulb,
  Lock,
  Network,
  TrendingUp,
  Wifi,
  Wrench,
  Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// BLUEPRINT BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════════

export const BlueprintBackground: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="blueprint-background relative w-full h-full overflow-hidden">
    <div 
      className="absolute inset-0"
      style={{
        backgroundImage: `
          linear-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34, 211, 238, 0.08) 1px, transparent 1px),
          linear-gradient(rgba(214, 168, 79, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(214, 168, 79, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '88px 88px, 88px 88px, 22px 22px, 22px 22px'
      }}
    />
    <div className="blueprint-background-sheen" />
    {children && <div className="relative z-10">{children}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINEERING FLOW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface FlowStage {
  title: string;
  icon: React.ReactNode;
  status: 'complete' | 'in-progress' | 'pending';
  count?: number;
  percentage?: number;
}

export const EngineeringFlow: React.FC<{ stages: FlowStage[] }> = ({ stages }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'in-progress':
        return 'text-cyan-400 bg-cyan-500/10';
      case 'pending':
        return 'text-gray-400 bg-gray-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'complete':
        return 'border-emerald-500/30';
      case 'in-progress':
        return 'border-cyan-500/30';
      case 'pending':
        return 'border-gray-500/20';
      default:
        return 'border-gray-500/20';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between overflow-x-auto gap-3 pb-4">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center flex-shrink-0">
            {/* Stage card */}
            <div className={`p-4 rounded-lg border ${getStatusBorder(stage.status)} backdrop-blur-md bg-white/5 min-w-max`}>
              <div className={`flex items-center gap-3 ${getStatusColor(stage.status)}`}>
                <div className="text-xl">{stage.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{stage.title}</p>
                  {stage.percentage && (
                    <div className="w-24 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${stage.status === 'complete' ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: `${stage.percentage}%` }}
                      />
                    </div>
                  )}
                  {stage.count && <p className="text-xs text-gray-400 mt-1">{stage.count} items</p>}
                </div>
              </div>
            </div>

            {/* Arrow separator */}
            {idx < stages.length - 1 && (
              <div className="mx-2 text-cyan-500/50 text-2xl hidden sm:block">→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SAQR PRODUCT FLOW
// ═══════════════════════════════════════════════════════════════════════════════

interface SAQRFlowStep {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const SAQRFlow: React.FC<{ steps: SAQRFlowStep[]; compact?: boolean }> = ({ steps, compact = false }) => (
  <div className={`saqr-flow ${compact ? 'saqr-flow-compact' : ''}`}>
    {steps.map((step, idx) => (
      <React.Fragment key={step.title}>
        <div className="saqr-flow-step">
          <div className="saqr-flow-icon">{step.icon ?? <Cpu size={18} />}</div>
          <div>
            <strong>{step.title}</strong>
            {step.subtitle && <span>{step.subtitle}</span>}
          </div>
        </div>
        {idx < steps.length - 1 && <div className="saqr-flow-connector" aria-hidden="true" />}
      </React.Fragment>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM BADGE
// ═══════════════════════════════════════════════════════════════════════════════

export type SystemType =
  | 'Lighting'
  | 'Power'
  | 'Data'
  | 'CCTV'
  | 'Wi-Fi'
  | 'Access Control'
  | 'BMS'
  | 'Server Room'
  | 'ELV'
  | 'Containment'
  | 'Labor & Services'
  | 'Facility Twin'
  | string;

const systemConfig: Record<string, { className: string; icon: React.ReactNode }> = {
  'Lighting': { className: 'system-lighting', icon: <Lightbulb size={13} /> },
  'Power': { className: 'system-power', icon: <Zap size={13} /> },
  'Data': { className: 'system-data', icon: <Network size={13} /> },
  'CCTV': { className: 'system-cctv', icon: <Camera size={13} /> },
  'Wi-Fi': { className: 'system-wifi', icon: <Wifi size={13} /> },
  'Access Control': { className: 'system-access', icon: <Lock size={13} /> },
  'BMS': { className: 'system-bms', icon: <Layers size={13} /> },
  'Server Room': { className: 'system-server', icon: <Box size={13} /> },
  'ELV': { className: 'system-elv', icon: <Network size={13} /> },
  'Containment': { className: 'system-containment', icon: <Layers size={13} /> },
  'Labor & Services': { className: 'system-labor', icon: <Wrench size={13} /> },
  'Facility Twin': { className: 'system-twin', icon: <ClipboardCheck size={13} /> }
};

interface SystemBadgeProps {
  system: SystemType;
  count?: number;
  confidence?: 'High' | 'Medium' | 'Low' | 'Needs Review';
  showWarning?: boolean;
}

export const SystemBadge: React.FC<SystemBadgeProps> = ({ system, count, showWarning }) => {
  const config = systemConfig[system] ?? { className: 'system-generic', icon: <Layers size={13} /> };

  return (
    <div className={`system-badge ${config.className}`}>
      {config.icon}
      <span>{system}</span>
      {typeof count === 'number' && <span className="system-badge-count">({count})</span>}
      {showWarning && <AlertTriangle size={12} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIDENCE METER
// ═══════════════════════════════════════════════════════════════════════════════

interface ConfidenceMeterProps {
  level: 'High' | 'Medium' | 'Low' | 'Needs Review';
  showLabel?: boolean;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ level, showLabel = true }) => {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    'High': { className: 'confidence-high', icon: <CheckCircle size={15} /> },
    'Medium': { className: 'confidence-medium', icon: <TrendingUp size={15} /> },
    'Low': { className: 'confidence-low', icon: <AlertCircle size={15} /> },
    'Needs Review': { className: 'confidence-review', icon: <AlertTriangle size={15} /> }
  };

  const current = config[level];

  return (
    <div className={`confidence-meter ${current.className}`}>
      {current.icon}
      {showLabel && <span>{level}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW WARNING
// ═══════════════════════════════════════════════════════════════════════════════

export const ReviewWarning: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`review-warning ${className}`}>
    <AlertTriangle size={16} />
    <span>Engineer Review Required</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINEERING CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface EngineeringCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'info' | 'pending';
  confidence?: 'High' | 'Medium' | 'Low' | 'Needs Review';
  children?: React.ReactNode;
}

export const EngineeringCard: React.FC<EngineeringCardProps> = ({
  title,
  value,
  unit,
  icon,
  status = 'info',
  confidence,
  children
}) => {
  const statusColors = {
    success: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    info: 'border-cyan-500/30 bg-cyan-500/5',
    pending: 'border-gray-500/20 bg-gray-500/5'
  };

  return (
    <div className={`p-4 rounded-lg border backdrop-blur-md bg-white/5 ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
        {icon && <div className="text-cyan-400">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <p className="text-2xl font-bold text-white">{value}</p>
        {unit && <p className="text-sm text-gray-400">{unit}</p>}
      </div>

      {confidence && <div className="mt-2"><ConfidenceMeter level={confidence} showLabel /></div>}
      
      {children && <div className="mt-3 text-xs text-gray-400">{children}</div>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOM INTELLIGENCE CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface RoomCardProps {
  name: string;
  type: string;
  area: number;
  systems: Array<{ name: SystemType; count: number; confidence: 'High' | 'Medium' | 'Low' | 'Needs Review' }>;
  confidence: 'High' | 'Medium' | 'Low' | 'Needs Review';
  hasWarning?: boolean;
  onClick?: () => void;
}

export const RoomIntelligenceCard: React.FC<RoomCardProps> = ({
  name,
  type,
  area,
  systems,
  confidence,
  hasWarning = false,
  onClick
}) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-lg border border-cyan-500/20 backdrop-blur-md bg-gradient-to-br from-cyan-500/5 to-transparent hover:border-cyan-500/40 hover:bg-cyan-500/10 transition-all cursor-pointer ${hasWarning ? 'border-amber-500/30' : ''}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-white text-sm">{name}</h3>
        <p className="text-xs text-gray-400">{type} • {area} sqm</p>
      </div>
      {hasWarning && <AlertTriangle className="w-4 h-4 text-amber-500" />}
    </div>

    <div className="flex flex-wrap gap-1 mb-3">
      {systems.map((sys, idx) => (
        <SystemBadge key={idx} system={sys.name} count={sys.count} />
      ))}
    </div>

    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">Confidence</span>
      <ConfidenceMeter level={confidence} showLabel={false} />
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// BOQ SUMMARY CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface BOQSummaryCardProps {
  totalValue: number;
  itemCount: number;
  systems: string[];
  confidence: 'High' | 'Medium' | 'Low' | 'Needs Review';
  lastGenerated: string;
}

export const BOQSummaryCard: React.FC<BOQSummaryCardProps> = ({
  totalValue,
  itemCount,
  systems,
  confidence,
  lastGenerated
}) => (
  <div className="boq-summary-card">
    <h2>
      <Zap size={20} />
      BOQ Summary
    </h2>

    <div className="boq-summary-metrics">
      <div>
        <p>Total Value</p>
        <strong>QAR {totalValue.toLocaleString()}</strong>
      </div>
      <div>
        <p>Items</p>
        <strong>{itemCount}</strong>
      </div>
    </div>

    <div className="boq-summary-systems">
      <p>Systems</p>
      <div>
        {systems.map((system, idx) => (
          <SystemBadge key={`${system}-${idx}`} system={system} />
        ))}
      </div>
    </div>

    <div className="boq-summary-footer">
      <div>
        <p>Confidence</p>
        <ConfidenceMeter level={confidence} />
      </div>
      <p>
        Generated<br/>{lastGenerated}
      </p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// AI INSIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface AIInsightCardProps {
  title: string;
  insights: string[];
  actionButton?: { label: string; onClick: () => void };
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({
  title,
  insights,
  actionButton
}) => (
  <div className="ai-insight-card">
    <h2>
      <TrendingUp size={20} />
      {title}
    </h2>

    <div className="ai-insight-list">
      {insights.map((insight, idx) => (
        <div key={idx}>
          <span />
          <p>{insight}</p>
        </div>
      ))}
    </div>

    {actionButton && (
      <button
        onClick={actionButton.onClick}
        className="ai-insight-action"
      >
        {actionButton.label}
      </button>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FACILITY ASSET CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface FacilityAssetCardProps {
  name: string;
  tag: string;
  system: SystemType;
  location: string;
  status: 'Operational' | 'Maintenance Due' | 'Faulty';
  warrantyExpiry: string;
  maintenanceDate?: string;
}

export const FacilityAssetCard: React.FC<FacilityAssetCardProps> = ({
  name,
  tag,
  system,
  location,
  status,
  warrantyExpiry,
  maintenanceDate
}) => {
  const statusConfig = {
    'Operational': { className: 'asset-status-ok', label: 'Operational' },
    'Maintenance Due': { className: 'asset-status-due', label: 'Maintenance Due' },
    'Faulty': { className: 'asset-status-risk', label: 'Faulty' }
  };

  const config = statusConfig[status];

  return (
    <div className="facility-asset-card">
      <div className="facility-asset-card-head">
        <div>
          <h3>{name}</h3>
          <p>Tag: {tag}</p>
        </div>
        <SystemBadge system={system} />
      </div>

      <div className="facility-asset-fields">
        <div>
          <span>Location</span>
          <strong>{location}</strong>
        </div>
        <div>
          <span>Warranty Expires</span>
          <strong>{warrantyExpiry}</strong>
        </div>
        {maintenanceDate && (
          <div>
            <span>Next Maintenance</span>
            <strong>{maintenanceDate}</strong>
          </div>
        )}
      </div>

      <div className={`asset-status ${config.className}`}>
        {config.label}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SITE FINDING CARD
// ═══════════════════════════════════════════════════════════════════════════════

type SeverityType = 'Critical' | 'Moderate' | 'Info';

interface SiteFindingCardProps {
  finding: string;
  severity: SeverityType;
  room: string;
  system: SystemType;
  status: 'Open' | 'Resolved';
  evidence?: string;
}

export const SiteFindingCard: React.FC<SiteFindingCardProps> = ({
  finding,
  severity,
  room,
  system,
  status,
  evidence
}) => {
  const severityConfig = {
    'Critical': { className: 'site-finding-critical', icon: <AlertTriangle size={18} /> },
    'Moderate': { className: 'site-finding-moderate', icon: <AlertCircle size={18} /> },
    'Info': { className: 'site-finding-info', icon: <Info size={18} /> }
  };

  const config = severityConfig[severity];

  return (
    <div className={`site-finding-card ${config.className}`}>
      <div className="site-finding-head">
        <h3>{finding}</h3>
        {config.icon}
      </div>

      <p>{room} • {system}</p>

      <div className="site-finding-meta">
        <span>
          {severity}
        </span>
        <span>
          {status === 'Open' ? 'Open' : 'Resolved'}
        </span>
      </div>

      {evidence && (
        <p className="site-finding-evidence">
          Evidence: {evidence}
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINEERING INTELLIGENCE FLOW
// ═══════════════════════════════════════════════════════════════════════════════

interface EngineeringIntelligenceFlowProps {
  compact?: boolean;
}

const intelligenceFlowGroups = [
  {
    label: 'Project Inputs',
    icon: <Layers size={18} />,
    items: ['Floor Plans', 'Rooms', 'Requirements', 'BOQ', 'Site Photos', 'Documents']
  },
  {
    label: 'AI Engineering Agents',
    icon: <Cpu size={18} />,
    items: ['Design Agent', 'BOQ Agent', 'Site Agent', 'Claims Agent', 'Facility Agent', 'Compliance Agent']
  },
  {
    label: 'Engineering Outputs',
    icon: <ClipboardCheck size={18} />,
    items: ['Design Schedule', 'Calculations', 'BOQ', 'Report', 'Validation', 'Claims', 'Facility Twin']
  }
];

export const EngineeringIntelligenceFlow: React.FC<EngineeringIntelligenceFlowProps> = ({ compact = false }) => (
  <section className={`engineering-intelligence-flow ${compact ? 'compact' : ''}`} aria-label="SAQR AI product flow">
    {intelligenceFlowGroups.map((group, idx) => (
      <React.Fragment key={group.label}>
        <article className="intelligence-flow-group">
          <div className="intelligence-flow-head">
            <span>{group.icon}</span>
            <strong>{group.label}</strong>
          </div>
          <div className="intelligence-flow-tags">
            {group.items.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>
        {idx < intelligenceFlowGroups.length - 1 && (
          <div className="intelligence-flow-arrow" aria-hidden="true">
            <ArrowRight size={20} />
          </div>
        )}
      </React.Fragment>
    ))}
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════════
// AI AGENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

interface AgentCardProps {
  name: string;
  role: string;
  inputData: string[];
  outputData: string[];
  status: string;
  confidence: 'High' | 'Medium' | 'Low' | 'Needs Review';
  nextAction: string;
  icon: React.ReactNode;
  actionLabel: string;
  onAction?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  name,
  role,
  inputData,
  outputData,
  status,
  confidence,
  nextAction,
  icon,
  actionLabel,
  onAction
}) => (
  <article className="agent-card">
    <div className="agent-card-head">
      <div className="agent-card-icon">{icon}</div>
      <div>
        <h3>{name}</h3>
        <p>{role}</p>
      </div>
    </div>

    <div className="agent-card-status">
      <span>{status}</span>
      <ConfidenceMeter level={confidence} />
    </div>

    <div className="agent-card-data-grid">
      <div>
        <strong>Inputs</strong>
        {inputData.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
      </div>
      <div>
        <strong>Outputs</strong>
        {outputData.slice(0, 4).map((item) => <span key={item}>{item}</span>)}
      </div>
    </div>

    <p className="agent-card-next">{nextAction}</p>

    <button type="button" className="agent-card-action" onClick={onAction}>
      {actionLabel}
      <ArrowRight size={15} />
    </button>
  </article>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINEERING KNOWLEDGE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface FormulaCardProps {
  title: string;
  formula: string;
  purpose: string;
  definitions: Array<{ term: string; meaning: string }>;
  example: { title: string; steps: string[]; result: string };
  warning: string;
  usedInModule: string;
}

export const ReviewDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`review-disclaimer ${className}`}>
    <AlertTriangle size={17} />
    <p>Preliminary engineering output. Must be reviewed and approved by qualified engineers before procurement or construction.</p>
  </div>
);

export const EngineeringDefinition: React.FC<{ term: string; children: React.ReactNode }> = ({ term, children }) => (
  <div className="engineering-definition">
    <strong>{term}</strong>
    <p>{children}</p>
  </div>
);

export const CalculationExample: React.FC<{ title: string; steps: string[]; result: string }> = ({
  title,
  steps,
  result
}) => (
  <div className="calculation-example">
    <strong>{title}</strong>
    {steps.map((step) => <code key={step}>{step}</code>)}
    <span>{result}</span>
  </div>
);

export const FormulaCard: React.FC<FormulaCardProps> = ({
  title,
  formula,
  purpose,
  definitions,
  example,
  warning,
  usedInModule
}) => (
  <article className="formula-card">
    <div className="formula-card-head">
      <div>
        <span>Engineering Formula</span>
        <h3>{title}</h3>
      </div>
      <SystemBadge system={usedInModule.split(',')[0]} />
    </div>

    <p className="formula-purpose">{purpose}</p>
    <div className="formula-expression">{formula}</div>

    <div className="formula-definition-grid">
      {definitions.map((definition) => (
        <EngineeringDefinition key={definition.term} term={definition.term}>
          {definition.meaning}
        </EngineeringDefinition>
      ))}
    </div>

    <CalculationExample {...example} />

    <div className="formula-used">
      <strong>Where SAQR uses it</strong>
      <span>{usedInModule}</span>
    </div>

    <div className="formula-warning">
      <AlertTriangle size={15} />
      <span>{warning}</span>
    </div>
  </article>
);
