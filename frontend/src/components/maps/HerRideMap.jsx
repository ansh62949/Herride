import React, { useEffect, useState, useRef } from 'react';
import { useHerRideStore } from '../../store/useHerRideStore';
import { Plus, Minus, Compass, Shield } from 'lucide-react';

export default function HerRideMap() {
  const { currentTrip, nearbyDrivers } = useHerRideStore();
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  // 1. Dynamic Leaflet CDN assets injection
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      // Clean up link/script if desired, normally fine to keep in SPA head
    };
  }, []);

  // 2. Initialize Leaflet Map Instance
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = window.L.map(mapContainerRef.current, {
      center: [28.6139, 77.2090], // Delhi center
      zoom: 13,
      zoomControl: false
    });

    mapInstanceRef.current = map;

    // Premium clean grayscale map tiles (CartoDB Positron) looking exactly like Uber/Rapido
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const layersGroup = window.L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // 3. Render and Update Markers/Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // Define premium custom icons using Leaflet DivIcon
    const pickupIcon = window.L.divIcon({
      html: `
        <div class="flex flex-col items-center -translate-y-[15px]">
          <div class="w-7 h-7 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center shadow-lg relative">
            <div class="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></div>
            <div class="w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>
          </div>
        </div>
      `,
      className: 'custom-pin-pickup',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const destIcon = window.L.divIcon({
      html: `
        <div class="flex flex-col items-center -translate-y-[15px]">
          <div class="w-7 h-7 bg-rose-500/20 border border-rose-500 rounded-full flex items-center justify-center shadow-lg">
            <div class="w-3 h-3 bg-rose-500 rounded-full border border-white"></div>
          </div>
        </div>
      `,
      className: 'custom-pin-dest',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const createDriverIcon = (vehicleType = 'cab') => {
      let svgContent = '';
      if (vehicleType === 'bike') {
        svgContent = `
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="6" cy="18" r="3" fill="#ffffff" />
            <circle cx="18" cy="18" r="3" fill="#ffffff" />
            <path d="M6 18h12M9 18l1-8h6M16 10l-2-6h-3M6 10H4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      } else if (vehicleType === 'auto') {
        svgContent = `
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="6" cy="18" r="3" fill="#ffffff" />
            <circle cx="18" cy="18" r="3" fill="#ffffff" />
            <path d="M6 18h12M5 18l1-10h10l1 10M10 8l-1-4h5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      } else {
        svgContent = `
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="6" cy="18" r="2.5" fill="#ffffff" />
            <circle cx="18" cy="18" r="2.5" fill="#ffffff" />
            <path d="M3 15h18M4 15l1-5h14l1 5M6 10l1.5-5h9l1.5 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      }

      return window.L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-8 h-8 bg-primary border-2 border-white rounded-full flex items-center justify-center shadow-lg relative ring-2 ring-primary/20">
              ${svgContent}
              <div class="absolute inset-0 border border-primary/20 rounded-full animate-ping opacity-25"></div>
            </div>
          </div>
        `,
        className: 'custom-pin-driver',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    if (currentTrip && currentTrip.status !== 'COMPLETED' && currentTrip.status !== 'CANCELLED') {
      const pLat = currentTrip.pickupLat || 28.6139;
      const pLng = currentTrip.pickupLng || 77.2090;
      const dLat = currentTrip.destLat || 28.5562;
      const dLng = currentTrip.destLng || 77.1000;

      // Draw route pins
      window.L.marker([pLat, pLng], { icon: pickupIcon }).addTo(layersGroup);
      window.L.marker([dLat, dLng], { icon: destIcon }).addTo(layersGroup);

      // Draw dashed route line
      window.L.polyline([[pLat, pLng], [dLat, dLng]], {
        color: '#8B5CF6',
        weight: 3.5,
        dashArray: '6, 5',
        opacity: 0.75
      }).addTo(layersGroup);

      // Draw driver vehicle pin if assigned
      if (currentTrip.coordinates) {
        const dLoc = currentTrip.coordinates;
        const driverMarker = window.L.marker([dLoc.lat, dLoc.lng], {
          icon: createDriverIcon(currentTrip.vehicleType || 'cab')
        });
        driverMarker.addTo(layersGroup);

        if (currentTrip.driver) {
          driverMarker.bindTooltip(currentTrip.driver.name.split(' ')[0], {
            permanent: true,
            direction: 'top',
            offset: [0, -10],
            className: 'bg-slate-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow border-0'
          });
        }
      }

      // Automatically adjust bounds to contain pickup and destination
      map.fitBounds([[pLat, pLng], [dLat, dLng]], {
        padding: [40, 40],
        maxZoom: 15
      });

    } else {
      // Map nearby drivers (Rapido style) when rider is looking to book
      nearbyDrivers.forEach(driver => {
        if (driver.latitude && driver.longitude) {
          const type = driver.vehicleType ? driver.vehicleType.toLowerCase() : 'cab';
          const marker = window.L.marker([driver.latitude, driver.longitude], {
            icon: createDriverIcon(type)
          });
          marker.bindTooltip(`${driver.firstName || 'Driver'} (${driver.rating || 4.9} ★)`, {
            direction: 'top',
            offset: [0, -8],
            className: 'bg-slate-950 text-white text-[9px] font-semibold px-2 py-1 rounded shadow-lg border border-slate-800'
          });
          marker.addTo(layersGroup);
        }
      });

      // Default center zoom on Delhi if not in trip
      if (nearbyDrivers.length > 0) {
        const coords = nearbyDrivers.map(d => [d.latitude, d.longitude]);
        map.fitBounds(coords, { padding: [50, 50], maxZoom: 14 });
      }
    }
  }, [currentTrip, nearbyDrivers, leafletLoaded]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] md:min-h-[450px] bg-slate-100 rounded-3xl relative overflow-hidden shadow-inner border border-brandBorder">
      {/* Real Map Leaflet Container */}
      {leafletLoaded ? (
        <div ref={mapContainerRef} className="w-full h-full z-0 absolute inset-0" />
      ) : (
        <div className="w-full h-full absolute inset-0 bg-slate-100 flex items-center justify-center flex-col">
          <Compass className="w-8 h-8 text-primary animate-spin mb-2" />
          <span className="text-xs text-brandText-muted font-bold">Loading Premium Map Engine...</span>
        </div>
      )}

      {/* Floating Compass Widget */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm border border-brandBorder shadow-card p-2 rounded-2xl flex items-center justify-center text-slate-500">
        <Compass className="w-4 h-4" />
      </div>

      {/* Floating Zoom Controls Panel */}
      {leafletLoaded && (
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 bg-white/95 backdrop-blur-sm border border-brandBorder hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shadow-lg transition"
            title="Zoom In"
          >
            <Plus className="w-4 h-4 font-bold" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 bg-white/95 backdrop-blur-sm border border-brandBorder hover:bg-slate-50 active:bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center shadow-lg transition"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4 font-bold" />
          </button>
        </div>
      )}

      {/* Safety Watermark */}
      <div className="absolute bottom-4 right-4 z-10 bg-primary text-white border border-white/20 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wide flex items-center gap-1 shadow-lg">
        <Shield className="w-3 h-3 fill-current" />
        <span>GPS Protected</span>
      </div>
    </div>
  );
}
