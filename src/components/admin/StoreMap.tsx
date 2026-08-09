'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search } from 'lucide-react';

// Fix for default Leaflet icons in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix for visited Leaflet icons
const visitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix for office Leaflet icons
const officeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface StoreLocation {
  id: string;
  name: string;
  ownerName: string;
  address: string;
  lat: number;
  lng: number;
  salesName: string;
  lastVisitStatus: string;
  lastVisitDate: string | null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() || 13);
  }, [center, map]);
  return null;
}

export default function StoreMap({ locations, officeLocation }: { locations: StoreLocation[], officeLocation?: { lat: number; lng: number } }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [map, setMap] = useState<L.Map | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ path: [number, number][], storeId: string } | null>(null);

  const fetchRoadRoute = async (storeLoc: StoreLocation) => {
    if (!officeLocation) return;
    try {
      // OSRM coordinates are in Lng,Lat order
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${officeLocation.lng},${officeLocation.lat};${storeLoc.lng},${storeLoc.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates;
        // Convert [Lng, Lat] from GeoJSON to [Lat, Lng] for Leaflet Polyline
        const latLngPath = coordinates.map((coord: number[]) => [coord[1], coord[0]]);
        setActiveRoute({ path: latLngPath, storeId: storeLoc.id });
      }
    } catch (error) {
      console.error("Failed to fetch route", error);
    }
  };

  useEffect(() => {
    return () => {
      // Fix for Next.js Fast Refresh / React Strict Mode
      // Leaflet complains if the container is reused without clearing the internal ID
      const container = document.getElementById('map-container');
      if (container) {
        (container as any)._leaflet_id = null;
      }
    };
  }, [map]);
  
  // Default to Indonesia (Jakarta roughly)
  const defaultCenter: [number, number] = [-6.200000, 106.816666];
  
  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    loc.salesName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const center: [number, number] = officeLocation 
    ? [officeLocation.lat, officeLocation.lng]
    : (filteredLocations.length > 0 && filteredLocations[0].lat && filteredLocations[0].lng
      ? [filteredLocations[0].lat, filteredLocations[0].lng] 
      : defaultCenter);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari nama toko atau nama sales..." 
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div id="map-container" className="h-150 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
        <MapContainer ref={setMap} center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={center} />
          
          {/* Office Marker */}
          {officeLocation && (
            <Marker position={[officeLocation.lat, officeLocation.lng]} icon={officeIcon} zIndexOffset={1000}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-sm text-yellow-700">🏢 LOKASI KANTOR</h3>
                  <p className="text-xs text-slate-600">Pusat Distribusi</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Store Markers and Routes */}
          {filteredLocations.map(loc => {
            const isActive = activeRoute?.storeId === loc.id;
            
            return (
              <React.Fragment key={loc.id}>
                {/* Spiderweb route line or Actual Road Route */}
                {officeLocation && (
                  <Polyline 
                    positions={isActive ? activeRoute.path : [
                      [officeLocation.lat, officeLocation.lng], 
                      [loc.lat, loc.lng]
                    ]} 
                    pathOptions={{ 
                      color: loc.lastVisitStatus === 'COMPLETED' ? '#16a34a' : '#3b82f6', 
                      weight: isActive ? 5 : 3, 
                      opacity: isActive ? 0.9 : 0.7,
                      className: isActive 
                        ? 'animated-route-completed' // We can reuse the animation for the road route too!
                        : (loc.lastVisitStatus === 'COMPLETED' ? 'animated-route-completed' : 'animated-route-scheduled')
                    }} 
                  />
                )}
                
                <Marker 
                  position={[loc.lat, loc.lng]} 
                  icon={loc.lastVisitStatus === 'COMPLETED' ? visitedIcon : customIcon}
                  eventHandlers={{
                    popupopen: () => fetchRoadRoute(loc),
                    popupclose: () => setActiveRoute(null),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-50">
                      <h3 className="font-bold text-sm text-slate-900 mb-1">{loc.name}</h3>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><span className="font-medium text-slate-700">Pemilik:</span> {loc.ownerName}</p>
                        <p><span className="font-medium text-slate-700">Sales:</span> {loc.salesName}</p>
                        <p><span className="font-medium text-slate-700">Alamat:</span> {loc.address}</p>
                        <div className="mt-2 pt-2 border-t border-slate-100">
                          <p className="font-medium text-slate-700">Kunjungan Terakhir:</p>
                          <p className={`font-semibold ${loc.lastVisitStatus === 'COMPLETED' ? 'text-green-600' : loc.lastVisitStatus === 'SCHEDULED' ? 'text-blue-600' : 'text-slate-500'}`}>
                            {loc.lastVisitStatus} 
                            {loc.lastVisitDate && ` (${new Date(loc.lastVisitDate).toLocaleDateString('id-ID')})`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
      
      <div className="flex gap-4 text-xs text-slate-500 justify-end flex-wrap">
        <div className="flex items-center gap-1">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png" className="w-4 h-6" alt="gold" />
          <span className="font-bold text-yellow-700">Lokasi Kantor</span>
        </div>
        <div className="flex items-center gap-1">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" className="w-4 h-6" alt="green" />
          <span>Sudah Dikunjungi</span>
        </div>
        <div className="flex items-center gap-1">
          <img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" className="w-4 h-6" alt="blue" />
          <span>Terjadwal / Belum</span>
        </div>
      </div>
    </div>
  );
}
