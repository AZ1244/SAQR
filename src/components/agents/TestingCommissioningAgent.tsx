import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Shield,
  ListTodo
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface TestingProps {
  onNavigate: (tab: string) => void;
}

export const TestingCommissioningAgent: React.FC<TestingProps> = ({ onNavigate }) => {
  const [selectedSystem, setSelectedSystem] = useState<'lv' | 'earthing' | 'emergency' | 'cctv' | 'wifi' | 'access'>('lv');

  const systemsData = {
    lv: {
      name: 'LV Electrical Distribution',
      standard: 'IEC 60364-6 / BS 7671 Part 7',
      preInstall: [
        'Verify panel boards and switchboards are approved materials matching submittals.',
        'Ensure breakers are configured with correct current rating and trip curve class.',
        'Verify cable rolls are stored in a dry, covered area away from sunlight.',
        'Audit calibration status of testing instruments (Megger, loop tester, multimeters).'
      ],
      install: [
        'Check cable tray loading levels and check bending radius rules.',
        'Ensure proper cable segregation (300mm minimum between power and ELV).',
        'Verify glanding connections are secure and earthing braids are connected.',
        'Check phase identifications (Red, Yellow, Blue, Black/Blue) at terminations.',
        'Verify cable tags and circuit markers are installed according to schedules.'
      ],
      testing: [
        'Insulation Resistance (Megger test) at 1000V DC: core-to-core and core-to-earth (target ≥ 1.0 MΩ).',
        'Continuity and low-resistance bonding check of CPC and main earth bar.',
        'Phase rotation sequence verification (L1-L2-L3 clockwise sequence).',
        'RCD breaker trip time simulation under 1x, 2x, and 5x nominal current.',
        'Loop impedance (Zs) test at the farthest outlet node of every circuit.'
      ],
      commissioning: [
        'Energize incoming board and verify stable voltages under no-load condition.',
        'Perform thermographic infrared scan of busbars and lugs after 2 hours under load.',
        'Validate automatic changeover transfer logic from Main utility grid to Standby generator.',
        'Submit as-built circuit drawings and signed inspection protocols.'
      ]
    },
    earthing: {
      name: 'Earthing & Bonding System',
      standard: 'IEEE 80 / BS 7430',
      preInstall: [
        'Ensure earth rods are copper-clad steel core, min 15.0 microns copper depth.',
        'Check that soil enhancement compounds (bentonite/chemical) are available on site.',
        'Confirm earth disconnect links and pits matching drawings.'
      ],
      install: [
        'Drive earthing rods to design depth (2.4m minimum per rod).',
        'Inspect exothermically welded joints (Cadweld) for physical integrity.',
        'Ensure earth bonding conductor sizes match phase sizing rules.',
        'Verify earth chamber pits are flush with finished floor level.'
      ],
      testing: [
        'Measure earth electrode ground resistance using 3-Point Fall-of-Potential method.',
        'Verify total grounding resistance meets targets (≤ 1.0 Ω for telecom, ≤ 5.0 Ω for DBs).',
        'Earth conductor continuity checks between disconnect links and main earth bars.'
      ],
      commissioning: [
        'Perform soil moisture checks around pits during peak temperature period.',
        'Establish baseline values for annual compliance audits register.',
        'Confirm QCDD / Kahramaa inspector stamp approvals.'
      ]
    },
    emergency: {
      name: 'Emergency & Exit Lighting',
      standard: 'BS EN 1838 / QCDD Fire Regs',
      preInstall: [
        'Verify emergency fitting battery packs are fresh and within shelf life.',
        'Check directional sign graphics match QCDD escape route plans.',
        'Verify central battery CBS panel sizing specifications.'
      ],
      install: [
        'Verify fittings are located along escape routes, stairs, and exit doors.',
        'Ensure exit signs are visible from all points of corridor paths.',
        'Verify dedicated power circuit connections for emergency test switches.'
      ],
      testing: [
        'Simulate main grid power failure and verify auto-on transition within 1.0 second.',
        'Perform 3-hour duration continuous discharge test on all emergency battery packs.',
        'Measure workspace floor lux spreads (target ≥ 1.0 lx on escape centerline).'
      ],
      commissioning: [
        'Establish automated monthly functional test schedules on CBS controller.',
        'Deliver logbooks for manually operated testing keys panels.',
        'Certify exit routes are fully illuminated for fire officer inspection.'
      ]
    },
    cctv: {
      name: 'CCTV Surveillance System',
      standard: 'SSD / MOI Qatar security standards',
      preInstall: [
        'Check camera resolution, lens focal lengths, and focal parameters.',
        'Verify NVR servers hardware and storage HDD packages.',
        'Audit fiber switches and PoE injector wattages.'
      ],
      install: [
        'Position cameras to avoid extreme direct sunlight glare.',
        'Ensure mounts and brackets are structurally anchored to withstand wind load.',
        'Verify outdoor junctions boxes are IP66 weatherproof rated.'
      ],
      testing: [
        'Test camera connectivity and verify IP addressing allocations.',
        'Check image focus, field of view, and verify PPM (pixels on target) targets.',
        'Test night vision IR cut filters under low light conditions.'
      ],
      commissioning: [
        'Confirm NVR records continuously for 120 days minimum (MOI standard).',
        'Verify failover redundant storage servers takeover under network failures.',
        'Set up access privileges for security operations personnel.'
      ]
    },
    wifi: {
      name: 'Wi-Fi Wireless Networking',
      standard: 'IEEE 802.11ax / Enterprise targets',
      preInstall: [
        'Check AP models, ceiling mounting brackets, and PoE switch budgets.',
        'Confirm wireless network controller license permits AP count.'
      ],
      install: [
        'Mount APs horizontally on ceilings away from HVAC ducts or large structural pillars.',
        'Verify Cat6A patch cord connections are secure.'
      ],
      testing: [
        'Perform physical cable continuity and wiremap test of AP feeder runs.',
        'Verify DHCP servers assign correct IP addresses to wireless clients.'
      ],
      commissioning: [
        'Conduct wireless survey (Ekahau tool) to map RSSI signal levels.',
        'Validate channel allocation plan to prevent co-channel interference.',
        'Confirm seamless roaming handover as users walk between AP zones.'
      ]
    },
    access: {
      name: 'Access Control Security',
      standard: 'Security Access Control Guidelines',
      preInstall: [
        'Check magnetic lock holding force specifications (e.g. 600 lbs / 1200 lbs).',
        'Verify backup battery capacity matches controller enclosure guidelines.',
        'Ensure card reader formats match user security tokens.'
      ],
      install: [
        'Install magnetic locks and strikes, ensuring physical alignment.',
        'Route emergency override push buttons within standard heights (1.2m).',
        'Install door contacts and request-to-exit PIR sensors.'
      ],
      testing: [
        'Test card read validation: verify entry and event logging in software.',
        'Verify magnetic lock releases automatically upon fire alarm contact signal.',
        'Test battery backup autonomy: run controller for 4 hours without mains power.'
      ],
      commissioning: [
        'Validate fail-safe vs fail-secure operation under total power loss.',
        'Configure doors anti-passback rules and timezone authorization maps.',
        'Handover system master card and operational database backups.'
      ]
    }
  };

  const currentData = useMemo(() => {
    return systemsData[selectedSystem];
  }, [selectedSystem]);

  return (
    <div className="p-6 text-slate-100 overflow-y-auto h-full space-y-6 bg-[#07111F]">
      {/* Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => onNavigate('hub')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Engineering Agents Hub
        </button>
        <span className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full border border-amber-500/20">
          Testing & Commissioning Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          Testing & Commissioning (T&C) Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Generates system-specific field inspections checklist, testing protocols, pre-commissioning guidelines, and handover dossiers.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left selector */}
        <div className="space-y-4">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Select System Protocol</span>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(systemsData) as Array<keyof typeof systemsData>).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedSystem(key)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-semibold border transition-all ${selectedSystem === key ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'bg-slate-950 border-white/5 text-slate-300 hover:text-white'}`}
                >
                  {systemsData[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 text-xs space-y-2">
            <span className="text-slate-500 font-bold block uppercase tracking-wider text-[9px]">Standard References</span>
            <div className="bg-slate-950 p-3 rounded border border-white/5">
              <span className="text-amber-400 font-bold block mb-1">Applicable Code</span>
              <p className="text-slate-300">{currentData.standard}</p>
            </div>
          </div>
        </div>

        {/* Right lists display */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-6">
            <div className="border-b border-white/5 pb-4">
              <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 uppercase tracking-wider font-semibold">T&C Submittal Protocol</span>
              <h3 className="text-base font-bold text-white mt-2">{currentData.name} - Quality Assurance</h3>
            </div>

            {/* Pre-installation */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" /> Stage 1: Pre-Installation Inspection Checks
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {currentData.preInstall.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-950/60 p-3 rounded border border-white/5 text-xs text-slate-300">
                    <input type="checkbox" className="mt-0.5 rounded border-white/10 bg-transparent text-amber-500 focus:ring-0 focus:ring-offset-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Installation */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" /> Stage 2: Physical Installation Inspection Checks
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {currentData.install.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-950/60 p-3 rounded border border-white/5 text-xs text-slate-300">
                    <input type="checkbox" className="mt-0.5 rounded border-white/10 bg-transparent text-cyan-500 focus:ring-0 focus:ring-offset-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Testing */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" /> Stage 3: Field Electrical & Signal Testing
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {currentData.testing.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-950/60 p-3 rounded border border-white/5 text-xs text-slate-300">
                    <input type="checkbox" className="mt-0.5 rounded border-white/10 bg-transparent text-purple-500 focus:ring-0 focus:ring-offset-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commissioning */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" /> Stage 4: Functional Testing & Final Commissioning
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {currentData.commissioning.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-950/60 p-3 rounded border border-white/5 text-xs text-slate-300">
                    <input type="checkbox" className="mt-0.5 rounded border-white/10 bg-transparent text-emerald-500 focus:ring-0 focus:ring-offset-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center italic">
              * T&C checklists must be executed on site by certified testing engineers and witness representatives from client/consultant.
            </p>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
