import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { uploadFile } from '../../api/files';
import { 
  Search, Plus, Edit2, Trash2, X, 
  ToggleLeft, ToggleRight, ImageIcon
} from 'lucide-react';

interface ServiceListing {
  id: number;
  category: string;
  name: string;
  description: string;
  basePrice: number;
  durationMin: number;
  whatIncluded: string | null;
  whatExcluded: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

export const ServiceTab: React.FC = () => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Form modals state
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceListing | null>(null);

  // Form inputs
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [durationMin, setDurationMin] = useState('60');
  const [whatIncluded, setWhatIncluded] = useState('');
  const [whatExcluded, setWhatExcluded] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Categories list
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/services');
      const list = response.data || [];
      setServices(list);
      
      // Extract unique categories
      const cats: string[] = Array.from(new Set(list.map((s: any) => s.category)));
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load service catalog', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenCreate = () => {
    setEditingService(null);
    setCategory(categories[0] || 'ELECTRICAL');
    setName('');
    setDescription('');
    setBasePrice('');
    setDurationMin('60');
    setWhatIncluded('');
    setWhatExcluded('');
    setImageUrl('');
    setImageFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (s: ServiceListing) => {
    setEditingService(s);
    setCategory(s.category);
    setName(s.name);
    setDescription(s.description);
    setBasePrice(String(s.basePrice));
    setDurationMin(String(s.durationMin));
    setWhatIncluded(s.whatIncluded || '');
    setWhatExcluded(s.whatExcluded || '');
    setImageUrl(s.imageUrl || '');
    setImageFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImage(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadFile(imageFile);
      }

      const payload = {
        category,
        name,
        description,
        basePrice: parseFloat(basePrice),
        durationMin: parseInt(durationMin),
        whatIncluded,
        whatExcluded,
        imageUrl: finalImageUrl
      };

      if (editingService) {
        await apiClient.put(`/admin/services/${editingService.id}`, payload);
        alert('Service listing updated successfully');
      } else {
        await apiClient.post('/admin/services', payload);
        alert('New service listing created successfully');
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      alert('Failed to save service listing');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleToggleStatus = async (s: ServiceListing) => {
    try {
      await apiClient.put(`/admin/services/${s.id}/toggle-status`);
      fetchServices();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete/archive this service listing?')) return;
    try {
      await apiClient.delete(`/admin/services/${id}`);
      fetchServices();
    } catch (err) {
      alert('Failed to delete service listing');
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const clean = newCategoryName.trim().toUpperCase();
    if (!categories.includes(clean)) {
      setCategories([...categories, clean]);
      setCategory(clean);
    }
    setNewCategoryName('');
  };

  // Filter list
  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700">
      
      {/* Upper Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search service catalog by name, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-600 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition"
          >
            <Plus className="h-4 w-4" /> Add Service Listing
          </button>
        </div>
      </div>

      {/* Categories Builder card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Dynamic Marketplace Categories</h4>
          <p className="text-slate-400 text-[10px] mt-0.5">Active categories: {categories.join(', ')}</p>
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2">
          <input
            type="text"
            placeholder="NEW_CATEGORY_CODE"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono uppercase font-bold"
          />
          <button type="submit" className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg">Add Category</button>
        </form>
      </div>

      {/* Main catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(s => (
          <div key={s.id} className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-72 transition hover:shadow-md ${!s.isActive ? 'opacity-60 bg-slate-50/20' : ''}`}>
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{s.category}</span>
                <span className="font-mono text-base font-extrabold text-slate-900">Rs. {s.basePrice}</span>
              </div>
              
              <div className="flex gap-3 mb-3">
                {s.imageUrl ? (
                  <img 
                    src={s.imageUrl} 
                    alt={s.name} 
                    className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-50 border border-slate-100" 
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 border border-dashed border-slate-200 text-slate-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 truncate">{s.name}</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{s.description || 'No description.'}</p>
                </div>
              </div>
              
              <div className="text-[10px] text-slate-500 font-semibold space-y-1 mt-2">
                <p>⌚ Duration: {s.durationMin} mins</p>
                {s.whatIncluded && <p className="truncate">✓ Included: {s.whatIncluded}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
              <button
                onClick={() => handleToggleStatus(s)}
                className="flex items-center gap-1 hover:text-slate-900 font-bold transition"
              >
                {s.isActive ? (
                  <><ToggleRight className="h-5 w-5 text-emerald-500 shrink-0" /> Active</>
                ) : (
                  <><ToggleLeft className="h-5 w-5 text-slate-350 shrink-0" /> Archived</>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 border border-slate-200 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredServices.length === 0 && !loading && (
          <div className="col-span-full text-center py-20 text-slate-400 text-xs italic">No service listings found matching the filters.</div>
        )}
      </div>

      {/* CREATE & EDIT FORM MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] relative animate-scale-in">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-slate-900 text-base">{editingService ? 'Edit Service Properties' : 'Publish New Service Listing'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-6 space-y-4 font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Service Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 uppercase"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Service Name Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inverter Repair"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain what the service covers..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Base Price (NPR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 800"
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Duration Estimate (Minutes)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 60"
                    value={durationMin}
                    onChange={e => setDurationMin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Service Banner Image Selector */}
              <div>
                <label className="block text-slate-500 mb-1">Service Banner Image</label>
                <div className="flex gap-4 items-center">
                  {imageFile ? (
                    <div className="w-16 h-16 rounded-xl border object-cover overflow-hidden bg-slate-50 flex items-center justify-center font-bold text-xs text-blue-600">
                      File Selected
                    </div>
                  ) : imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Service Listing preview" 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-250 bg-slate-50"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 bg-slate-50">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }} 
                    className="flex-1 text-xs text-slate-550 border rounded-xl p-2 bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">What's Included (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Diagnostics, cleaning, testing"
                  value={whatIncluded}
                  onChange={e => setWhatIncluded(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">What's Excluded (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Spare parts, external wiring"
                  value={whatExcluded}
                  onChange={e => setWhatExcluded(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={uploadingImage}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition disabled:opacity-50"
                >
                  {uploadingImage ? 'Uploading...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
