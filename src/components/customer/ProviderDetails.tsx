import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';

export const ProviderDetails = ({ provider, onBack, onBook }: { provider: any, onBack: () => void, onBook: () => void }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in h-full flex flex-col relative z-10">
    <div className="relative h-64 shrink-0">
      <img src={provider.img || "https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt={provider.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
      <button onClick={onBack} className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
        <ArrowLeft className="w-6 h-6" />
      </button>
      <div className="absolute bottom-6 left-6 right-6 text-white">
        <h1 className="text-3xl font-bold">{provider.name}</h1>
        <p className="opacity-90">{provider.business}</p>
        <span className="inline-block mt-2 bg-blue-600/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold border border-blue-400">
          {provider.category?.replace('_', ' ')}
        </span>
      </div>
    </div>
    
    <div className="p-8 flex-1 overflow-y-auto">
      <div className="flex gap-4 items-center mb-8 bg-slate-50 p-6 rounded-2xl">
         <div className="flex-1 text-center border-r border-slate-200">
           <div className="flex items-center justify-center font-bold text-2xl text-slate-800"><Star className="w-6 h-6 fill-yellow-500 text-yellow-500 mr-2" /> {typeof provider.rating === 'number' ? provider.rating.toFixed(1) : provider.rating}</div>
           <span className="text-sm text-slate-500">Rating</span>
         </div>
         <div className="flex-1 text-center border-r border-slate-200">
           <div className="font-bold text-2xl text-slate-800">{provider.distance}</div>
           <span className="text-sm text-slate-500">Distance</span>
         </div>
         <div className="flex-1 text-center">
           <div className="font-bold text-2xl text-slate-800 text-green-600">Yes</div>
           <span className="text-sm text-slate-500">Available</span>
         </div>
      </div>

      <h3 className="font-bold text-xl mb-4">Customer Reviews</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {provider.reviews?.length > 0 ? provider.reviews.map((r: any, i: number) => (
          <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <div className="flex justify-between mb-3">
               <span className="font-bold text-slate-700">{r.user || "Customer"}</span>
               <div className="flex">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-300'}`} />
                  ))}
               </div>
             </div>
             <p className="text-slate-600">"{r.text || r.comment}"</p>
          </div>
        )) : <p className="text-slate-500 col-span-2">No reviews yet.</p>}
      </div>
    </div>

    <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
      <button onClick={onBook} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all text-lg">
        Proceed to Book Service
      </button>
    </div>
  </div>
);
