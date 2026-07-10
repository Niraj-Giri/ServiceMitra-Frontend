import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Service } from '../../types';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ChevronDown, MapPin, Search, ShieldCheck, SlidersHorizontal, Star } from 'lucide-react';

interface Review {
  id: number;
  bookingId: number;
  customerId: number;
  punctualityScore: number;
  qualityScore: number;
  behaviorScore: number;
  overallScore: number;
  comment: string;
  createdAt: string;
}

interface Provider {
  id: number;
  businessName: string;
  name: string;
  age: number;
  description: string;
  phone: string;
  email: string;
  serviceCategory: string;
  address: string;
  ratingCache: number;
  totalJobs: number;
  experienceYears: number;
  profilePhotoUrl: string;
  skills: string;
  distance: number | null;
  lastJobCompletedAt?: string;
  languages?: string;
  reviews: Review[];
}

export const ProviderSelection: React.FC = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [service, setService] = useState<Service | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [expandedReviewsId, setExpandedReviewsId] = useState<number | null>(null);
  const [selectedProviderDetails, setSelectedProviderDetails] = useState<Provider | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Reward points loyalty states
  const [rewardPoints, setRewardPoints] = useState<number>(0);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [redeemChecked, setRedeemChecked] = useState<boolean>(false);

  // Fetch customer's reward points balance
  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await apiClient.get('/loyalty/points');
        setRewardPoints(res.data.pointsBalance || 0);
      } catch (err) {
        console.error('Failed to fetch loyalty points', err);
      }
    };
    fetchPoints();
  }, []);

  const isProviderInCooldown = (lastCompletedAtStr?: string) => {
    if (!lastCompletedAtStr || !bookingState?.scheduledAt) return false;
    try {
      const lastJobTime = new Date(lastCompletedAtStr).getTime();
      const requestedTime = new Date(bookingState.scheduledAt).getTime();
      const diffMs = requestedTime - lastJobTime;
      // Cooldown of 30 minutes (30 * 60 * 1000 = 1,800,000 ms)
      return diffMs >= 0 && diffMs < 30 * 60 * 1000;
    } catch (e) {
      return false;
    }
  };

  // Sorting & Filtering State
  const [sortBy, setSortBy] = useState<'DISTANCE' | 'RATING' | 'EXPERIENCE' | 'JOBS'>('DISTANCE');
  const [maxDistance, setMaxDistance] = useState<number>(30); // 30 km max by default
  const [minRating, setMinRating] = useState<number>(0); // 0 means any rating
  const [searchQuery, setSearchQuery] = useState('');

  // Extract booking details passed from Step 1 (Checkout page)
  const bookingState = location.state as {
    scheduledAt: string;
    address: string;
    latitude: number;
    longitude: number;
    notes: string;
    saveAddress: boolean;
    addressLabel: string;
  } | null;

  // Validate state - if missing, redirect user back to Step 1 checkout form
  useEffect(() => {
    if (!bookingState || !bookingState.scheduledAt || !bookingState.address) {
      console.warn('Booking details state missing, redirecting back to Step 1 checkout');
      navigate(`/checkout/${serviceId}`);
    }
  }, [bookingState, serviceId, navigate]);

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

  // Fetch online providers in same category with distance calculations
  useEffect(() => {
    if (!service?.category || !bookingState) return;
    const fetchProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await apiClient.get(
          `/providers?category=${service.category}&lat=${bookingState.latitude}&lng=${bookingState.longitude}`
        );
        setProviders(response.data);
      } catch (err) {
        console.error('Failed to fetch providers', err);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, [service?.category, bookingState]);

  // Perform filtering & sorting in frontend dynamically
  const filteredAndSortedProviders = providers
    .filter(provider => {
      // 1. Distance filter (if distance is calculated)
      if (provider.distance !== null && provider.distance > maxDistance) {
        return false;
      }
      // 2. Minimum Rating filter
      const rating = provider.ratingCache || 5.0;
      if (rating < minRating) {
        return false;
      }
      // 3. Search query (matches name, business name, description, or skills)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (provider.name || '').toLowerCase().includes(query);
        const matchesBusiness = (provider.businessName || '').toLowerCase().includes(query);
        const matchesDesc = (provider.description || '').toLowerCase().includes(query);
        const matchesSkills = (provider.skills || '').toLowerCase().includes(query);
        if (!matchesName && !matchesBusiness && !matchesDesc && !matchesSkills) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      // Sort dynamically
      if (sortBy === 'DISTANCE') {
        const distA = a.distance !== null ? a.distance : 9999;
        const distB = b.distance !== null ? b.distance : 9999;
        return distA - distB;
      }
      if (sortBy === 'RATING') {
        const ratA = a.ratingCache || 0;
        const ratB = b.ratingCache || 0;
        return ratB - ratA;
      }
      if (sortBy === 'EXPERIENCE') {
        return (b.experienceYears || 0) - (a.experienceYears || 0);
      }
      if (sortBy === 'JOBS') {
        return b.totalJobs - a.totalJobs;
      }
      return 0;
    });

  const handleBookProvider = async (providerId: number) => {
    if (!bookingState) return;
    setBookingInProgress(true);

    try {
      // 1. Save address to account if checkbox was selected in Step 1
      if (bookingState.saveAddress) {
        try {
          await apiClient.post('/users/addresses', {
            label: bookingState.addressLabel,
            line1: bookingState.address,
            latitude: bookingState.latitude,
            longitude: bookingState.longitude,
            isDefault: false
          });
        } catch (addrErr) {
          console.warn('Address could not be saved to account:', addrErr);
          // Don't block booking if address save fails
        }
      }

      // 2. Submit the booking details directly to backend
      const response = await apiClient.post('/bookings', {
        serviceId: Number(serviceId),
        scheduledAt: bookingState.scheduledAt,
        addressId: 1, // Default placeholder
        address: bookingState.address,
        notes: bookingState.notes,
        providerId: providerId,
        pointsToRedeem: redeemChecked ? pointsToRedeem : 0
      });

      // 3. Navigate directly to tracking screen
      navigate(`/tracking/${response.data.id}`);
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error?.message || err.message;
      setAlertConfig({
        title: "Booking Failed",
        message: serverMessage || 'Booking submission failed. Please try again.',
        type: "error"
      });
      setBookingInProgress(false);
    }
  };

  if (!service || !bookingState) return <div className="mx-auto max-w-7xl px-4 py-10"><div className="glass-panel rounded-2xl py-16 text-center text-slate-500 font-medium">Loading professionals...</div></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Step Indicator */}
      <div className="glass-panel mb-8 flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Step 2 of 2</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Choose a Professional</h1>
          <p className="text-sm text-slate-500 mt-2">Compare verified pros by rating, distance, jobs completed, and experience.</p>
        </div>
        <div className="flex gap-2">
          <span className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-extrabold text-xs">1</span>
          <span className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shadow-lg shadow-blue-600/20">2</span>
        </div>
      </div>

      {/* Sorting & Filters Dashboard */}
      <div className="glass-panel mb-8 grid grid-cols-1 gap-5 rounded-2xl p-5 md:grid-cols-4 md:items-center">
        {/* Sort selector */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"
          >
            <option value="DISTANCE">Closest Distance</option>
            <option value="RATING">Highest Rating</option>
            <option value="EXPERIENCE">Most Experienced</option>
            <option value="JOBS">Jobs Completed</option>
          </select>
        </div>

        {/* Max Distance range slider */}
        <div>
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <span>Max Distance</span>
            <span className="text-blue-600 font-extrabold">{maxDistance} km</span>
          </div>
          <input
            type="range"
            min="2"
            max="50"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Min Rating select */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Star className="h-3.5 w-3.5" /> Minimum Rating
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"
          >
            <option value="0">Any Rating (All)</option>
            <option value="4">★ 4.0 & above</option>
            <option value="4.5">★ 4.5 & above</option>
            <option value="4.8">★ 4.8 & above</option>
          </select>
        </div>

        {/* Keyword Search */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Search className="h-3.5 w-3.5" /> Search Skills / Name
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search wiring, leak, Hari..."
            className="focus-ring w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"
          />
        </div>
      </div>

      {/* Reward Points redemption panel */}
      {rewardPoints > 0 && (
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/20 border border-blue-100 rounded-2xl p-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="text-blue-500 text-lg">🎁</span> Reward Points Loyalty Program
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You have <span className="font-bold text-blue-600 font-mono">{rewardPoints}</span> points available. 
              You can redeem them for a discount of Rs. {Math.min(rewardPoints, service?.basePrice || 0)} on this booking.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 border border-slate-100 rounded-xl shadow-sm self-stretch md:self-auto justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={redeemChecked}
                onChange={(e) => {
                  setRedeemChecked(e.target.checked);
                  setPointsToRedeem(e.target.checked ? Math.min(rewardPoints, service?.basePrice || 0) : 0);
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700">Apply points discount</span>
            </label>
            {redeemChecked && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                - Rs. {pointsToRedeem}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Providers List (Left Side) */}
        <div className="lg:col-span-2 space-y-4">
          {loadingProviders ? (
            <div className="glass-panel text-center py-12 rounded-2xl text-slate-500 font-medium">
              Finding online professionals in your area...
            </div>
          ) : filteredAndSortedProviders.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center font-medium text-amber-800">
              {providers.length === 0 
                ? "No professionals are currently online for this service category. Please try again later."
                : "No professionals match your current filter criteria. Try relaxing your filters."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedProviders.map(provider => {
                const isReviewsExpanded = expandedReviewsId === provider.id;
                const skillList = provider.skills ? provider.skills.split(',').map(s => s.trim()) : [];
                
                return (
                  <div
                    key={provider.id}
                    className="service-card overflow-hidden rounded-2xl"
                  >
                    {/* Main Provider Block */}
                    <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div 
                        onClick={() => setSelectedProviderDetails(provider)}
                        className="flex gap-4 items-start cursor-pointer flex-1 group/item"
                      >
                        <div className="relative w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-500 text-xl transition-transform duration-200 group-hover/item:scale-105">
                          {provider.profilePhotoUrl ? (
                            <img src={provider.profilePhotoUrl} alt={provider.name || provider.businessName} className="w-full h-full object-cover" />
                          ) : (
                            (provider.name || provider.businessName).charAt(0)
                          )}
                          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-slate-950 text-base group-hover/item:text-blue-600 transition-colors duration-150">{provider.name || 'Professional'}</h4>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </span>
                            {isProviderInCooldown(provider.lastJobCompletedAt) && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 animate-pulse">
                                ⚠️ Cooldown (30m)
                              </span>
                            )}
                            {provider.age && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">Age {provider.age}</span>
                            )}
                            <span className="text-xs text-slate-400 font-medium">({provider.businessName})</span>
                          </div>

                          {provider.description && (
                            <p className="text-xs text-slate-600 leading-relaxed max-w-lg line-clamp-2">{provider.description}</p>
                          )}

                          {/* Skills Tags */}
                          {skillList.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {skillList.map((skill, idx) => (
                                <span key={idx} className="bg-slate-50 text-slate-600 text-[10px] px-2 py-0.5 rounded-md border border-slate-100 font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Meta details */}
                          <div className="flex items-center gap-3 pt-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700">
                              <Star className="h-3 w-3 fill-current" /> {provider.ratingCache > 0 ? provider.ratingCache.toFixed(1) : '5.0'}
                            </span>
                            <span>•</span>
                            <span>{provider.totalJobs} jobs fulfilled</span>
                            <span>•</span>
                            <span>{provider.experienceYears || 0} years experience</span>
                          </div>
                        </div>
                      </div>

                      {/* Distance & Selection Check */}
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="space-y-1 text-left md:text-right">
                          {provider.distance !== null ? (
                            <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-bold inline-block">
                              <MapPin className="mr-1 inline h-3 w-3" />
                              {provider.distance.toFixed(1)} km away
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Location unavailable</span>
                          )}
                          <div className="text-[10px] text-gray-400 font-medium">{provider.address}</div>
                        </div>

                        <Button
                          onClick={() => handleBookProvider(provider.id)}
                          disabled={bookingInProgress || isProviderInCooldown(provider.lastJobCompletedAt)}
                          className="whitespace-nowrap px-4 py-2 text-xs"
                        >
                          {isProviderInCooldown(provider.lastJobCompletedAt) ? 'In Cooldown' : 'Book Professional'}
                        </Button>
                      </div>
                    </div>

                    {/* Reviews Dropdown Link */}
                    <div className="bg-slate-50 border-t border-slate-100 px-5 py-2.5 flex justify-between items-center text-xs">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedReviewsId(isReviewsExpanded ? null : provider.id)}
                          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5"
                        >
                          {isReviewsExpanded ? 'Hide Reviews' : `View Reviews (${provider.reviews?.length || 0})`}
                          <ChevronDown className={`h-3.5 w-3.5 transition ${isReviewsExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={() => setSelectedProviderDetails(provider)}
                          className="text-slate-600 hover:text-blue-600 font-bold"
                        >
                          View Details & Bio
                        </button>
                      </div>
                      <span className="text-gray-400 font-medium">Languages: {provider.languages || 'English, Nepali'}</span>
                    </div>

                    {/* Reviews Drawer */}
                    {isReviewsExpanded && (
                      <div className="bg-slate-50/50 border-t border-slate-100 p-5 space-y-4">
                        <h5 className="font-bold text-gray-700 text-xs uppercase tracking-wider">Customer Feedback</h5>
                        {(!provider.reviews || provider.reviews.length === 0) ? (
                          <div className="text-xs text-gray-500 italic py-2">No reviews submitted yet for this professional.</div>
                        ) : (
                          <div className="space-y-3">
                            {provider.reviews.map(review => (
                              <div key={review.id} className="bg-white border border-slate-100 p-4 rounded-xl space-y-2.5 shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <span className="text-yellow-500 font-bold text-xs">★ {review.overallScore.toFixed(1)}</span>
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-400 font-medium">Verified Booking #{review.bookingId}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {review.comment && (
                                  <p className="text-xs text-gray-700 italic">"{review.comment}"</p>
                                )}

                                {/* Specific Dimension scores */}
                                <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-50 mt-1">
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span className="font-medium text-slate-400">Punctuality:</span>
                                    <span className="font-bold text-slate-700">{review.punctualityScore}/5</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span className="font-medium text-slate-400">Quality:</span>
                                    <span className="font-bold text-slate-700">{review.qualityScore}/5</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <span className="font-medium text-slate-400">Behavior:</span>
                                    <span className="font-bold text-slate-700">{review.behaviorScore}/5</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selection sidebar (Right Side) */}
        <div className="lg:col-span-1">
          <div className="glass-panel sticky top-24 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-extrabold text-slate-950 border-b border-slate-200 pb-3">Booking Details</h2>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Category</span>
                <span className="font-semibold text-slate-800 text-sm">{service.category}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Selected Listing</span>
                <span className="font-bold text-slate-800 text-base block">{service.name}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Scheduled Time</span>
                <span className="font-bold text-slate-800 text-sm block">
                  {new Date(bookingState.scheduledAt).toLocaleDateString()} at {new Date(bookingState.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider block mb-0.5">Service Address</span>
                <span className="font-medium text-slate-600 text-xs block leading-relaxed">{bookingState.address}</span>
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-between items-center font-bold text-slate-950">
                <span>Total Charge</span>
                <span className="text-lg text-blue-600">Rs. {service.basePrice}</span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/checkout/${serviceId}`)}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Edit details / address
            </button>
          </div>
        </div>
      </div>

      {/* Provider Details Modal Overlay */}
      {selectedProviderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedProviderDetails(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-150 z-10"
            >
              ✕
            </button>

            {/* Profile Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-slate-500 text-3xl relative">
                {selectedProviderDetails.profilePhotoUrl ? (
                  <img src={selectedProviderDetails.profilePhotoUrl} alt={selectedProviderDetails.name} className="w-full h-full object-cover" />
                ) : (
                  selectedProviderDetails.name.charAt(0)
                )}
                {/* Online Indicator */}
                <span className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-green-500 border-2 border-white rounded-full"></span>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2.5">
                  <h3 className="font-extrabold text-2xl text-gray-800">{selectedProviderDetails.name}</h3>
                  {selectedProviderDetails.age && (
                    <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                      Age {selectedProviderDetails.age}
                    </span>
                  )}
                </div>
                <p className="text-blue-600 text-sm font-bold">{selectedProviderDetails.businessName}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400 font-medium">
                  <span>Category: {selectedProviderDetails.serviceCategory}</span>
                  <span>•</span>
                  <span>Languages: {selectedProviderDetails.languages || 'English, Nepali'}</span>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Bio Description */}
              {selectedProviderDetails.description && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">About Professional</h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    {selectedProviderDetails.description}
                  </p>
                </div>
              )}

              {/* Skills Tags */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Skills & Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedProviderDetails.skills || '').split(',').map((skill: string, idx: number) => {
                    const sk = skill.trim();
                    if (!sk) return null;
                    return (
                      <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-xl border border-blue-100 font-bold">
                        {sk}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Rating</span>
                  <span className="text-xl font-extrabold text-yellow-500 font-mono">★ {selectedProviderDetails.ratingCache > 0 ? selectedProviderDetails.ratingCache.toFixed(1) : '5.0'}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Jobs Done</span>
                  <span className="text-xl font-extrabold text-slate-800 font-mono">{selectedProviderDetails.totalJobs}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Experience</span>
                  <span className="text-xl font-extrabold text-slate-800 font-mono">{selectedProviderDetails.experienceYears || 0} Yrs</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">Last Job Done</span>
                  <span className="text-xs font-extrabold text-slate-800 block mt-2 truncate font-mono">
                    {selectedProviderDetails.lastJobCompletedAt 
                      ? new Date(selectedProviderDetails.lastJobCompletedAt).toLocaleDateString()
                      : 'New Joiner'}
                  </span>
                </div>
              </div>

              {/* Base Location Address */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Base Location</h4>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="text-slate-400 text-lg">📍</span>
                  <span>{selectedProviderDetails.address}</span>
                  {selectedProviderDetails.distance !== null && (
                    <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-bold ml-1">
                      {selectedProviderDetails.distance.toFixed(1)} km away
                    </span>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider font-mono">Customer Reviews ({selectedProviderDetails.reviews?.length || 0})</h4>
                
                {(!selectedProviderDetails.reviews || selectedProviderDetails.reviews.length === 0) ? (
                  <div className="text-sm text-slate-400 italic">No reviews submitted yet for this professional.</div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {selectedProviderDetails.reviews.map((review: any) => (
                      <div key={review.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">★ {review.overallScore}/5</span>
                          <span className="text-slate-400 font-medium font-mono">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-600 italic">"{review.comment}"</p>
                        
                        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200/50 text-[9px] text-slate-500 font-semibold uppercase tracking-wider font-mono">
                          <span>Punctuality: <span className="text-slate-700">{review.punctualityScore}/5</span></span>
                          <span>Quality: <span className="text-slate-700">{review.qualityScore}/5</span></span>
                          <span>Behavior: <span className="text-slate-700">{review.behaviorScore}/5</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Area */}
            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Service Charge</span>
                {redeemChecked && pointsToRedeem > 0 ? (
                  <div>
                    <span className="text-sm line-through text-slate-400 font-bold mr-2">Rs. {service?.basePrice}</span>
                    <span className="text-2xl font-extrabold text-emerald-600">Rs. {service ? service.basePrice - pointsToRedeem : 0}</span>
                  </div>
                ) : (
                  <span className="text-2xl font-extrabold text-blue-600">Rs. {service?.basePrice}</span>
                )}
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedProviderDetails(null)}
                  className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-200 hover:border-slate-300 font-bold text-slate-500 hover:text-slate-700 bg-white rounded-xl text-sm transition-colors duration-150"
                >
                  Close Profile
                </button>
                <Button
                  onClick={() => {
                    setSelectedProviderDetails(null);
                    handleBookProvider(selectedProviderDetails.id);
                  }}
                  disabled={bookingInProgress || isProviderInCooldown(selectedProviderDetails.lastJobCompletedAt)}
                  className="flex-1 sm:flex-none px-6 py-2.5 font-bold rounded-xl text-sm shadow-md shadow-blue-100"
                >
                  {isProviderInCooldown(selectedProviderDetails.lastJobCompletedAt) ? 'In Cooldown' : 'Book Professional'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Alert Modal */}
      {alertConfig && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setAlertConfig(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-center animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
              alertConfig.type === 'success' ? 'bg-green-50 text-green-600' :
              alertConfig.type === 'error' ? 'bg-red-50 text-red-600' :
              'bg-blue-50 text-blue-600'
            }`}>
              <span className="text-xl font-bold">
                {alertConfig.type === 'success' ? '✓' : alertConfig.type === 'error' ? '✕' : 'ℹ'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">{alertConfig.title}</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">{alertConfig.message}</p>
            <button
              onClick={() => setAlertConfig(null)}
              className={`w-full font-bold py-3 rounded-xl transition ${
                alertConfig.type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                alertConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
