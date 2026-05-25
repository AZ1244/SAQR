/**
 * SAQR AI - Premium Landing Page
 *
 * Makes the product promise visible in the first viewport:
 * project inputs become engineering intelligence.
 */

import {
  ArrowRight,
  Building2,
  Camera,
  ClipboardCheck,
  Cpu,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  Network,
  ShieldCheck,
  Upload,
  Zap
} from 'lucide-react';
import { SaqrLogo } from './brand/SaqrLogo';
import { EngineeringIntelligenceVisual } from './EngineeringIntelligenceVisual';
import { BlueprintBackground, EngineeringIntelligenceFlow, SAQRFlow, SystemBadge } from './designSystem';

interface LandingPageProps {
  onLaunchApp: () => void;
  lang: 'EN' | 'AR';
  setLang: (lang: 'EN' | 'AR') => void;
  totalBOQValue: number;
}

export const LandingPageComponent: React.FC<LandingPageProps> = ({
  onLaunchApp,
  lang,
  setLang
}) => {
  const isArabic = lang === 'AR';
  const demoBOQValue = 116375;

  const flowSteps = [
    { title: 'Upload Floor Plan', icon: <Upload size={18} /> },
    { title: 'Generate Engineering Design', icon: <Cpu size={18} /> },
    { title: 'Create BOQ', icon: <FileSpreadsheet size={18} /> },
    { title: 'Validate Site', icon: <Camera size={18} /> },
    { title: 'Build Facility Twin', icon: <ClipboardCheck size={18} /> }
  ];

  const valueCards = [
    {
      title: 'Floor Plan to Design',
      desc: 'Generate lighting, power, data, CCTV, Wi-Fi, access control, and BMS concepts.',
      icon: <Lightbulb size={26} />
    },
    {
      title: 'Design to BOQ',
      desc: 'Convert engineering assumptions into editable BOQ quantities and estimated cost.',
      icon: <FileSpreadsheet size={26} />
    },
    {
      title: 'Site Photo to Validation',
      desc: 'Identify missing labels, incomplete work, installation notes, and engineer review items.',
      icon: <Camera size={26} />
    },
    {
      title: 'Handover to Facility Twin',
      desc: 'Convert project outputs into assets, warranties, maintenance schedules, and QR-ready records.',
      icon: <Building2 size={26} />
    }
  ];

  return (
    <BlueprintBackground>
      <div className={`landing-shell ${isArabic ? 'landing-rtl' : ''}`}>
        <header className="landing-header">
          <SaqrLogo variant="full" tone="light" />

          <div className="landing-header-actions">
            <button type="button" className="landing-language-button" onClick={() => setLang(lang === 'EN' ? 'AR' : 'EN')}>
              {lang === 'EN' ? 'العربية' : 'English'}
            </button>
            <button type="button" className="landing-header-cta" onClick={onLaunchApp}>
              Launch Engineering Command Center
            </button>
          </div>
        </header>

        <main>
          <section className="landing-hero">
            <div className="landing-hero-copy">
              <div className="landing-eyebrow">
                <Cpu size={15} />
                <span>AI-powered MEP/ELV intelligence for GCC projects</span>
              </div>

              <h1>The AI Engineering Brain for GCC Infrastructure</h1>
              <p className="landing-subheadline">
                SAQR AI transforms room data, BOQs, site photos, and project documents into preliminary engineering designs, cost estimates, reports, validation insights, and facility handover intelligence.
              </p>

              <div className="landing-cta-row">
                <button type="button" className="landing-primary-cta" onClick={onLaunchApp}>
                  Launch Engineering Command Center
                  <ArrowRight size={18} />
                </button>
                <button type="button" className="landing-secondary-cta" onClick={onLaunchApp}>
                  View Doha Demo Project
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="landing-proof-row">
                <span><ShieldCheck size={15} /> GCC enterprise-grade</span>
                <span><Network size={15} /> Live backend data</span>
                <span><FileText size={15} /> Engineer review workflow</span>
              </div>
            </div>

            <EngineeringIntelligenceVisual />
          </section>

          <section className="landing-flow-section">
            <div className="landing-section-heading">
              <span>Product Flow</span>
              <h2>Project inputs become coordinated engineering outputs.</h2>
            </div>
            <EngineeringIntelligenceFlow />
          </section>

          <section className="landing-flow-section landing-flow-section-compact">
            <div className="landing-section-heading">
              <span>Workflow</span>
              <h2>Upload project data. Generate engineering intelligence.</h2>
            </div>
            <SAQRFlow steps={flowSteps} />
          </section>

          <section className="landing-value-section">
            <div className="landing-section-heading">
              <span>Core Capabilities</span>
              <h2>From concept design to handover operations</h2>
            </div>

            <div className="landing-value-grid">
              {valueCards.map((card) => (
                <article key={card.title} className="landing-value-card">
                  <div>{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-demo-section">
            <div className="landing-demo-card">
              <div>
                <span className="landing-demo-kicker">Live Demo Preview</span>
                <h2>Doha Smart Office Fit-Out</h2>
                <p>Investor-ready walkthrough using live project modules, not disconnected mock screens.</p>
              </div>

              <div className="landing-demo-stats">
                <div><span>Project</span><strong>Doha Smart Office Fit-Out</strong></div>
                <div><span>Area</span><strong>1,000 sqm</strong></div>
                <div><span>Rooms</span><strong>12</strong></div>
                <div><span>BOQ Value</span><strong>QAR {demoBOQValue.toLocaleString()}</strong></div>
              </div>

              <div className="landing-demo-systems">
                <SystemBadge system="Lighting" />
                <SystemBadge system="Power" />
                <SystemBadge system="Data" />
                <SystemBadge system="CCTV" />
                <SystemBadge system="Wi-Fi" />
                <SystemBadge system="Access Control" />
                <SystemBadge system="BMS" />
              </div>

              <button type="button" className="landing-primary-cta landing-demo-button" onClick={onLaunchApp}>
                View Doha Demo Project
                <ArrowRight size={18} />
              </button>
            </div>
          </section>

          <section className="landing-safety-strip">
            <Zap size={16} />
            <span>All SAQR AI outputs are preliminary and require licensed engineer review before construction or procurement.</span>
          </section>
        </main>
      </div>
    </BlueprintBackground>
  );
};
