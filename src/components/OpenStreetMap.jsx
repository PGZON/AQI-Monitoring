import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix marker icons for webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const OpenStreetMap = ({ latitude, longitude }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Function to create AQI marker with color based on value
  const createAQIMarker = (aqi) => {
    let color = '#22c55e'; // Green for good
    if (aqi > 200) color = '#dc2626'; // Red for hazardous
    else if (aqi > 100) color = '#f97316'; // Orange for unhealthy
    else if (aqi > 50) color = '#eab308'; // Yellow for moderate

    return L.divIcon({
      html: `<div style="background-color: ${color}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${aqi}</div>`,
      className: 'aqi-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Initialize map
      const map = L.map(mapRef.current, {
        center: [latitude || 21.1458, longitude || 79.0882],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Add current location marker
      if (latitude && longitude) {
        L.marker([latitude, longitude], {
          icon: L.divIcon({
            html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 12px rgba(0,0,0,0.4);">📍</div>`,
            className: 'current-location-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        }).addTo(map).bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>Your Location</strong><br>
            <small>${latitude.toFixed(4)}, ${longitude.toFixed(4)}</small>
          </div>
        `);
      }

      // Sample AQI data points around the location
      const sampleAQIPoints = [
        { lat: (latitude || 21.1458) + 0.1, lng: (longitude || 79.0882) + 0.1, aqi: 91 },
        { lat: (latitude || 21.1458) - 0.1, lng: (longitude || 79.0882) + 0.05, aqi: 84 },
        { lat: (latitude || 21.1458) + 0.05, lng: (longitude || 79.0882) - 0.1, aqi: 74 },
        { lat: (latitude || 21.1458) - 0.05, lng: (longitude || 79.0882) - 0.05, aqi: 33 },
        { lat: (latitude || 21.1458) + 0.15, lng: (longitude || 79.0882) - 0.05, aqi: 67 },
        { lat: (latitude || 21.1458) - 0.15, lng: (longitude || 79.0882) + 0.15, aqi: 125 },
      ];

      // Add AQI markers
      sampleAQIPoints.forEach(point => {
        L.marker([point.lat, point.lng], {
          icon: createAQIMarker(point.aqi)
        }).addTo(map).bindPopup(`
          <div style="text-align: center; padding: 8px;">
            <strong>AQI: ${point.aqi}</strong><br>
            <small>${point.aqi <= 50 ? 'Good' : point.aqi <= 100 ? 'Moderate' : point.aqi <= 200 ? 'Unhealthy' : 'Hazardous'}</small><br>
            <small>Lat: ${point.lat.toFixed(4)}, Lng: ${point.lng.toFixed(4)}</small>
          </div>
        `);
      });

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoaded(false);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-600/50">
        <div className="flex items-center space-x-2">
          <span className="text-blue-400 text-sm font-medium">🗺️</span>
          <span className="text-white text-sm">AQI Map</span>
        </div>
      </div>
      
      <div className="absolute top-2 right-2 z-10">
        <button className="p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-600/50 text-white hover:bg-slate-700/90 transition-colors">
          <span>⛶</span>
        </button>
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-xl border border-slate-600/50 bg-slate-800"
        style={{ minHeight: '256px' }}
      >
        {!mapLoaded && (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <div className="animate-spin text-2xl mb-2">🌍</div>
              <div className="text-sm">Loading map...</div>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="mt-4 flex justify-center">
        <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-600/50">
          <div className="flex items-center space-x-6 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-slate-300">Good (0-50)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-slate-300">Moderate (51-100)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-slate-300">Unhealthy (101-200)</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-slate-300">Hazardous (200+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenStreetMap;
