import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Service } from '../../types';
import { Button } from '../../components/ui/Button';
import { AddressMapPicker } from '../../components/ui/AddressMapPicker';

interface SavedAddress {
  id: number;
  label: string;
  line1: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export const BookingCheckout: React.FC = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  
  // Form inputs state
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [notes, setNotes] = useState('');
  
  // Address selection state
  const [addressType, setAddressType] = useState<'SAVED' | 'MAP'>('MAP');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<number | null>(null);
  
  // Map address selection state
  const [mapAddressLine, setMapAddressLine] = useState('');
  const [mapLat, setMapLat] = useState<number | null>(null);
  const [mapLng, setMapLng] = useState<number | null>(null);
  const [shouldSaveAddress, setShouldSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');

  const [error, setError] = useState('');

  // Fetch service listing details
  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await apiClient.get(`/services/${serviceId}`);
        setService(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchService();
  }, [serviceId]);

  // Fetch user's saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await apiClient.get('/users/addresses');
        const list = response.data;
        setSavedAddresses(list);
        
        // Default to saved addresses if the user already has some
        if (list && list.length > 0) {
          setAddressType('SAVED');
          const defaultAddr = list.find((a: SavedAddress) => a.isDefault) || list[0];
          setSelectedSavedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error('Could not fetch saved addresses:', err);
      }
    };
    fetchAddresses();
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let finalAddress = '';
    let finalLat = 27.7007;
    let finalLng = 85.3001;

    if (addressType === 'SAVED') {
      const selected = savedAddresses.find(a => a.id === selectedSavedAddressId);
      if (!selected) {
        setError('Please select one of your saved addresses.');
        return;
      }
      finalAddress = selected.line1;
      finalLat = selected.latitude;
      finalLng = selected.longitude;
    } else {
      if (!mapAddressLine.trim()) {
        setError('Please select a location on the map or enter an address.');
        return;
      }
      finalAddress = mapAddressLine;
      finalLat = mapLat || 27.7007;
      finalLng = mapLng || 85.3001;
    }

    // Redirect to Step 2 (Provider Selection), passing parameters in location state
    navigate(`/services/${serviceId}/providers`, {
      state: {
        scheduledAt: `${date}T${timeSlot}:00`,
        address: finalAddress,
        latitude: finalLat,
        longitude: finalLng,
        notes: notes,
        saveAddress: addressType === 'MAP' && shouldSaveAddress,
        addressLabel: addressLabel
      }
    });
  };

  if (!service) return <div className="text-center py-20 text-gray-500 font-medium">Loading checkout details...</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-between border-b pb-4 border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Book service</h1>
          <p className="text-sm text-gray-500 mt-1">Step 1 of 2: Tell us about the job & location</p>
        </div>
        <div className="flex gap-2">
          <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">1</span>
          <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs">2</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Booking Details Input Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-800 pb-3 border-b border-slate-100">Service Request Details</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleNextStep} className="space-y-6">
              {/* Date & Time select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                  <input 
                    type="date" 
                    required
                    value={date}
                    min={new Date().toLocaleDateString('en-CA')}
                    onChange={e => {
                      const selectedDate = e.target.value;
                      setDate(selectedDate);
                      setTimeSlot(''); // Reset slot on date change
                      
                      // Check if slots are available for today
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      if (selectedDate === todayStr) {
                        const slots = [
                          { value: '09:00', label: '09:00 AM' },
                          { value: '11:00', label: '11:00 AM' },
                          { value: '14:00', label: '02:00 PM' },
                          { value: '16:00', label: '04:00 PM' },
                        ];
                        const currentHour = new Date().getHours();
                        const available = slots.filter(slot => parseInt(slot.value.split(':')[0], 10) > currentHour + 1);
                        if (available.length === 0) {
                          setError('All time slots for today have passed. Please select a future date.');
                        } else {
                          setError('');
                        }
                      } else {
                        setError('');
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Time Slot</label>
                  <select
                    required
                    value={timeSlot}
                    onChange={e => setTimeSlot(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  >
                    <option value="">-- Choose Slot --</option>
                    {(() => {
                      const slots = [
                        { value: '09:00', label: '09:00 AM' },
                        { value: '11:00', label: '11:00 AM' },
                        { value: '14:00', label: '02:00 PM' },
                        { value: '16:00', label: '04:00 PM' },
                      ];
                      if (!date) return slots;
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      if (date === todayStr) {
                        const currentHour = new Date().getHours();
                        return slots.filter(slot => {
                          const slotHour = parseInt(slot.value.split(':')[0], 10);
                          // Must be at least 1 hour in the future
                          return slotHour > currentHour + 1;
                        });
                      }
                      return slots;
                    })().map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Describe your problem in detail</label>
                <textarea 
                  required
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Toilet tank leaking water continuously, kitchen tap faucet broken and needs immediate replacement..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                  rows={3}
                />
              </div>

              {/* Service Address Selector */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Where should we send the professional?</label>
                
                {/* Mode Selector Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddressType('SAVED')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        addressType === 'SAVED' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Use Saved Address
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAddressType('MAP')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      addressType === 'MAP' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Locate on Map
                  </button>
                </div>

                {/* Option 1: Saved Addresses List */}
                {addressType === 'SAVED' && (
                  <div className="space-y-2.5">
                    {savedAddresses.map(addr => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedSavedAddressId === addr.id
                            ? 'bg-blue-50/20 border-blue-500 ring-2 ring-blue-50'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="saved_address"
                          checked={selectedSavedAddressId === addr.id}
                          onChange={() => setSelectedSavedAddressId(addr.id)}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-sm text-gray-800 flex items-center gap-1.5">
                            {addr.label}
                            {addr.isDefault && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">Default</span>}
                          </span>
                          <p className="text-xs text-gray-500 leading-relaxed">{addr.line1}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Option 2: Leaflet Interactive Map Picker */}
                {addressType === 'MAP' && (
                  <div className="space-y-4">
                    <AddressMapPicker
                      onAddressSelect={({ address, lat, lng }) => {
                        setMapAddressLine(address);
                        setMapLat(lat);
                        setMapLng(lng);
                      }}
                    />

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Service Address Details</label>
                      <textarea
                        required
                        value={mapAddressLine}
                        onChange={e => setMapAddressLine(e.target.value)}
                        placeholder="Click on the map above to set coordinates and address, or enter street details"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-white"
                        rows={2}
                      />
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          checked={shouldSaveAddress}
                          onChange={e => setShouldSaveAddress(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span>Save this address to my account for future bookings</span>
                      </label>

                      {shouldSaveAddress && (
                        <div className="animate-fadeIn">
                          <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Address Label (e.g. Work, Sweet Home)</label>
                          <input
                            type="text"
                            value={addressLabel}
                            onChange={e => setAddressLabel(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Home, Office, Parents..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full py-4 text-base font-bold rounded-xl"
                  disabled={!date || !timeSlot || !notes}
                >
                  Find Available Professionals →
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Service summary details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-3">Service Summary</h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Service Category</span>
                <span className="font-semibold text-gray-800 text-sm">{service.category}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Selected Listing</span>
                <span className="font-bold text-gray-800 text-base block">{service.name}</span>
                <span className="text-xs text-gray-500 block mt-1 leading-relaxed">{service.description}</span>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center font-bold text-gray-900">
                <span>{service.priceType === 'HOURLY' ? 'Hourly Rate' : 'Fixed Rate'}</span>
                <span className="text-lg text-blue-600">Rs. {service.basePrice}{service.priceType === 'HOURLY' ? ' / Hr' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
