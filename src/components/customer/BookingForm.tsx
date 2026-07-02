import React, { useState, useEffect } from 'react';
import { MapPin, X, ArrowLeft } from 'lucide-react';
import { apiClient } from '../../api/client';

export const BookingForm = ({ provider, onBack, onConfirm, userAddress }: { provider: any, onBack: () => void, onConfirm: (data: any) => Promise<void>, userAddress: any }) => {
  const [address, setAddress] = useState(userAddress?.addressLine || '');
  const [problem, setProblem] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  useEffect(() => {
    if (scheduledDate) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const response = await apiClient.get(`/slots/provider/${provider.id}?date=${scheduledDate}`);
          setAvailableSlots(response.data);
          setScheduledTime(''); // Reset time when date changes
        } catch (e) {
          console.error("Failed to fetch slots", e);
          setAvailableSlots([]);
        }
        setLoadingSlots(false);
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setScheduledTime('');
    }
  }, [scheduledDate, provider.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleConfirm = async () => {
    if (paymentMethod === 'ONLINE') {
      setShowPaymentGateway(true);
      return;
    }
    await submitBooking();
  };

  const submitBooking = async () => {
    setIsSubmitting(true);
    const scheduledFor = scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}:00` : null;
    await onConfirm({ 
      address, 
      problem, 
      scheduledFor, 
      specialInstructions: instructions, 
      problemImageUrls: images.length > 0 ? "mocked_s3_url.jpg" : null,
      paymentMethod 
    });
    setIsSubmitting(false);
    setShowPaymentGateway(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col animate-in fade-in relative z-10">
      <header className="p-6 border-b border-slate-200 flex items-center shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 mr-4 text-slate-600 hover:bg-slate-100 rounded-full"><ArrowLeft className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold">Booking Details</h2>
      </header>
      
      <div className="p-8 flex-1 overflow-y-auto">
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex items-center mb-8">
          <img src={provider.img || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt={provider.name} className="w-16 h-16 rounded-xl object-cover mr-4" />
          <div>
            <h3 className="font-bold text-lg text-slate-800">{provider.name}</h3>
            <p className="text-slate-500 text-sm">{provider.category?.replace('_', ' ')} • {typeof provider.rating === 'number' ? provider.rating.toFixed(1) : provider.rating} Rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <label className="block font-bold text-slate-700 mb-2">Service Location *</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
                <textarea 
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 min-h-[100px]" 
                  placeholder="E.g., Lodhi Colony..." 
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Schedule Service</label>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="date" 
                  value={scheduledDate} 
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setScheduledDate(e.target.value)} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800" 
                />
                <select 
                  value={scheduledTime} 
                  onChange={e => setScheduledTime(e.target.value)} 
                  disabled={!scheduledDate || loadingSlots}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Select Time</option>
                  {availableSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {loadingSlots ? 'Loading slots...' : (!scheduledDate ? 'Leave blank to request immediately.' : (availableSlots.length === 0 ? 'No slots available for this date.' : 'Select an available 90-minute slot.'))}
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Payment Method *</label>
              <div className="flex gap-4">
                <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex items-center justify-center font-bold transition-all ${paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <input type="radio" name="payment" value="CASH" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} className="hidden" />
                  Pay in Cash
                </label>
                <label className={`flex-1 border p-4 rounded-xl cursor-pointer flex items-center justify-center font-bold transition-all ${paymentMethod === 'ONLINE' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                  <input type="radio" name="payment" value="ONLINE" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} className="hidden" />
                  Pay Online
                </label>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <div>
              <label className="block font-bold text-slate-700 mb-2">Problem Description *</label>
              <textarea 
                value={problem} onChange={(e) => setProblem(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 min-h-[100px]" 
                placeholder="E.g., Engine won't start..." 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Upload Images (Optional)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="text-slate-500 font-medium">
                  {images.length > 0 ? `${images.length} file(s) selected` : 'Click or drag images here to upload'}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Special Instructions (Optional)</label>
              <textarea 
                value={instructions} onChange={(e) => setInstructions(e.target.value)}
                className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 min-h-[80px]" 
                placeholder="E.g., Call upon arrival, beware of dog..." 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
        <button 
          disabled={!address || !problem || isSubmitting}
          onClick={handleConfirm} 
          className="w-full max-w-2xl mx-auto block bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg"
        >
          {isSubmitting ? 'Processing...' : (paymentMethod === 'ONLINE' ? 'Pay Online & Book Service' : 'Confirm & Book Service')}
        </button>
      </div>

      {showPaymentGateway && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-black text-slate-800">Secure Checkout</h2>
              <button onClick={() => setShowPaymentGateway(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 border border-slate-200">
              <p className="text-sm font-bold text-slate-500 mb-2">MOCK PAYMENT GATEWAY</p>
              <p className="text-slate-700 text-sm mb-4">You are about to authorize a hold on your card for the service. You will only be charged the final amount after completion.</p>
              
              <div className="space-y-4">
                <input type="text" placeholder="Card Number" className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" defaultValue="4242 4242 4242 4242" />
                <div className="flex gap-4">
                  <input type="text" placeholder="MM/YY" className="w-1/2 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" defaultValue="12/28" />
                  <input type="text" placeholder="CVC" className="w-1/2 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" defaultValue="123" />
                </div>
              </div>
            </div>

            <button onClick={submitBooking} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-colors text-lg flex items-center justify-center">
              {isSubmitting ? 'Processing...' : 'Authorize Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
