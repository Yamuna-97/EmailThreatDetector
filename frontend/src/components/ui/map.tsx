import React, { useEffect, useRef, useState, createContext, useContext } from 'react'
import maplibregl, { Map as MapLibreMap, NavigationControl, Marker as MapLibreMarker, Popup as MapLibrePopup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapContextType {
  map: MapLibreMap | null
  isLoaded: boolean
}

const MapContext = createContext<MapContextType>({ map: null, isLoaded: false })

export const useMap = () => useContext(MapContext)

export interface MapProps {
  center?: [number, number] // [lng, lat]
  zoom?: number
  minZoom?: number
  maxZoom?: number
  pitch?: number
  bearing?: number
  mapStyle?: string
  className?: string
  children?: React.ReactNode
  interactive?: boolean
  onClick?: (e: maplibregl.MapMouseEvent) => void
}

// Free, fast, high-resolution basemap styles from CARTO / OpenStreetMap (No API token required)
export const MAP_STYLES = {
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  darkMatter: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  osm: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap Contributors'
      }
    },
    layers: [
      {
        id: 'osm-tiles-layer',
        type: 'raster',
        source: 'osm-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }
}

export const Map: React.FC<MapProps> = ({
  center = [0, 20],
  zoom = 1.8,
  minZoom = 1,
  maxZoom = 18,
  pitch = 0,
  bearing = 0,
  mapStyle = MAP_STYLES.voyager,
  className = 'w-full h-full min-h-[350px] relative rounded-2xl overflow-hidden',
  children,
  interactive = true,
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle as any,
      center: center,
      zoom: zoom,
      minZoom: minZoom,
      maxZoom: maxZoom,
      pitch: pitch,
      bearing: bearing,
      interactive: interactive,
      attributionControl: false,
    })

    map.on('load', () => {
      setIsLoaded(true)
      map.resize()
    })

    if (onClick) {
      map.on('click', onClick)
    }

    setMapInstance(map)

    return () => {
      map.remove()
    }
  }, [])

  // Update center when prop changes dynamically
  useEffect(() => {
    if (mapInstance && center) {
      mapInstance.flyTo({ center, duration: 1200, essential: true })
    }
  }, [center?.[0], center?.[1]])

  return (
    <MapContext.Provider value={{ map: mapInstance, isLoaded }}>
      <div ref={containerRef} className={className}>
        {isLoaded && children}
      </div>
    </MapContext.Provider>
  )
}

export interface MapControlsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showCompass?: boolean
  showZoom?: boolean
}

export const MapControls: React.FC<MapControlsProps> = ({
  position = 'top-right',
  showCompass = true,
  showZoom = true
}) => {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded) return

    const nav = new NavigationControl({
      showCompass,
      showZoom,
      visualizePitch: true
    })

    map.addControl(nav, position)

    return () => {
      if (map.hasControl(nav)) {
        map.removeControl(nav)
      }
    }
  }, [map, isLoaded, position, showCompass, showZoom])

  return null
}

export interface MapMarkerProps {
  coordinates: [number, number] // [lng, lat]
  children?: React.ReactNode
  onClick?: () => void
  popup?: React.ReactNode
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  coordinates,
  children,
  onClick,
  popup
}) => {
  const { map, isLoaded } = useMap()
  const markerRef = useRef<MapLibreMarker | null>(null)
  const elRef = useRef<HTMLDivElement>(document.createElement('div'))

  useEffect(() => {
    if (!map || !isLoaded) return

    const el = elRef.current
    el.style.cursor = 'pointer'

    if (onClick) {
      el.onclick = (e) => {
        e.stopPropagation()
        onClick()
      }
    }

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(coordinates)
      .addTo(map)

    markerRef.current = marker

    return () => {
      marker.remove()
    }
  }, [map, isLoaded, coordinates[0], coordinates[1]])

  // Render children into marker element via React Portal or simple DOM update
  return (
    <MarkerPortal element={elRef.current}>
      {children}
    </MarkerPortal>
  )
}

import { createPortal } from 'react-dom'

const MarkerPortal: React.FC<{ element: HTMLElement; children: React.ReactNode }> = ({ element, children }) => {
  return createPortal(children, element)
}

export default Map
