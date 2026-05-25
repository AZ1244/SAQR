import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Camera,
  AlertTriangle,
  TrendingUp,
  FileText,
  Trash2
} from 'lucide-react';
import { ReviewDisclaimer } from '../designSystem';

interface CameraItem {
  id: string;
  location: string;
  resolution: '2MP' | '4MP' | '8MP_4K';
  type: 'dome' | 'bullet' | 'ptz';
  fovDegrees: number;
  distanceM: number;
  qty: number;
}

interface CCTVProps {
  onNavigate: (tab: string) => void;
}

export const CCTVAgent: React.FC<CCTVProps> = ({ onNavigate }) => {
  const [compression, setCompression] = useState<'H264' | 'H265'>('H265');
  const [retentionDays, setRetentionDays] = useState(120); // 120 days (Qatar SSD/MOI default requirement)
  const [fps, setFps] = useState(15); // typical security frame rate

  const [cameras, setCameras] = useState<CameraItem[]>([
    { id: '1', location: 'Main Entrance Lobby', resolution: '4MP', type: 'dome', fovDegrees: 85, distanceM: 12, qty: 2 },
    { id: '2', location: 'West Car Park Gate', resolution: '4MP', type: 'bullet', fovDegrees: 60, distanceM: 25, qty: 4 },
    { id: '3', location: 'Perimeter Boundary North', resolution: '4MP', type: 'bullet', fovDegrees: 80, distanceM: 30, qty: 6 },
    { id: '4', location: 'Server Room Security', resolution: '8MP_4K', type: 'dome', fovDegrees: 95, distanceM: 6, qty: 2 },
    { id: '5', location: 'Main Reception PTZ', resolution: '4MP', type: 'ptz', fovDegrees: 60, distanceM: 15, qty: 1 }
  ]);

  const addCamera = () => {
    const newId = (cameras.length + 1).toString();
    setCameras([...cameras, {
      id: newId,
      location: `New Camera Area ${newId}`,
      resolution: '4MP',
      type: 'dome',
      fovDegrees: 80,
      distanceM: 15,
      qty: 1
    }]);
  };

  const removeCamera = (id: string) => {
    setCameras(cameras.filter(c => c.id !== id));
  };

  const updateCameraField = (id: string, field: keyof CameraItem, value: any) => {
    setCameras(cameras.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const calculated = useMemo(() => {
    let totalCameraCount = 0;
    let totalBandwidthMbps = 0;
    let totalPoEWattage = 0;

    const cameraDetails = cameras.map(c => {
      totalCameraCount += c.qty;

      // Base bitrate estimate in Mbps for H.265 at 15fps:
      // 2MP: ~1.5 Mbps, 4MP: ~3.0 Mbps, 8MP/4K: ~6.0 Mbps
      // H.264 doubles these values
      let baseBitrate = 0;
      if (c.resolution === '2MP') baseBitrate = 1.5;
      else if (c.resolution === '4MP') baseBitrate = 3.0;
      else baseBitrate = 6.0;

      if (compression === 'H264') {
        baseBitrate *= 1.8; // H.264 multiplier
      }

      // Adjustment for fps (standard reference at 15fps)
      const fpsRatio = fps / 15;
      const cameraBitrate = baseBitrate * fpsRatio;

      totalBandwidthMbps += cameraBitrate * c.qty;

      // PoE wattage sizing:
      // Dome/Bullet typical = 8W, PTZ = 25W (due to motors and heater)
      const powerPerCamera = c.type === 'ptz' ? 25 : 8;
      totalPoEWattage += powerPerCamera * c.qty;

      // Field of view width at distance D
      // W = 2 * D * tan(theta / 2)
      const rad = (c.fovDegrees * Math.PI) / 180;
      const fovWidthM = 2 * c.distanceM * Math.tan(rad / 2);

      // Resolution Width (pixels)
      let resWidthPixels = 2688; // 4MP typical
      if (c.resolution === '2MP') resWidthPixels = 1920;
      else if (c.resolution === '8MP_4K') resWidthPixels = 3840;

      // Pixels Per Meter (PPM) at target distance
      const ppmAtDistance = fovWidthM > 0 ? resWidthPixels / fovWidthM : 0;

      // Classify level (EN 62676-4):
      // ≥ 250 PPM: Identification, ≥ 125 PPM: Recognition, ≥ 62 PPM: Detection
      let trackingClass = 'Monitor';
      if (ppmAtDistance >= 250) trackingClass = 'Identification (ID)';
      else if (ppmAtDistance >= 125) trackingClass = 'Recognition';
      else if (ppmAtDistance >= 62) trackingClass = 'Detection';

      return {
        ...c,
        cameraBitrate,
        fovWidthM,
        ppmAtDistance,
        trackingClass
      };
    });

    // Storage Sizing (TB)
    // Storage = (Mbps * 3600 * 24 * Days) / (8 * 1,000,000)
    // 1 TB = 1,000,000,000,000 bytes (typical HDD formatting values used by system manufacturers)
    const storageBytes = (totalBandwidthMbps * 1000000 * 3600 * 24 * retentionDays) / 8;
    const storageTb = storageBytes / Math.pow(10, 12);

    // Recommended PoE Switch
    const switchCount = Math.ceil(totalCameraCount / 24) || 1;

    // Warnings
    const warnings: string[] = [];
    if (retentionDays > 90 && compression === 'H264') {
      warnings.push(`Warning: High retention period (${retentionDays} days) with H.264 compression creates large storage demand. Switching to H.265 is highly recommended to cut storage footprint by 45%.`);
    }
    const lowPpmCameras = cameraDetails.filter(c => c.ppmAtDistance < 62);
    if (lowPpmCameras.length > 0) {
      warnings.push(`${lowPpmCameras.length} camera(s) have targets below standard 62 PPM (Detection limit). Consider increasing camera resolution or choosing a narrower FOV angle lens.`);
    }

    // BOQ Items
    const boqItems = [
      {
        code: `QCS-SEC-NVR-${totalCameraCount}CH`,
        desc: `IP Network Video Recorder, ${totalCameraCount > 32 ? '64' : '32'}-channel, RAID-5 redundant disk groups controller, dual GigE network interfaces.`,
        qty: 1,
        unit: 'Set',
        rate: 5500
      },
      {
        code: `QCS-SEC-HDD-SATA`,
        desc: `Enterprise-grade surveillance CCTV SATA Hard Disk Drive, 8TB capacity, 24/7 write duty cycles.`,
        qty: Math.ceil(storageTb / 8) || 1,
        unit: 'Nos',
        rate: 980
      },
      {
        code: `QCS-SEC-POE-SW24`,
        desc: `24-port Gigabit Managed PoE+ Ethernet Switch, IEEE 802.3at standard, 370W total PoE power budget.`,
        qty: switchCount,
        unit: 'Nos',
        rate: 1850
      }
    ];

    cameras.forEach(c => {
      const existing = boqItems.find(item => item.code === `QCS-SEC-CAM-${c.resolution}`);
      if (existing) {
        existing.qty += c.qty;
      } else {
        boqItems.push({
          code: `QCS-SEC-CAM-${c.resolution}`,
          desc: `IP Outdoor Vandal-resistant ${c.type === 'ptz' ? 'Pan-Tilt-Zoom (PTZ) speed dome' : 'Fixed network'} camera, ${c.resolution} resolution, H.265, IR distance 30m, IP66.`,
          qty: c.qty,
          unit: 'Nos',
          rate: c.type === 'ptz' ? 1800 : c.resolution === '8MP_4K' ? 750 : 420
        });
      }
    });

    return {
      cameraDetails,
      totalCameraCount,
      totalBandwidthMbps,
      totalPoEWattage,
      storageTb,
      warnings,
      boqItems
    };
  }, [cameras, compression, retentionDays, fps]);

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
          CCTV Sizing Agent
        </span>
      </div>

      <ReviewDisclaimer />

      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Camera className="w-6 h-6 text-amber-400" />
          CCTV System Sizing & Storage Agent
        </h2>
        <p className="text-slate-400 text-sm">
          Calculates network camera field of views, pixels per meter (PPM) densities, network recording bandwidths, NVR storage arrays, and switch power requirements.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">1. System Recording Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Video Codec Standard</label>
                <select
                  value={compression}
                  onChange={(e) => setCompression(e.target.value as any)}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="H264">H.264 Legacy (Standard)</option>
                  <option value="H265">H.265 HEVC (Highly Recommended)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Frame Rate (FPS)</label>
                <input
                  type="number"
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold block">Required Retention (Days)</label>
                <input
                  type="number"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded p-2 text-white focus:outline-none"
                />
                <span className="text-[9px] text-slate-500 block">Qatar SSD: 120 Days</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">2. CCTV Camera Positioning Schedule</h3>
              <button
                onClick={addCamera}
                className="flex items-center gap-1 py-1 px-3 rounded bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-600 transition-all"
              >
                + Add Camera Node
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2 px-3">Location / Field Tag</th>
                    <th className="py-2 px-3">Resolution</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Focal FOV (°)</th>
                    <th className="py-2 px-3">Target Distance (m)</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cameras.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={c.location}
                          onChange={(e) => updateCameraField(c.id, 'location', e.target.value)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={c.resolution}
                          onChange={(e) => updateCameraField(c.id, 'resolution', e.target.value as any)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        >
                          <option value="2MP">2MP (1080p)</option>
                          <option value="4MP">4MP (QHD)</option>
                          <option value="8MP_4K">8MP (4K UHD)</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={c.type}
                          onChange={(e) => updateCameraField(c.id, 'type', e.target.value as any)}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        >
                          <option value="dome">Dome Fixed</option>
                          <option value="bullet">Bullet Fixed</option>
                          <option value="ptz">PTZ Speed Dome</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={c.fovDegrees}
                          onChange={(e) => updateCameraField(c.id, 'fovDegrees', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={c.distanceM}
                          onChange={(e) => updateCameraField(c.id, 'distanceM', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={c.qty}
                          onChange={(e) => updateCameraField(c.id, 'qty', Number(e.target.value))}
                          className="bg-slate-950 border border-white/5 rounded px-2 py-1 text-white text-xs w-full focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => removeCamera(c.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              <TrendingUp className="w-4 h-4" /> CCTV Bandwidth & Storage
            </h3>

            {calculated.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-lg space-y-1.5">
                {calculated.warnings.map((w, idx) => (
                  <p key={idx} className="text-[10px] text-amber-400 leading-tight flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Camera Nodes</span>
                <span className="text-lg font-bold text-white">{calculated.totalCameraCount} units</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Total Bandwidth</span>
                <span className="text-lg font-bold text-white">{calculated.totalBandwidthMbps.toFixed(1)} Mbps</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Storage Required</span>
                <span className="text-lg font-bold text-amber-400">{calculated.storageTb.toFixed(1)} TB</span>
                <span className="text-[9px] text-slate-400 block">Sized for {retentionDays} Days</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-white/5">
                <span className="text-slate-500 font-semibold block">Total PoE Switch Load</span>
                <span className="text-lg font-bold text-white">{calculated.totalPoEWattage} W</span>
              </div>
            </div>

            {/* Individual Camera PPM metrics list */}
            <div className="bg-slate-950 p-4 rounded-lg border border-white/10 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Pixels on Target (PPM Check)</span>
              <div className="space-y-1 text-[10.5px]">
                {calculated.cameraDetails.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="text-slate-400 truncate max-w-[150px]">{c.location}</span>
                    <span className={`font-bold ${c.ppmAtDistance >= 250 ? 'text-emerald-400' : c.ppmAtDistance >= 62 ? 'text-cyan-400' : 'text-rose-400'}`}>
                      {c.ppmAtDistance.toFixed(0)} PPM ({c.trackingClass})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOQ Preview */}
          <div className="bg-slate-900/40 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> BOQ Line Items (Preliminary)
            </h3>
            
            <div className="space-y-3">
              {calculated.boqItems.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded border border-white/5 text-[11px] space-y-1">
                  <div className="flex justify-between font-mono text-cyan-400">
                    <span>{item.code}</span>
                    <span>QAR {(item.rate * item.qty).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-300 leading-snug">{item.desc}</p>
                  <div className="flex justify-between text-slate-500 text-[9px] pt-1">
                    <span>Qty: {item.qty} {item.unit}</span>
                    <span>Rate: QAR {item.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Formulas */}
      <div className="bg-slate-900/40 p-6 rounded-xl border border-white/5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Engineering Formulas & References</h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Field of View lens width calculation</strong>
            <code className="block py-1 px-2 my-1 bg-slate-900 border border-white/5 rounded text-amber-400">Width_M = 2 × Distance × tan ( FOV_Angle / 2 )</code>
            <p className="text-slate-400 text-[11px]">Computes the horizontal width of video coverage at a specific physical monitoring distance from the lens location.</p>
          </div>
          <div className="p-3 bg-slate-950 rounded border border-white/5 space-y-1">
            <strong className="text-white">Pixels Per Meter (PPM) Target Sizing (EN 62676-4 standards)</strong>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] mt-1">
              <li>PPM = Resolution_Width_Pixels / Width_M</li>
              <li>≥ 250 PPM: Identification (Required for faces and plates validation)</li>
              <li>≥ 125 PPM: Recognition (Confirming details and clothing profiles)</li>
              <li>≥ 62 PPM: Detection (Locating a human presence inside frame boundaries)</li>
            </ul>
          </div>
        </div>
      </div>

      <ReviewDisclaimer />
    </div>
  );
};
