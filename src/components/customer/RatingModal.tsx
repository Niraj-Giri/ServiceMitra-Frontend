import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

export const RatingModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, booking: any, onSubmit: (rating: number, comment: string) => Promise<void> }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-black text-slate-800">Rate your Experience</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-slate-500 mb-6">How was the service provided?</p>
        
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star className={`w-10 h-10 ${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)..."
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none min-h-[100px] mb-6"
        />

        <button 
          disabled={!rating || submitting}
          onClick={async () => {
            setSubmitting(true);
            await onSubmit(rating, comment);
            setSubmitting(false);
          }}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/30"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};
