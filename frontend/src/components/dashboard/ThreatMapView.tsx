import React, { useState, useEffect } from 'react'
import { Globe2, Radio } from 'lucide-react'
import { threatService, type ThreatMapPoint } from '../../services/threats'

export const ThreatMapView: React.FC = () => {
  const [points, setPoints] = useState<ThreatMapPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<ThreatMapPoint | null>(null)

  useEffect(() => {
    threatService.getThreatMap()
      .then(res => {
        setPoints(res)
        if (res.length > 0) setSelectedPoint(res[0])
      })
      .catch(err => console.error("Error loading threat map:", err))
  }, [])

  // Approximate coordinate conversion to 2D SVG canvas percentages
  const latLonToPercent = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 100
    const y = ((90 - lat) / 180) * 100
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(8, Math.min(92, y)) }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#192837] to-[#0F172A] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#7342E2]/20 border border-[#7342E2]/30 flex items-center justify-center text-[#7342E2]">
            <Globe2 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight">
                Global Threat Vector Map
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Live Ingestion
              </span>
            </div>
            <p className="text-xs text-white/60 font-body mt-0.5">
              Geographic distribution of identified origin mail servers, relay nodes & exit proxies
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-medium text-white/70">
          ⚠️ Disclaimer: <span className="text-white font-semibold">IP-based approximate location</span>
        </div>
      </div>

      {/* Map Canvas & Live Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive World Map SVG Visualization */}
        <div className="lg:col-span-2 relative min-h-[420px] rounded-3xl bg-[#0B1120] border border-[#192837]/20 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
          {/* Subtle Grid Lines & Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#7342E2_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

          {/* SVG World Map Outline Graphic */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 1000 500" fill="none">
            <path
              d="M150,150 Q200,100 280,120 T350,180 T250,260 T180,220 Z M450,120 Q550,80 650,100 T800,160 T700,280 T500,250 Z M200,320 Q240,300 280,360 T220,440 Z M520,320 Q600,310 650,380 T580,450 Z M750,340 Q820,330 880,400 T780,440 Z"
              fill="#7342E2"
            />
          </svg>

          {/* Header overlay */}
          <div className="relative z-10 flex items-center justify-between text-xs text-white/60">
            <span className="font-mono flex items-center gap-1.5 font-semibold text-[#8B5CF6]">
              <Radio size={14} className="animate-pulse" />
              GLOBAL SURVEILLANCE RADAR
            </span>
            <span className="font-mono">{points.length} IDENTIFIED VECTORS</span>
          </div>

          {/* Animated Threat Vector Markers */}
          <div className="relative z-10 w-full h-[320px] my-auto">
            {points.map((pt, idx) => {
              const pos = latLonToPercent(pt.latitude, pt.longitude)
              const isSelected = selectedPoint?.ip === pt.ip
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPoint(pt)}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none"
                >
                  {/* Outer Pulsing Aura */}
                  <span className={`absolute -inset-2.5 rounded-full animate-ping opacity-60 ${
                    pt.fraud_score > 80 ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  
                  {/* Central Node */}
                  <span className={`relative w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-transform ${
                    isSelected ? 'scale-125 ring-4 ring-[#7342E2]' : 'hover:scale-110'
                  } ${pt.fraud_score > 80 ? 'bg-red-600' : 'bg-amber-500'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>

                  {/* Tooltip on hover */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="px-2.5 py-1 rounded-lg bg-black/90 text-white text-[10px] font-mono whitespace-nowrap shadow-md border border-white/10">
                      {pt.city}, {pt.country_code} ({pt.ip})
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Bottom stats overlay */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-white/50 border-t border-white/10 pt-3">
            <span>Projection: WGS84 Mercator Approx</span>
            <span className="text-[#8B5CF6] font-semibold">Active Threat Feed Nodes</span>
          </div>
        </div>

        {/* Selected Origin Telemetry Card */}
        <div className="rounded-3xl bg-white border border-[#192837]/10 p-6 flex flex-col justify-between shadow-sm">
          {selectedPoint ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#192837]/10">
                <div>
                  <span className="text-[10px] font-bold text-[#192837]/50 uppercase tracking-wider">Vector Telemetry</span>
                  <h3 className="font-heading text-lg font-bold text-[#192837] mt-0.5">
                    {selectedPoint.city}, {selectedPoint.country}
                  </h3>
                </div>
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-xl bg-red-100 text-red-700">
                  Fraud: {selectedPoint.fraud_score}/100
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-body">
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 flex justify-between items-center">
                  <span className="text-[#192837]/60">Source IP Address:</span>
                  <span className="font-mono font-bold text-[#7342E2]">{selectedPoint.ip}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 flex justify-between items-center">
                  <span className="text-[#192837]/60">Coordinates:</span>
                  <span className="font-mono">{selectedPoint.latitude}, {selectedPoint.longitude}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 flex justify-between items-center">
                  <span className="text-[#192837]/60">ASN Network:</span>
                  <span className="font-mono font-semibold">{selectedPoint.asn || 'AS13335'}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 flex justify-between items-center">
                  <span className="text-[#192837]/60">ISP Provider:</span>
                  <span className="font-semibold text-right max-w-[150px] truncate">{selectedPoint.isp || 'External Network'}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#192837]/10 flex justify-between items-center">
                  <span className="text-[#192837]/60">Anonymizer Checks:</span>
                  <span className="font-bold">
                    {selectedPoint.is_tor ? '🔴 Tor Node' : selectedPoint.is_vpn ? '🔴 VPN Proxy' : '🟢 Standard Route'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-[#192837]/50 leading-relaxed italic">
                  Note: Geolocation resolution derives from IP BGP routing table approximations, not physical client GPS hardware.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#192837]/50">
              Select any pulsing vector node on the map to inspect origin intelligence.
            </div>
          )}

          {/* Quick Filter List */}
          <div className="pt-4 border-t border-[#192837]/10">
            <span className="text-[10px] font-bold text-[#192837]/50 uppercase tracking-wider block mb-2">
              Detected Origin Nodes ({points.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {points.map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPoint(pt)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    selectedPoint?.ip === pt.ip
                      ? 'bg-[#7342E2] text-white'
                      : 'bg-[#FAF9F6] border border-[#192837]/10 text-[#192837]/70 hover:bg-[#7342E2]/10'
                  }`}
                >
                  {pt.country_code} • {pt.ip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThreatMapView
