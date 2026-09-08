import React, { useEffect, useRef, useState, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapContextType {
  map: maplibregl.Map | null
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
  mapStyle?: string | object
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  interactive?: boolean
  onClick?: (e: maplibregl.MapMouseEvent) => void
}

// Ultra-reliable high-resolution basemap styles for enterprise SOC
export const MAP_STYLES = {
  darkCyber: {
    version: 8,
    sources: {
      'esri-dark': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: 'Esri &copy; OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'esri-dark-layer',
        type: 'raster',
        source: 'esri-dark',
        minzoom: 0,
        maxzoom: 16
      }
    ]
  },
  darkMatter: {
    version: 8,
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256,
        attribution: '&copy; CARTO &copy; OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'carto-dark-layer',
        type: 'raster',
        source: 'carto-dark',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  },
  voyager: {
    version: 8,
    sources: {
      'carto-voyager': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256,
        attribution: '&copy; CARTO &copy; OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'carto-voyager-layer',
        type: 'raster',
        source: 'carto-voyager',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  },
  osm: {
    version: 8,
    sources: {
      'osm-tiles': {
        type: 'raster',
        tiles: [
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
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
  mapStyle = MAP_STYLES.darkCyber,
  className = 'w-full h-full min-h-[460px] relative rounded-2xl overflow-hidden',
  style,
  children,
  interactive = true,
  onClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null)
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

    // Additional resize passes to guarantee canvas fills the container
    const t1 = setTimeout(() => map.resize(), 100)
    const t2 = setTimeout(() => map.resize(), 400)
    const t3 = setTimeout(() => map.resize(), 1000)

    if (onClick) {
      map.on('click', onClick)
    }

    setMapInstance(map)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      map.remove()
    }
  }, [])

  // Update style dynamically when user changes basemap
  useEffect(() => {
    if (mapInstance && mapStyle) {
      try {
        mapInstance.setStyle(mapStyle as any)
      } catch (e) {
        console.warn('Map style update notice:', e)
      }
    }
  }, [mapStyle, mapInstance])

  // Update center smoothly
  useEffect(() => {
    if (mapInstance && center) {
      mapInstance.flyTo({ center, duration: 1200, essential: true })
    }
  }, [center?.[0], center?.[1], mapInstance])

  return (
    <MapContext.Provider value={{ map: mapInstance, isLoaded }}>
      <div
        ref={containerRef}
        className={className}
        style={{ width: '100%', height: '100%', minHeight: '460px', ...style }}
      >
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

    const nav = new maplibregl.NavigationControl({
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
}

export const MapMarker: React.FC<MapMarkerProps> = ({
  coordinates,
  children,
  onClick
}) => {
  const { map, isLoaded } = useMap()
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

    return () => {
      marker.remove()
    }
  }, [map, isLoaded, coordinates[0], coordinates[1]])

  return createPortal(children, elRef.current)
}

export default Map
