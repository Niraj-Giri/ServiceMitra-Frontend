import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Booking } from '../../types';
import { ChatBox } from '../../components/chat/ChatBox';

export const BookingTracking: React.FC = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);

  // Rating State
  const [punctuality, setPunctuality] = useState(5);
  const [quality, setQuality] = useState(5);
  const [behavior, setBehavior] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState('');

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRatingError('');
    try {
      await apiClient.post('/ratings', {
        bookingId: Number(bookingId),
        punctualityScore: punctuality,
        qualityScore: quality,
        behaviorScore: behavior,
        comment: comment
      });
      setSubmitted(true);
    } catch (err: any) {
      setRatingError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // Poll for booking status updates
        const response = await apiClient.get(`/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBooking();
    const interval = setInterval(fetchBooking, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  if (!booking) return <div className="text-center py-20">Loading tracking...</div>;

  const steps = ['PENDING', 'ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED'];

  const getStatusIndex = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PENDING_DISPATCH' || s === 'ASSIGNED') return 0;
    return steps.indexOf(s);
  };

  const getStatusMessage = () => {
    const s = (booking.status || '').toUpperCase();
    switch(s) {
      case 'PENDING':
      case 'PENDING_DISPATCH': 
        return 'Looking for the best provider nearby...';
      case 'ASSIGNED':
        return 'Request sent! Waiting for provider to accept...';
      case 'ACCEPTED': return 'A provider has accepted your request!';
      case 'ARRIVED': return 'Provider has arrived at your location.';
      case 'STARTED': return 'Service is currently in progress.';
      case 'COMPLETED': return 'Service completed successfully.';
      case 'CANCELLED': return 'Booking was cancelled.';
      default: return 'Processing your request...';
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">

  {/* Header */}
  <div className="flex items-center justify-between mb-8">
    <div>
      <p className="text-sm text-slate-500 font-medium">
        Booking #{booking.id}
      </p>

      <h2 className="text-3xl font-bold text-slate-900 mt-1">
        {getStatusMessage()}
      </h2>
    </div>

    <span
      className={`
      px-4 py-2 rounded-full text-sm font-semibold
      ${
        booking.status === "COMPLETED"
          ? "bg-green-100 text-green-700"
          : booking.status === "STARTED"
          ? "bg-blue-100 text-blue-700"
          : booking.status === "CANCELLED"
          ? "bg-red-100 text-red-700"
          : "bg-yellow-100 text-yellow-700"
      }
      `}
    >
      {booking.status}
    </span>
  </div>

  {/* Horizontal Timeline */}

  <div className="relative">

    {/* Progress Line */}

    <div className="absolute left-0 right-0 top-5 h-1 bg-slate-200 rounded-full" />

    <div
      className="absolute left-0 top-5 h-1 bg-blue-600 rounded-full transition-all duration-700"
      style={{
        width: `${
          ((getStatusIndex(booking.status) + 1) / steps.length) * 100
        }%`,
      }}
    />

    <div className="relative flex justify-between">

      {steps.map((step, index) => {

        const current = getStatusIndex(booking.status);

        const completed = index < current;

        const active = index === current;

        return (

          <div
            key={step}
            className="flex flex-col items-center flex-1"
          >

            <div
              className={`
              w-10
              h-10
              rounded-full
              flex
              items-center
              justify-center
              text-sm
              font-bold
              border-4
              transition-all

              ${
                completed
                  ? "bg-green-500 border-green-500 text-white"
                  : active
                  ? "bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-200"
                  : "bg-white border-slate-300 text-slate-400"
              }
              `}
            >
              {completed ? "✓" : index + 1}
            </div>

            <div className="mt-3 text-center">

              <p
                className={`
                text-sm
                font-semibold

                ${
                  completed || active
                    ? "text-slate-900"
                    : "text-slate-400"
                }
                `}
              >
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </p>

            </div>

          </div>

        );

      })}

    </div>

  </div>

</div>

          {/* Job Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-3">Service Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Scheduled Time</span>
                <span className="font-semibold text-gray-800">{new Date(booking.scheduledAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Service Address</span>
                <span className="font-semibold text-gray-800">{booking.address || 'Not Specified'}</span>
              </div>
              {booking.notes && (
                <div className="col-span-1 md:col-span-2">
                  <span className="text-gray-500 block">Problem Description</span>
                  <span className="text-slate-700 bg-slate-50 p-3 rounded-lg block mt-1 border border-slate-100">{booking.notes}</span>
                </div>
              )}
            </div>

            {/* Provider Details (Show if assigned, accepted or later status) */}
            {booking.provider && ['ASSIGNED', 'ACCEPTED', 'ARRIVED', 'STARTED', 'COMPLETED'].includes((booking.status || '').toUpperCase()) && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center overflow-hidden border border-blue-200">
                    {booking.provider.profilePhotoUrl ? (
                      <img src={booking.provider.profilePhotoUrl} alt={booking.provider.name} className="w-full h-full object-cover" />
                    ) : (
                      booking.provider.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{booking.provider.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{booking.provider.businessName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px] mb-0.5">Rating</span>
                    <span className="font-extrabold text-yellow-600">★ {(booking.provider.ratingCache ?? 0) > 0 ? booking.provider.ratingCache?.toFixed(1) : '5.0'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px] mb-0.5">Phone Number</span>
                    <span className="font-extrabold text-slate-700">{booking.provider.phone}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start OTP System */}
            {(booking.status || '').toUpperCase() === 'ACCEPTED' && booking.startOtp && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 text-center space-y-2">
                <span className="text-yellow-800 font-bold block">Start Job OTP</span>
                <span className="text-3xl font-extrabold tracking-widest text-slate-800 block">{booking.startOtp}</span>
                <p className="text-xs text-yellow-700">Give this OTP to the provider when they arrive to start the service.</p>
              </div>
            )}

            {/* Rating & Review Form (Only for Completed Booking) */}
            {(booking.status || '').toUpperCase() === 'COMPLETED' && (
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h3 className="text-lg font-bold text-gray-900">Rate this Service</h3>
                
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center text-sm font-semibold">
                    Thank you for your feedback! Your review has been submitted successfully.
                  </div>
                ) : (
                  <form onSubmit={handleRatingSubmit} className="space-y-4">
                    {ratingError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold">
                        {ratingError}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      {/* Punctuality Rating */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Punctuality</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setPunctuality(star)}
                              className={`text-2xl transition-colors ${
                                star <= punctuality ? 'text-yellow-400' : 'text-gray-200'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality Rating */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Quality of Work</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setQuality(star)}
                              className={`text-2xl transition-colors ${
                                star <= quality ? 'text-yellow-400' : 'text-gray-200'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Behavior Rating */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Behavior & Professionalism</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setBehavior(star)}
                              className={`text-2xl transition-colors ${
                                star <= behavior ? 'text-yellow-400' : 'text-gray-200'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Write a Comment (Optional)</label>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your experience working with this professional..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50 text-sm"
                    >
                      {submitting ? 'Submitting Review...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[600px] flex flex-col">
            <div className="bg-blue-600 p-4 text-white">
              <h3 className="font-bold">Chat with Provider</h3>
              <p className="text-blue-100 text-sm">Usually replies in minutes</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatBox bookingId={Number(bookingId)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
