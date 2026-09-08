import React, { useState, useEffect } from 'react'
import { Globe2, Radio, Layers, MapPin, Info } from 'lucide-react'
import { threatService, type ThreatMapPoint } from '../../services/threats'
import { Map, MapControls, MapMarker, MAP_STYLES } from '../ui/map'
import ForensicsModal from './ForensicsModal'

export const ThreatMapView: React.FC = () => {
  const [points, setPoints] = useState<ThreatMapPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<ThreatMapPoint | null>(null)
  const [activeStyle, setActiveStyle] = useState<keyof typeof MAP_STYLES>('darkCyber')
  const [mapCenter, setMapCenter] = useState<[number, number]>([15, 25])
  const [mapZoom, setMapZoom] = useState<number>(1.8)
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null)

  useEffect(() => {
    threatService.getThreatMap()
      .then(res => {
        setPoints(res)
        if (res.length > 0) {
          setSelectedPoint(res[0])
          setMapCenter([res[0].longitude, res[0].latitude])
        }
      })
      .catch(err => console.error("Error loading threat map:", err))
  }, [])

  const handleSelectNode = (pt: ThreatMapPoint) => {
    setSelectedPoint(pt)
    setMapCenter([pt.longitude, pt.latitude])
    setMapZoom(4.5)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="p-6 rounded-3xl bg-[#111111] border border-[#2A2A2A] text-[#F5F5F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-[#2A2A2A] flex items-center justify-center text-[#FF1E2D] shadow-sm">
            <Globe2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5]">
                Global Threat Vector Map
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF1E2D]/10 text-[#FF1E2D] border border-[#FF1E2D]/30 text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF1E2D] animate-ping" />
                Live Ingestion
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] font-body mt-0.5">
              Geographic distribution of identified origin mail servers, relay nodes & exit proxies via MapLibre GL
            </p>
          </div>
        </div>

        {/* Basemap Switcher & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-2xl border border-[#2A2A2A] text-xs">
            <Layers size={13} className="text-[#FF1E2D] ml-1.5 mr-0.5" />
            {(['darkCyber', 'darkMatter', 'voyager', 'osm'] as const).map(styleKey => (
              <button
                key={styleKey}
                type="button"
                onClick={() => setActiveStyle(styleKey)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  activeStyle === styleKey
                    ? 'bg-[#E50914] text-white shadow-sm'
                    : 'text-[#737373] hover:text-[#F5F5F5] hover:bg-[#222222]'
                }`}
              >
                {styleKey === 'darkCyber' ? 'Dark SOC' : styleKey === 'darkMatter' ? 'Carto Dark' : styleKey === 'voyager' ? 'Voyager' : 'OSM'}
              </button>
            ))}
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-[#181818] border border-[#2A2A2A] text-[11px] font-medium text-[#737373] flex items-center gap-1.5 shadow-sm">
            <Info size={13} className="text-[#FF1E2D] shrink-0" />
            <span>Approximate IP-based location</span>
          </div>
        </div>
      </div>

      {/* Main Map & Live Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive MapLibre GL / mapcn Map Container */}
        <div className="lg:col-span-2 relative min-h-[480px] rounded-3xl bg-[#111111] border border-[#2A2A2A] p-2 overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="relative w-full h-[470px] rounded-2xl overflow-hidden border border-[#2A2A2A]">
            <Map
              center={mapCenter}
              zoom={mapZoom}
              mapStyle={MAP_STYLES[activeStyle]}
              className="w-full h-full"
            >
              <MapControls position="top-right" />

              {/* Render dynamic interactive markers for every detected threat IP */}
              {points.map((pt, idx) => {
                const isSelected = selectedPoint?.ip === pt.ip
                const isHighRisk = (pt.fraud_score || 0) >= 75

                return (
                  <MapMarker
                    key={idx}
                    coordinates={[pt.longitude, pt.latitude]}
                    onClick={() => handleSelectNode(pt)}
                  >
                    <div className="relative -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none">
                      {/* Pulsing Outer Ring */}
                      <span className={`absolute -inset-2.5 rounded-full animate-ping opacity-75 ${
                        isHighRisk ? 'bg-[#FF1E2D]' : 'bg-[#FFB020]'
                      }`} />

                      {/* Central Pin */}
                      <div className={`relative px-2 py-1 rounded-full flex items-center gap-1 shadow-md border-2 border-[#111111] transition-all transform ${
                        isSelected
                          ? 'scale-125 ring-4 ring-[#FF1E2D] z-30'
                          : 'hover:scale-110 z-10'
                      } ${isHighRisk ? 'bg-[#E50914] text-white' : 'bg-[#FFB020] text-black font-bold'}`}>
                        <MapPin size={11} className="shrink-0" />
                        <span className="text-[10px] font-mono font-extrabold">{pt.country_code}</span>
                      </div>

                      {/* Floating Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-40 pointer-events-none">
                        <div className="px-2.5 py-1.5 rounded-xl bg-[#0A0A0A] text-[#F5F5F5] text-[11px] font-mono whitespace-nowrap shadow-xl border border-[#2A2A2A]">
                          <span className="font-bold text-[#FF1E2D] block">{pt.city}, {pt.country}</span>
                          <span className="text-[#A3A3A3]">{pt.ip} • Fraud: {pt.fraud_score}/100</span>
                        </div>
                      </div>
                    </div>
                  </MapMarker>
                )
              })}
            </Map>
          </div>

          {/* Bottom Bar overlay */}
          <div className="p-3 bg-[#0A0A0A] rounded-2xl mt-2 border border-[#2A2A2A] flex items-center justify-between text-xs text-[#737373]">
            <span className="font-mono flex items-center gap-1.5 font-semibold text-[#FF1E2D]">
              <Radio size={14} className="animate-pulse" />
              ESRI DARK CANVAS / MAPLIBRE GL
            </span>
            <span className="font-mono font-bold text-[#F5F5F5]">{points.length} ACTIVE THREAT VECTORS INGESTED</span>
          </div>
        </div>

        {/* Selected Origin Telemetry Card */}
        <div className="rounded-3xl bg-[#111111] border border-[#2A2A2A] p-6 flex flex-col justify-between shadow-sm space-y-4 text-[#F5F5F5]">
          {selectedPoint ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
                <div>
                  <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Vector Telemetry</span>
                  <h3 className="font-heading text-lg font-bold text-[#F5F5F5] mt-0.5">
                    {selectedPoint.city}, {selectedPoint.country}
                  </h3>
                </div>
                <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-xl bg-[#FF1E2D]/15 text-[#FF1E2D] border border-[#FF1E2D]/30">
                  Fraud: {selectedPoint.fraud_score}/100
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-body">
                {/* Monitored User Account Details */}
                <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#2A2A2A] space-y-1.5 shadow-xs">
                  <span className="text-[10px] font-extrabold text-[#FF1E2D] uppercase tracking-wider block">
                    Target Monitored User Account
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-[#F5F5F5] font-mono">
                      {selectedPoint.user_email || 'yamunak972006@gmail.com'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF1E2D]/15 text-[#FF1E2D] text-[10px] font-bold">
                      Enterprise User
                    </span>
                  </div>
                </div>

                {/* Email & Threat Incident Details */}
                <div className="p-3.5 rounded-2xl bg-[#FF1E2D]/10 border border-[#FF1E2D]/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#FF1E2D] uppercase tracking-wider">
                      {selectedPoint.threat_type || 'Phishing Scam Attack'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#FF1E2D] bg-[#FF1E2D]/20 px-1.5 py-0.5 rounded border border-[#FF1E2D]/30">
                      Risk {selectedPoint.risk_score || selectedPoint.fraud_score}/100
                    </span>
                  </div>
                  <p className="font-bold text-xs text-[#F5F5F5] line-clamp-2">
                    {selectedPoint.subject || 'Urgent Security Account Verification Request'}
                  </p>
                  <p className="text-[11px] text-[#A3A3A3] font-mono truncate">
                    Sender: {selectedPoint.sender || 'security-alert@suspicious-domain.com'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-[#737373]">Source IP Address:</span>
                  <span className="font-mono font-bold text-[#FF1E2D]">{selectedPoint.ip}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-[#737373]">Coordinates:</span>
                  <span className="font-mono font-semibold text-[#F5F5F5]">{selectedPoint.latitude}, {selectedPoint.longitude}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-[#737373]">ASN Network / ISP:</span>
                  <span className="font-semibold text-right max-w-[150px] truncate text-[#F5F5F5]">{selectedPoint.asn || 'AS13335'} ({selectedPoint.isp || 'Hosting Provider'})</span>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-[#737373]">Anonymizer Routing:</span>
                  <span className="font-bold text-[#F5F5F5]">
                    {selectedPoint.is_tor ? '🔴 Tor Exit Node' : selectedPoint.is_vpn ? '🔴 VPN Proxy' : '🟢 Direct Relay'}
                  </span>
                </div>
              </div>

              {selectedPoint.threat_id && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPoint.threat_id) {
                        setSelectedThreatId(selectedPoint.threat_id)
                      }
                    }}
                    className="w-full py-2.5 rounded-2xl bg-[#E50914] hover:bg-[#FF1E2D] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Inspect Deep Forensics Dossier</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              <div className="pt-2">
                <p className="text-[11px] text-[#737373] leading-relaxed italic">
                  Note: Geolocation represents approximate IP-based BGP routing data — not exact physical client location.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#737373]">
              Select any pulsing vector node on the map to inspect origin intelligence.
            </div>
          )}

          {/* Quick Origin Nodes Filter Pills */}
          <div className="pt-4 border-t border-[#2A2A2A]">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider block mb-2">
              Detected Origin Nodes ({points.length})
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {points.map((pt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectNode(pt)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                    selectedPoint?.ip === pt.ip
                      ? 'bg-[#E50914] text-white shadow-sm'
                      : 'bg-[#181818] border border-[#2A2A2A] text-[#F5F5F5] hover:border-[#FF1E2D]'
                  }`}
                >
                  {pt.country_code} • {pt.ip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Deep Dive Modal from Map Pin */}
      <ForensicsModal
        threatId={selectedThreatId}
        onClose={() => setSelectedThreatId(null)}
      />
    </div>
  )
}

export default ThreatMapView
