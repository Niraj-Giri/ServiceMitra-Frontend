import React, { useState, useEffect } from 'react';
import { X, MapPin, Plus, Trash2, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet icon in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LocationMarker({ position, setPosition }: { position: any, setPosition: any }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function RecenterAutomatically({lat, lng}: {lat: number, lng: number}) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
}

export const ManageAddressesModal = ({ isOpen, onClose, onAddressSelected }: { isOpen: boolean, onClose: () => void, onAddressSelected: (addr: any) => void }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [mode, setMode] = useState<'list' | 'add' | 'map-only'>('list');
  const [loading, setLoading] = useState(false);

  // Add Address Form State
  const [title, setTitle] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchAddresses();
    }
  }, [isOpen, user]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/addresses/customer/${user?.id}`);
      setAddresses(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      alert('Please click on the map to set a location pin');
      return;
    }
    try {
      const newAddress = {
        customerId: user?.id,
        title,
        addressLine,
        latitude: position.lat,
        longitude: position.lng
      };
      await apiClient.post('/addresses/add', newAddress);
      setMode('list');
      setTitle('');
      setAddressLine('');
      setPosition(null);
      fetchAddresses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/addresses/${id}`);
      fetchAddresses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetDefault = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await apiClient.put(`/addresses/${id}/default`);
      fetchAddresses();
    } catch (e) {
      console.error(e);
    }
  };

  const getUserCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude)),
        () => alert('Could not get current location')
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6" />
        </button>

        {mode === 'list' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
              <MapPin className="w-7 h-7 mr-3 text-blue-600" /> My Addresses
            </h2>

            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {loading ? (
                <div className="text-slate-500 animate-pulse">Loading addresses...</div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MapPin className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p>You haven't saved any addresses yet.</p>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer" onClick={() => onAddressSelected(addr)}>
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{addr.title}</h3>
                        <p className="text-slate-500 text-sm">{addr.addressLine}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleSetDefault(e, addr.id)}
                        className={`p-2 rounded-full transition-colors ${addr.isDefault ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                        title="Set as Default"
                      >
                        <Star className={`w-5 h-5 ${addr.isDefault ? 'fill-yellow-500' : ''}`} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-4 shrink-0">
              <button 
                onClick={() => {
                   setMode('add'); 
                   if (!position) getUserCurrentLocation();
                }} 
                className="flex-1 bg-blue-50 border-2 border-dashed border-blue-200 text-blue-600 font-bold py-4 rounded-2xl hover:bg-blue-100 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" /> Save New Address
              </button>
              <button 
                onClick={() => {
                   setMode('map-only'); 
                   if (!position) getUserCurrentLocation();
                }} 
                className="flex-1 bg-emerald-50 border-2 border-dashed border-emerald-200 text-emerald-600 font-bold py-4 rounded-2xl hover:bg-emerald-100 transition-colors flex items-center justify-center"
              >
                <MapPin className="w-5 h-5 mr-2" /> Pick on Map
              </button>
            </div>
          </div>
        )}

        {mode === 'add' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
              <Plus className="w-7 h-7 mr-3 text-blue-600" /> Add New Address
            </h2>

            <form onSubmit={handleAddAddress} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex flex-col overflow-y-auto pr-2">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Address Label</label>
                  <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Home, Office" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                  <textarea required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="Enter complete address..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none h-20" />
                </div>
                <div className="mb-2 flex justify-between items-end">
                  <label className="block text-sm font-bold text-slate-700">Pin Location on Map</label>
                  <button type="button" onClick={getUserCurrentLocation} className="text-blue-600 text-sm font-bold hover:underline">Use Current Location</button>
                </div>
                
                <div className="flex-1 min-h-[250px] border border-slate-200 rounded-xl overflow-hidden relative z-0">
                  <MapContainer center={position || [28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker position={position} setPosition={setPosition} />
                    {position && <RecenterAutomatically lat={position.lat} lng={position.lng} />}
                  </MapContainer>
                </div>
              </div>

              <div className="mt-6 flex gap-4 shrink-0">
                <button type="button" onClick={() => setMode('list')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg">Save Address</button>
              </div>
            </form>
          </div>
        )}

        {mode === 'map-only' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
              <MapPin className="w-7 h-7 mr-3 text-emerald-600" /> Select Location on Map
            </h2>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex flex-col overflow-y-auto pr-2">
                <div className="mb-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Street Address / Landmark</label>
                  <input type="text" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="e.g. Near City Mall..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none" />
                </div>
                <div className="mb-2 flex justify-between items-end">
                  <label className="block text-sm font-bold text-slate-700">Drag map to pin your location</label>
                  <button type="button" onClick={getUserCurrentLocation} className="text-emerald-600 text-sm font-bold hover:underline">Use Current Location</button>
                </div>
                
                <div className="flex-1 min-h-[250px] border border-slate-200 rounded-xl overflow-hidden relative z-0">
                  <MapContainer center={position || [28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationMarker position={position} setPosition={setPosition} />
                    {position && <RecenterAutomatically lat={position.lat} lng={position.lng} />}
                  </MapContainer>
                </div>
              </div>

              <div className="mt-6 flex gap-4 shrink-0">
                <button type="button" onClick={() => setMode('list')} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="button" onClick={() => {
                  if (!position) {
                    alert('Please click on the map to set a location pin');
                    return;
                  }
                  onAddressSelected({
                    id: 'temp-' + Date.now(),
                    title: 'Map Location',
                    addressLine: addressLine || 'Pinned Location',
                    latitude: position.lat,
                    longitude: position.lng
                  });
                }} className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg">Confirm Location</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
