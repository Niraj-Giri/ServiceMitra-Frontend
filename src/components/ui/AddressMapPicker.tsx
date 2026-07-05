import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom SVG Pin Icon for modern aesthetics and 100% reliable rendering without PNG assets
const customPinIcon = L.divIcon({
  html: `<div class="flex items-center justify-center">
           <svg class="w-8 h-8 text-blue-600 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
             <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
           </svg>
         </div>`,
  className: 'custom-pin-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

interface AddressMapPickerProps {
  onAddressSelect: (data: { address: string; lat: number; lng: number }) => void;
  defaultLat?: number;
  defaultLng?: number;
}

export const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  onAddressSelect,
  defaultLat = 27.7007,
  defaultLng = 85.3001
}) => {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(defaultLat, defaultLng));
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Try to use browser geolocation to center map on load
  useEffect(() => {
    if (navigator.geolocation && defaultLat === 27.7007 && defaultLng === 85.3001) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(newPos);
          reverseGeocode(newPos.lat, newPos.lng);
        },
        (err) => console.log('Geolocation not permitted or failed, using default center:', err.message)
      );
    }
  }, [defaultLat, defaultLng]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`
      );
      const data = await res.json();
      const displayName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      onAddressSelect({
        address: displayName,
        lat: lat,
        lng: lng
      });
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      onAddressSelect({
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        lat: lat,
        lng: lng
      });
    } finally {
      setLoadingAddress(false);
    }
  };

  // Helper component to handle click events on the map
  const MapEventsHandler = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 font-medium flex justify-between items-center mb-1">
        <span>Click on the map to set your service location</span>
        {loadingAddress && <span className="text-blue-600 animate-pulse font-bold">Retrieving address details...</span>}
      </div>

      <div className="h-64 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative z-10">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} icon={customPinIcon} />
          <MapEventsHandler />
        </MapContainer>
      </div>
    </div>
  );
};
