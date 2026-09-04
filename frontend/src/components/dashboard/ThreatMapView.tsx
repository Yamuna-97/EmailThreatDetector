import React, { useState, useEffect } from 'react'
import { Globe2, Radio, Layers, MapPin, Info } from 'lucide-react'
import { threatService, type ThreatMapPoint } from '../../services/threats'
import { Map, MapControls, MapMarker, MAP_STYLES } from '../ui/map'

export const ThreatMapView: React.FC = () => {
  const [points, setPoints] = useState<ThreatMapPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<ThreatMapPoint | null>(null)
  const [activeStyle, setActiveStyle] = useState<keyof typeof MAP_STYLES>('voyager')
  const [mapCenter, setMapCenter] = useState<[number, number]>([15, 25])
  const [mapZoom, setMapZoom] = useState<number>(1.8)

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
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#12101F] via-[#211A3E] to-[#18122B] border border-[#7342E2]/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-[#7342E2]/10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A78BFA]/30 via-[#8B5CF6]/30 to-[#7342E2]/40 border border-[#7342E2]/40 flex items-center justify-center text-[#A78BFA] shadow-md shadow-[#7342E2]/25">
            <Globe2 size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">
                Global Threat Vector Map
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                Live Ingestion
              </span>
            </div>
            <p className="text-xs text-purple-200/70 font-body mt-0.5">
              Geographic distribution of identified origin mail servers, relay nodes & exit proxies via MapLibre GL
            </p>
          </div>
        </div>

        {/* Basemap Switcher & Disclaimer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <div className="flex items-center gap-1 bg-[#13111C]/80 p-1 rounded-xl border border-[#7342E2]/35 text-xs shadow-inner">
            <Layers size={13} className="text-[#A78BFA] ml-1.5 mr-0.5" />
            {(['voyager', 'darkMatter', 'positron', 'osm'] as const).map(styleKey => (
              <button
                key={styleKey}
                type="button"
                onClick={() => setActiveStyle(styleKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${
                  activeStyle === styleKey
                    ? 'bg-gradient-to-r from-[#7342E2] to-[#8B5CF6] text-white shadow-md shadow-[#7342E2]/30 border border-white/10'
                    : 'text-purple-200/70 hover:text-white hover:bg-[#7342E2]/20'
                }`}
              >
                {styleKey === 'darkMatter' ? 'Dark SOC' : styleKey === 'voyager' ? 'Voyager' : styleKey === 'positron' ? 'Light' : 'OSM'}
              </button>
            ))}
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#13111C]/60 border border-[#7342E2]/30 text-[11px] font-medium text-purple-200/80 flex items-center gap-1.5">
            <Info size={13} className="text-amber-400 shrink-0" />
            <span>Approximate IP-based location</span>
          </div>
        </div>
      </div>

      {/* Main Map & Live Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive MapLibre GL / mapcn Map Container */}
        <div className="lg:col-span-2 relative min-h-[480px] rounded-3xl bg-white border border-[#192837]/15 p-2 overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="relative w-full h-[470px] rounded-2xl overflow-hidden">
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
                        isHighRisk ? 'bg-red-500' : 'bg-amber-500'
                      }`} />

                      {/* Central Pin */}
                      <div className={`relative px-2 py-1 rounded-full flex items-center gap-1 shadow-lg border-2 border-white transition-all transform ${
                        isSelected
                          ? 'scale-125 ring-4 ring-[#7342E2] z-30'
                          : 'hover:scale-110 z-10'
                      } ${isHighRisk ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                        <MapPin size={11} className="shrink-0" />
                        <span className="text-[10px] font-mono font-extrabold">{pt.country_code}</span>
                      </div>

                      {/* Floating Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col items-center z-40 pointer-events-none">
                        <div className="px-2.5 py-1.5 rounded-xl bg-[#192837] text-white text-[11px] font-mono whitespace-nowrap shadow-xl border border-white/20">
                          <span className="font-bold text-[#8B5CF6] block">{pt.city}, {pt.country}</span>
                          <span className="text-white/80">{pt.ip} • Fraud: {pt.fraud_score}/100</span>
                        </div>
                      </div>
                    </div>
                  </MapMarker>
                )
              })}
            </Map>
          </div>

          {/* Bottom Bar overlay */}
          <div className="p-3 bg-[#FAF9F6] rounded-2xl mt-2 border border-[#192837]/5 flex items-center justify-between text-xs text-[#192837]/70">
            <span className="font-mono flex items-center gap-1.5 font-semibold text-[#7342E2]">
              <Radio size={14} className="animate-pulse" />
              MAPCN / MAPLIBRE GL ENGINE
            </span>
            <span className="font-mono font-bold">{points.length} ACTIVE THREAT VECTORS INGESTED</span>
          </div>
        </div>

        {/* Selected Origin Telemetry Card */}
        <div className="rounded-3xl bg-white border border-[#192837]/10 p-6 flex flex-col justify-between shadow-sm space-y-4">
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
                  <span className="font-mono font-semibold">{selectedPoint.latitude}, {selectedPoint.longitude}</span>
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
                  <span className="text-[#192837]/60">Anonymizer Routing:</span>
                  <span className="font-bold">
                    {selectedPoint.is_tor ? '🔴 Tor Exit Node' : selectedPoint.is_vpn ? '🔴 VPN Proxy' : '🟢 Direct Relay'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-[#192837]/50 leading-relaxed italic">
                  Note: Geolocation represents approximate IP-based BGP routing data — not exact physical client location.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-[#192837]/50">
              Select any pulsing vector node on the map to inspect origin intelligence.
            </div>
          )}

          {/* Quick Origin Nodes Filter Pills */}
          <div className="pt-4 border-t border-[#192837]/10">
            <span className="text-[10px] font-bold text-[#192837]/50 uppercase tracking-wider block mb-2">
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
