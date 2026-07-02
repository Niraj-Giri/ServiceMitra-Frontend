import { useState, useEffect, useRef } from 'react';
import { MapPin, Star, ArrowLeft, ChevronRight, Briefcase, History, X, IndianRupee, Filter, Search, Wrench, Zap, Droplet, User, Mail, Phone, LogOut, MessageCircle, Send } from 'lucide-react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../context/AuthContext';
import { OtpModal } from './OtpModal';
import { apiClient } from '../api/client';
import { ManageAddressesModal } from './ManageAddressesModal';

import { ProviderDetails } from './customer/ProviderDetails';
import { BookingForm } from './customer/BookingForm';
import { OrderTrackingView } from './customer/OrderTrackingView';
import { RatingModal } from './customer/RatingModal';
import { BookingDetailsModal } from './customer/BookingDetailsModal';
import { ActiveBookingCapsule } from './customer/ActiveBookingCapsule';
import { ChatModal } from './common/ChatModal';

// --- Main Component ---
export const CustomerDashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  // App State
  const [viewState, setViewState] = useState<'HOME' | 'MAP' | 'DETAILS' | 'BOOKING' | 'TRACKING' | 'PROFILE'>('HOME');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  
  // Address State
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const [providersList, setProvidersList] = useState<any[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // History State
  const [bookingHistory, setBookingHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [selectedHistoryBooking, setSelectedHistoryBooking] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hideCapsule, setHideCapsule] = useState(false);
  const stompClient = useRef<Client | null>(null);

  const activeBooking = bookingHistory.find(b => b.status === 'REQUESTED' || b.status === 'ACCEPTED' || b.status === 'STARTED');

  const fetchProviders = async (lat: number, lng: number, category: string = '') => {
    setIsLoadingProviders(true);
    try {
      const url = category ? `/providers/nearby?lat=${lat}&lng=${lng}&category=${category}` : `/providers/nearby?lat=${lat}&lng=${lng}`;
      const response = await apiClient.get(url);
      setProvidersList(response.data);
    } catch (error) {
      console.error("Failed to fetch providers", error);
      setProvidersList([]);
    }
    setIsLoadingProviders(false);
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(`/bookings/customer/${user.id}`);
      setBookingHistory(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const cancelOrder = async (bookingId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await apiClient.post(`/bookings/${bookingId}/status`, { status: 'CANCELLED' });
      fetchHistory();
      setViewState('HOME');
    } catch(e) {
      console.error(e);
      alert("Failed to cancel order");
    }
  };

  const fetchUserAddresses = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(`/addresses/customer/${user.id}`);
      if (response.data.length > 0 && !selectedAddress) {
        setSelectedAddress(response.data[0]);
      } else if (response.data.length === 0) {
        setSelectedAddress(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && isAuthenticated) {
      fetchHistory();
      fetchUserAddresses();
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    if (activeBooking && (activeBooking.status === 'ACCEPTED' || activeBooking.status === 'STARTED')) {
      apiClient.get(`/chat/${activeBooking.id}`).then(res => setChatMessages(res.data)).catch(console.error);

      const socket = new SockJS('http://localhost:8085/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        onConnect: () => {
          client.subscribe(`/topic/chat/${activeBooking.id}`, (msg) => {
            const m = JSON.parse(msg.body);
            setChatMessages(prev => [...prev, m]);
            if (!showChat) {
              setUnreadCount(prev => prev + 1);
            }
          });
        }
      });
      client.activate();
      stompClient.current = client;

      return () => {
        client.deactivate();
      };
    }
  }, [activeBooking?.id, activeBooking?.status]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const handleSendMessage = (text: string) => {
    if (!stompClient.current || !activeBooking) return;
    const msg = { senderId: user?.id, senderRole: 'CUSTOMER', message: text };
    stompClient.current.publish({ destination: `/app/chat/${activeBooking.id}`, body: JSON.stringify(msg) });
  };

  // Re-fetch when category or address changes and we are in MAP view
  useEffect(() => {
    if (selectedAddress && viewState === 'MAP') {
      fetchProviders(selectedAddress.latitude, selectedAddress.longitude, selectedCategory);
      setSelectedProvider(null);
    }
  }, [selectedCategory, selectedAddress, viewState]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <OtpModal isOpen={true} onClose={() => {}} onSuccess={() => {}} />
      </div>
    );
  }

  const handleCategoryClick = (categoryCode: string) => {
    if (!selectedAddress) {
      setShowAddressModal(true);
      return;
    }
    setSelectedCategory(categoryCode);
    setViewState('MAP');
  };

  const handleProviderClick = (provider: any) => {
    setSelectedProvider(provider);
    setViewState('DETAILS');
  };

  const submitReview = async (rating: number, comment: string) => {
    if (!ratingBooking) return;
    try {
      await apiClient.post('/reviews/create', {
        bookingId: ratingBooking.id,
        customerId: user?.id,
        providerId: ratingBooking.providerId,
        rating,
        comment
      });
      setRatingBooking(null);
      alert('Review submitted successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to submit review');
    }
  };

  const categories = [
    { name: 'Auto Mechanic', code: 'AUTO_MECHANIC', icon: <Wrench className="w-8 h-8" />, color: 'blue' },
    { name: 'AC Technician', code: 'AC_TECHNICIAN', icon: <Briefcase className="w-8 h-8" />, color: 'purple' },
    { name: 'Electrician', code: 'ELECTRICIAN', icon: <Zap className="w-8 h-8" />, color: 'yellow' },
    { name: 'Plumber', code: 'PLUMBER', icon: <Droplet className="w-8 h-8" />, color: 'sky' }
  ];

  return (
    <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-6 shrink-0 relative z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setViewState('HOME'); setSelectedProvider(null); setShowHistory(false); }}>
          <img src="/logo.jpeg" alt="Service Mitra Logo" className="h-10 w-auto object-contain rounded-lg" />
          <span className="text-xl md:text-2xl font-black tracking-tight text-slate-800 hidden sm:block">
            Service<span className="text-blue-600">Mitra</span>
          </span>
        </div>
        
        {/* Address Selector */}
        <div className="flex-1 max-w-md mx-4">
          <button 
            onClick={() => setShowAddressModal(true)}
            className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 px-4 py-2.5 rounded-xl transition-colors text-left"
          >
            <div className="flex items-center truncate">
              <MapPin className="w-5 h-5 text-blue-600 mr-2 shrink-0" />
              <div className="truncate">
                <p className="text-xs text-slate-500 font-bold uppercase">Deliver To</p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {selectedAddress ? `${selectedAddress.title} - ${selectedAddress.addressLine}` : 'Select an Address'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </button>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
           <button onClick={() => { setShowHistory(!showHistory); fetchHistory(); }} className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 w-10 h-10 md:w-auto md:px-4 md:py-2 rounded-full font-bold transition-colors">
             <History className="w-5 h-5 md:mr-2" /> <span className="hidden md:block">History</span>
           </button>
           <div className="text-right hidden lg:block ml-2">
             <p className="font-bold text-slate-800 text-sm">{user?.fullName}</p>
             <p className="text-xs text-slate-500">{user?.email}</p>
           </div>
           <div className="w-10 h-10 bg-blue-100 hover:bg-blue-200 transition-colors rounded-full flex items-center justify-center text-blue-700 font-black text-sm border-2 border-blue-200 shadow-sm cursor-pointer" onClick={() => { setViewState('PROFILE'); setShowHistory(false); }} title="Profile">
             {user?.fullName?.charAt(0) || 'U'}
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {showHistory ? (
          <div className="h-full bg-slate-50 p-6 overflow-y-auto animate-in fade-in">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col">
              <header className="p-6 border-b border-slate-200 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-slate-800">Booking History</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-6">
                {bookingHistory.length === 0 ? (
                  <div className="text-center text-slate-400 py-12">No bookings yet.</div>
                ) : (
                  <div className="space-y-4">
                    {bookingHistory.map(b => (
                      <div key={b.id} onClick={async () => {
                        if (['REQUESTED', 'ACCEPTED', 'STARTED'].includes(b.status)) {
                          if (b.providerId) {
                            try {
                              const res = await apiClient.get(`/providers/${b.providerId}`);
                              setSelectedProvider(res.data);
                            } catch (e) { console.error(e); }
                          }
                          setViewState('TRACKING');
                          setShowHistory(false);
                        } else {
                          setSelectedHistoryBooking(b);
                        }
                      }} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${b.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : b.status === 'REJECTED' || b.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {b.status}
                            </span>
                            <span className="text-slate-500 text-sm">{new Date(b.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{b.problemDescription}</h3>
                          <p className="text-slate-500 text-sm mt-1 flex items-start"><MapPin className="w-4 h-4 mr-1 shrink-0 mt-0.5" /> {b.address}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                          {b.totalBill && <div className="font-black text-xl text-slate-800 flex items-center"><IndianRupee className="w-5 h-5 mr-0.5" />{b.totalBill.toFixed(2)}</div>}
                          {b.status === 'COMPLETED' && (
                            <button onClick={(e) => { e.stopPropagation(); setRatingBooking(b); }} className="bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-sm transition-colors">
                              <Star className="w-4 h-4 text-yellow-500 mr-2" /> Rate Provider
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full relative overflow-hidden flex">
            {viewState === 'PROFILE' && (
              <div className="w-full h-full overflow-y-auto bg-slate-50 p-6 md:p-10 animate-in fade-in">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center mb-8">
                    <button onClick={() => setViewState('HOME')} className="p-2 mr-4 bg-white border border-slate-200 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">My Profile</h1>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 mb-6">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-4xl border-4 border-blue-50 shadow-inner">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-800">{user?.fullName}</h2>
                        <span className="inline-block mt-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Customer Account</span>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 shrink-0 text-slate-500"><User className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-500">Full Name</p>
                          <p className="text-lg font-bold text-slate-800">{user?.fullName}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 shrink-0 text-slate-500"><Mail className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-500">Email Address</p>
                          <p className="text-lg font-bold text-slate-800">{user?.email || 'Not Provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 shrink-0 text-slate-500"><Phone className="w-6 h-6" /></div>
                        <div>
                          <p className="text-sm font-bold text-slate-500">Phone Number</p>
                          <p className="text-lg font-bold text-slate-800">{user?.phone ? `+91 ${user.phone}` : 'Not Provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setShowAddressModal(true)} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between group">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform"><MapPin className="w-6 h-6" /></div>
                        <div className="text-left">
                          <h3 className="font-bold text-slate-800 text-lg">Manage Addresses</h3>
                          <p className="text-sm text-slate-500">Add or remove locations</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                    </button>

                    <button onClick={logout} className="bg-red-50 p-6 rounded-3xl border border-red-100 hover:border-red-300 hover:bg-red-100 transition-all flex items-center justify-between group">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-white text-red-600 rounded-xl shadow-sm flex items-center justify-center mr-4 group-hover:scale-110 transition-transform"><LogOut className="w-6 h-6" /></div>
                        <div className="text-left">
                          <h3 className="font-bold text-red-700 text-lg">Log Out</h3>
                          <p className="text-sm text-red-500">Sign out of your account</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-300 group-hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {viewState === 'HOME' && (
              <div className="w-full h-full overflow-y-auto bg-slate-50 p-6 md:p-10 animate-in fade-in">
                <div className="max-w-5xl mx-auto">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">What do you need help with?</h1>
                  <p className="text-lg text-slate-500 mb-10">Find trusted professionals for your vehicle or home in minutes.</p>

                  <div className="relative mb-12 shadow-xl shadow-slate-200/50 rounded-2xl">
                    <Search className="absolute left-6 top-5 w-6 h-6 text-slate-400" />
                    <input type="text" placeholder="Search for 'Car repair', 'AC service', etc." className="w-full pl-16 pr-6 py-5 text-lg rounded-2xl border-none outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-800 font-medium" />
                    <button className="absolute right-3 top-3 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors">Search</button>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Service Categories</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((cat) => (
                      <div 
                        key={cat.code} 
                        onClick={() => handleCategoryClick(cat.code)}
                        className={`bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-${cat.color}-300 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center text-center group`}
                      >
                        <div className={`w-16 h-16 bg-${cat.color}-50 text-${cat.color}-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          {cat.icon}
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{cat.name}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewState !== 'HOME' && viewState !== 'PROFILE' && (
              <div className="h-full w-full bg-slate-50 overflow-y-auto">
                {viewState === 'MAP' && (
                  <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in">
                    <div className="flex items-center gap-4 mb-8">
                      <button onClick={() => setViewState('HOME')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm border border-slate-200 transition-colors shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-2">
                          <Filter className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                          {selectedCategory ? selectedCategory.replace('_', ' ') : 'All Services'}
                        </h2>
                        <p className="text-sm md:text-base text-slate-500 font-bold mt-1 uppercase tracking-wider">Available Professionals Nearby</p>
                      </div>
                    </div>

                    {isLoadingProviders ? (
                       <div className="text-center py-20">
                         <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                         <p className="font-bold text-slate-500 animate-pulse text-lg">Finding the best professionals for you...</p>
                       </div>
                    ) : providersList.length === 0 ? (
                       <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-2xl mx-auto">
                         <Briefcase className="w-20 h-20 mx-auto text-slate-300 mb-6" />
                         <h3 className="text-2xl font-black text-slate-800 mb-3">No providers available</h3>
                         <p className="text-slate-500 text-lg">We couldn't find any active providers for this service in your area right now.</p>
                         <button onClick={() => setViewState('HOME')} className="mt-8 bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-800 transition-colors text-lg">Explore Other Services</button>
                       </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {providersList.map((provider) => (
                          <div 
                            key={provider.id} 
                            onClick={() => handleProviderClick(provider)} 
                            className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200 cursor-pointer group transition-all duration-300 hover:-translate-y-1"
                          >
                            <div className="relative h-48 overflow-hidden bg-slate-200">
                              <img src={provider.img || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-bold border border-white/20">
                                  {provider.category?.replace('_', ' ')}
                                </div>
                                <div className="bg-green-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span> Available Now
                                </div>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-black text-xl text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{provider.name}</h3>
                                <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg flex items-center text-sm font-black shrink-0 ml-2">
                                  <Star className="w-4 h-4 fill-yellow-500 mr-1" /> {typeof provider.rating === 'number' ? provider.rating.toFixed(1) : provider.rating}
                                </div>
                              </div>
                              <p className="text-sm font-bold text-slate-500 flex items-center mb-6">
                                <User className="w-4 h-4 mr-1.5 text-slate-400" /> {provider.owner || 'Verified Pro'}
                              </p>
                              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                                <div className="flex items-center text-sm font-black text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                  <MapPin className="w-4 h-4 mr-1.5 text-blue-500" /> {provider.distance} away
                                </div>
                                <button className="text-blue-600 font-bold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                                  View Details <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {viewState === 'DETAILS' && selectedProvider && (
                  <div className="max-w-4xl mx-auto p-4 md:p-8 h-full">
                    <ProviderDetails 
                      provider={selectedProvider} 
                      onBack={() => setViewState('MAP')} 
                      onBook={() => setViewState('BOOKING')} 
                    />
                  </div>
                )}

                {viewState === 'BOOKING' && selectedProvider && selectedAddress && (
                  <div className="max-w-4xl mx-auto p-4 md:p-8 h-full">
                    <BookingForm 
                      provider={selectedProvider} 
                      userAddress={selectedAddress}
                      onBack={() => setViewState('DETAILS')} 
                      onConfirm={async (data) => {
                         try {
                           await apiClient.post('/bookings/create', {
                             customerId: user?.id,
                             providerId: selectedProvider.id,
                             address: data.address,
                             problem: data.problem,
                             scheduledFor: data.scheduledFor,
                             specialInstructions: data.specialInstructions,
                             problemImageUrls: data.problemImageUrls,
                             paymentMethod: data.paymentMethod
                           });
                           setViewState('TRACKING');
                         } catch (e: any) {
                           console.error("Failed to book:", e);
                           const errorMsg = e.response?.data?.error || "Booking failed. The selected slot might be taken, or you have a duplicate request.";
                           alert(errorMsg);
                         }
                      }} 
                    />
                  </div>
                )}

                {viewState === 'TRACKING' && activeBooking && (
                  <div className="max-w-4xl mx-auto p-4 md:p-8 h-full">
                    <OrderTrackingView 
                      booking={activeBooking} 
                      provider={selectedProvider} 
                      onCancel={() => cancelOrder(activeBooking.id)} 
                      onOpenChat={() => setShowChat(true)} 
                      unreadCount={unreadCount} 
                    />
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {activeBooking && viewState !== 'TRACKING' && !hideCapsule && (
          <ActiveBookingCapsule 
            booking={activeBooking} 
            onOpenChat={() => setShowChat(true)} 
            onOpenTracking={(providerDetails) => {
              if (providerDetails) {
                setSelectedProvider(providerDetails);
              }
              setViewState('TRACKING');
            }}
            unreadCount={unreadCount}
            onClose={() => setHideCapsule(true)}
          />
        )}

      </div>
      
      <ChatModal isOpen={showChat} onClose={() => setShowChat(false)} messages={chatMessages} onSendMessage={handleSendMessage} userRole="CUSTOMER" userId={user?.id} />
      <BookingDetailsModal isOpen={!!selectedHistoryBooking} onClose={() => setSelectedHistoryBooking(null)} booking={selectedHistoryBooking} />
      <RatingModal isOpen={!!ratingBooking} onClose={() => setRatingBooking(null)} booking={ratingBooking} onSubmit={submitReview} />
      <ManageAddressesModal 
        isOpen={showAddressModal} 
        onClose={() => {
           setShowAddressModal(false);
           fetchUserAddresses();
        }} 
        onAddressSelected={(addr) => {
           setSelectedAddress(addr);
           setShowAddressModal(false);
        }}
      />
    </div>
  );
};
