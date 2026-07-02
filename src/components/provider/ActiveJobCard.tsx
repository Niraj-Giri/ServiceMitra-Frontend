import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin } from 'lucide-react';

export const ActiveJobCard = ({ job, onClick }: { job: any, onClick: () => void }) => {
  const [timeText, setTimeText] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!job.scheduledFor) {
        setTimeText('Immediate');
        return;
      }

      const scheduledTime = new Date(job.scheduledFor).getTime();
      const now = new Date().getTime();
      const diff = scheduledTime - now;

      if (diff > 0) {
        // Upcoming
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
          setTimeText(`In ${hours}h ${minutes}m`);
        } else {
          setTimeText(`In ${minutes}m`);
        }
      } else {
        // Started/In progress
        const elapsed = Math.abs(diff);
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        setTimeText(`Started ${hours > 0 ? `${hours}h ` : ''}${minutes}m ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [job.scheduledFor]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 border-t-4 border-t-green-500 relative overflow-hidden mb-4">
      <div className="absolute top-0 right-0 p-4 opacity-10"><Briefcase className="w-24 h-24" /></div>
      <div className="flex justify-between items-start relative z-10 mb-2 gap-2">
        <h3 className="font-bold text-slate-800 text-lg leading-tight">{job.problemDescription}</h3>
        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${timeText.includes('In ') ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
          {timeText}
        </span>
      </div>
      <p className="text-sm text-slate-500 flex items-start mt-2 mb-6 relative z-10">
        <MapPin className="w-4 h-4 mr-1 mt-0.5 shrink-0" />
        {job.address}
      </p>
      <button 
        onClick={onClick}
        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3 rounded-xl transition-colors relative z-10">
        View Details
      </button>
    </div>
  );
};
