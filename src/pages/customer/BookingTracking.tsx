import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { Booking } from '../../types';
import { ChatBox } from '../../components/chat/ChatBox';
import { getTaskById } from '../../api/tasks';

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
  const [existingRating, setExistingRating] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Complaint State
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintSubject, setComplaintSubject] = useState('Service Dispute');
  const [complaintDesc, setComplaintDesc] = useState('');
  const [complaintPriority, setComplaintPriority] = useState('MEDIUM');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintError, setComplaintError] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingComplaint(true);
    setComplaintError('');
    try {
      await apiClient.post('/complaints', {
        bookingId: Number(bookingId),
        subject: complaintSubject,
        description: complaintDesc,
        priority: complaintPriority
      });
      setComplaintSuccess(true);
      setTimeout(() => {
        setShowComplaintModal(false);
        setComplaintSuccess(false);
        setComplaintDesc('');
      }, 2000);
    } catch (err: any) {
      setComplaintError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setRatingError('');
    try {
      if (existingRating) {
        // Edit existing review
        const response = await apiClient.put(`/ratings/bookings/${bookingId}`, {
          bookingId: Number(bookingId),
          punctualityScore: punctuality,
          qualityScore: quality,
          behaviorScore: behavior,
          comment: comment
        });
        const updated = response.data.data || response.data;
        setExistingRating(updated);
        setIsEditing(false);
      } else {
        // Submit new review
        const response = await apiClient.post('/ratings', {
          bookingId: Number(bookingId),
          punctualityScore: punctuality,
          qualityScore: quality,
          behaviorScore: behavior,
          comment: comment
        });
        const created = response.data.data || response.data;
        setExistingRating(created);
      }
      setSubmitted(true);
    } catch (err: any) {
      setRatingError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let ratingFetched = false;
    const fetchBooking = async () => {
      try {
        const task = await getTaskById(Number(bookingId), false);
        const acceptedQuote = task.quotes?.find(q => q.id === task.acceptedQuoteId);

        const mapped: Booking = {
          id: task.id,
          serviceName: task.serviceName || task.category,
          scheduledAt: task.preferredDate || task.createdAt,
          customer: task.customer ? { name: task.customer.name, phone: task.customer.phone } : null,
          address: task.address,
          notes: task.description,
          status: task.status as any,
          amountNpr: task.finalAmountNpr,
          baseAmount: task.finalAmountNpr,
          totalBill: task.finalAmountNpr,
          platformFee: task.platformFee,
          providerEarnings: task.finalAmountNpr ? task.finalAmountNpr * 0.90 : 0,
          startOtp: task.startOtp,
          provider: acceptedQuote ? {
            id: acceptedQuote.providerId,
            name: acceptedQuote.providerName,
            businessName: acceptedQuote.providerBusinessName,
            phone: acceptedQuote.providerPhone,
            profilePhotoUrl: acceptedQuote.providerProfilePhoto,
            ratingCache: acceptedQuote.providerRating ? Number(acceptedQuote.providerRating) : 5.0
          } : null
        } as any;

        setBooking(mapped);

        if (task.status === 'COMPLETED' && !ratingFetched) {
          try {
            const ratingResponse = await apiClient.get(`/ratings/bookings/${bookingId}`);
            if (ratingResponse.data) {
              const rat = ratingResponse.data.data || ratingResponse.data;
              setExistingRating(rat);
              setPunctuality(rat.punctualityScore);
              setQuality(rat.qualityScore);
              setBehavior(rat.behaviorScore);
              setComment(rat.comment || '');
              setSubmitted(true);
              ratingFetched = true;
            }
          } catch (e) {
            // Ignore 404/not found errors when rating doesn't exist yet
          }
        }
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

  const bookingStatus = (booking.status || '').toUpperCase();
  const showChat = ['ACCEPTED', 'STARTED'].includes(bookingStatus);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:py-8">
      <div className={showChat ? "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8" : "max-w-2xl mx-auto space-y-6"}>
        <div className={showChat ? "lg:col-span-2 space-y-6" : "w-full space-y-6"}>
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-8">

  {/* Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
    <div>
      <p className="text-sm text-slate-500 font-medium">
        Booking #{booking.id}
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
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
                text-[10px] sm:text-sm
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 space-y-6">
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
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Rate this Service</h3>
                  <button 
                    type="button"
                    onClick={() => setShowComplaintModal(true)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 underline focus:outline-none"
                  >
                    Report an Issue / File Dispute
                  </button>
                </div>
                
                {submitted && !isEditing ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center text-sm font-semibold">
                      Thank you for your feedback! Your review has been submitted.
                    </div>
                    {existingRating && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-sm">
                        <div className="flex justify-between items-center font-bold text-slate-800">
                          <span>Your Ratings:</span>
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                          >
                            Edit Review
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-700">
                          <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl text-center">
                            <span className="block text-slate-400 text-[10px] uppercase mb-0.5">Punctuality</span>
                            <span className="text-yellow-600 font-bold">★ {existingRating.punctualityScore}</span>
                          </div>
                          <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl text-center">
                            <span className="block text-slate-400 text-[10px] uppercase mb-0.5">Quality</span>
                            <span className="text-yellow-600 font-bold">★ {existingRating.qualityScore}</span>
                          </div>
                          <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl text-center">
                            <span className="block text-slate-400 text-[10px] uppercase mb-0.5">Behavior</span>
                            <span className="text-yellow-600 font-bold">★ {existingRating.behaviorScore}</span>
                          </div>
                        </div>
                        {existingRating.comment && (
                          <div className="bg-white border border-slate-200/60 p-3 rounded-xl italic text-slate-700">
                            "{existingRating.comment}"
                          </div>
                        )}
                      </div>
                    )}
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

        {showChat && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[380px] sm:h-[500px] lg:h-[600px] flex flex-col">
              <div className="bg-blue-600 p-4 text-white">
                <h3 className="font-bold">Chat with Provider</h3>
                <p className="text-blue-100 text-sm">Usually replies in minutes</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatBox taskRequestId={Number(bookingId)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COMPLAINT MODAL */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-extrabold text-slate-950 text-base">File a Complaint</h3>
            {complaintSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-center text-sm font-semibold">
                Complaint submitted successfully! Redirecting...
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-4 text-sm">
                {complaintError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold">
                    {complaintError}
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Issue Topic / Subject</label>
                  <select
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="Overcharged">Pricing disagreement / Overcharged</option>
                    <option value="Poor Quality">Poor quality of service</option>
                    <option value="Incomplete Work">Work left incomplete</option>
                    <option value="Damages">Property damages caused</option>
                    <option value="No Show">Provider did not show up</option>
                    <option value="Other">Other / General dispute</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="Provide details about the issue so administrators can investigate..."
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Urgency Priority</label>
                  <select
                    value={complaintPriority}
                    onChange={(e) => setComplaintPriority(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => setShowComplaintModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl">Cancel</button>
                  <button type="submit" disabled={submittingComplaint} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50">
                    {submittingComplaint ? 'Submitting...' : 'File Complaint'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
