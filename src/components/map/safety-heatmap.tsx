"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// TypeScript declarations for leaflet.heat plugin
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: HeatLayerOptions
  ): HeatLayer;

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: Array<[number, number, number]>): this;
    addLatLng(latlng: [number, number, number]): this;
    setOptions(options: HeatLayerOptions): this;
  }

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }
}

// Import the heat plugin
import 'leaflet.heat';

// Fix Leaflet default marker icons
const DefaultIcon = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: string;
  options: L.IconOptions;
};

delete DefaultIcon._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HeatmapData {
  lat: number;
  lng: number;
  count: number;
}

interface SafetyHeatmapProps {
  data: HeatmapData[];
}

export function SafetyHeatmap({ data }: SafetyHeatmapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.HeatLayer | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map with performance optimizations
    const map = L.map(mapRef.current, {
      center: [47.9188, 106.9173], // Ulaanbaatar center
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
      preferCanvas: true, // Use canvas for better performance
      renderer: L.canvas(), // Canvas renderer is faster than SVG
    });

    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles with caching
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      keepBuffer: 2, // Keep tiles in memory
      updateWhenIdle: true, // Update only when map stops moving
      updateWhenZooming: false, // Don't update while zooming
    }).addTo(map);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update heatmap when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !data.length) return;

    // Remove old heat layer if exists
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
    }

    // Find max count for normalization
    const maxCount = Math.max(...data.map(p => p.count));
    
    // Convert to heatmap format: [lat, lng, intensity]
    const heatData: Array<[number, number, number]> = data.map(point => [
      point.lat,
      point.lng,
      point.count / maxCount // Normalize to 0-1 range
    ]);

    // Create heat layer with optimized settings
    const heatLayer = L.heatLayer(heatData, {
      radius: 30, // Size of each heat point
      blur: 25,   // Amount of blur
      maxZoom: 15, // Max zoom to show heat
      max: 1.0,    // Maximum intensity
      minOpacity: 0.3, // Minimum opacity
      gradient: {
        0.0: '#3b82f6',  // blue - low
        0.25: '#22d3ee', // cyan
        0.4: '#fbbf24',  // yellow
        0.6: '#f97316',  // orange
        0.8: '#ef4444',  // red
        1.0: '#991b1b',  // dark red - high
      }
    });

    heatLayer.addTo(mapInstanceRef.current);
    heatLayerRef.current = heatLayer;

  }, [data]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '100%' }}
    />
  );
}