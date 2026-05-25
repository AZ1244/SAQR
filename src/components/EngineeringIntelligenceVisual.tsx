import {
  Building2,
  Camera,
  Cpu,
  FileText,
  Lightbulb,
  Network,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap
} from 'lucide-react';

const floatingSystems = [
  { label: 'Design Agent', icon: <Lightbulb size={15} />, className: 'ei-node-lighting' },
  { label: 'BOQ Agent', icon: <FileText size={15} />, className: 'ei-node-power' },
  { label: 'Data + ELV', icon: <Network size={15} />, className: 'ei-node-data' },
  { label: 'Site Agent', icon: <Camera size={15} />, className: 'ei-node-cctv' },
  { label: 'Wi-Fi', icon: <Wifi size={15} />, className: 'ei-node-wifi' },
  { label: 'Compliance', icon: <ShieldCheck size={15} />, className: 'ei-node-access' },
  { label: 'Claims', icon: <Zap size={15} />, className: 'ei-node-boq' },
  { label: 'Facility Twin', icon: <RadioTower size={15} />, className: 'ei-node-report' }
];

export function EngineeringIntelligenceVisual() {
  return (
    <div className="ei-visual" aria-label="SAQR AI engineering intelligence model">
      <div className="ei-visual-grid" />
      <div className="ei-scanline" />

      <div className="ei-visual-topbar">
        <div>
          <span className="ei-kicker">Live Engineering Model</span>
          <strong>Project Data → Engineering Intelligence</strong>
        </div>
        <span className="ei-status-pill">AI rules active</span>
      </div>

      <div className="ei-model-wrap">
        <div className="ei-side-panel ei-side-panel-left">
          <span>Input</span>
          <strong>Floor Plan + Rooms</strong>
          <small>Area, occupancy, ceiling, system intent</small>
        </div>

        <div className="ei-scene" aria-hidden="true">
          <div className="ei-floor ei-floor-shadow" />
          <div className="ei-floor ei-floor-base">
            <svg className="ei-floor-plan" viewBox="0 0 460 300">
              <defs>
                <linearGradient id="eiCyanStroke" x1="0" x2="1">
                  <stop stopColor="#22D3EE" stopOpacity="0.1" />
                  <stop offset="1" stopColor="#22D3EE" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="eiGoldStroke" x1="0" x2="1">
                  <stop stopColor="#D6A84F" stopOpacity="0.15" />
                  <stop offset="1" stopColor="#D6A84F" stopOpacity="0.95" />
                </linearGradient>
              </defs>

              <path d="M36 42H422V252H36Z" className="ei-plan-shell" />
              <path d="M42 104H174V246H42Z M190 104H322V246H190Z M338 104H416V246H338Z M42 48H142V92H42Z M158 48H416V92H158Z" className="ei-plan-rooms" />
              <path d="M82 68H112M210 68H256M282 68H338M74 142H126M228 142H284M360 142H394M82 206H126M218 206H292M356 206H398" className="ei-plan-circuits" />
              <path d="M230 150C158 112 96 134 76 176M230 150C278 94 338 86 392 118M230 150C284 204 348 222 392 198M230 150C176 218 118 218 74 198" className="ei-plan-data-lines" />

              <circle cx="82" cy="68" r="5" className="ei-point ei-point-gold" />
              <circle cx="210" cy="68" r="5" className="ei-point ei-point-cyan" />
              <circle cx="338" cy="68" r="5" className="ei-point ei-point-cyan" />
              <circle cx="74" cy="142" r="5" className="ei-point ei-point-gold" />
              <circle cx="284" cy="142" r="5" className="ei-point ei-point-cyan" />
              <circle cx="394" cy="142" r="5" className="ei-point ei-point-gold" />
              <circle cx="126" cy="206" r="5" className="ei-point ei-point-cyan" />
              <circle cx="356" cy="206" r="5" className="ei-point ei-point-gold" />
            </svg>

            <div className="ei-layer ei-layer-gold" />
            <div className="ei-layer ei-layer-cyan" />
            <div className="ei-core">
              <Cpu size={28} />
              <span>AI</span>
            </div>

            {floatingSystems.map((node) => (
              <div key={node.label} className={`ei-node ${node.className}`}>
                {node.icon}
                <span>{node.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ei-side-panel ei-side-panel-right">
          <span>Output</span>
          <strong>Design + BOQ + Twin</strong>
          <small>Cost, QA, claims, handover intelligence</small>
        </div>
      </div>

      <div className="ei-flow-strip">
        <span><Building2 size={14} /> Floor Plan</span>
        <span><Cpu size={14} /> AI Design Engine</span>
        <span><Zap size={14} /> Lighting + Power + ELV</span>
        <span><FileText size={14} /> BOQ + Report</span>
        <span><Camera size={14} /> Site Validation</span>
        <span><Sparkles size={14} /> Facility Twin</span>
      </div>
    </div>
  );
}
