import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { 
  Search, PlusCircle, Trash2, Edit3, X
} from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  minBookingAmount: number;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  usagePerCustomer: number;
  applicableCategory: string | null;
  isActive: boolean;
}

export const CouponTab: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Coupon form modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('FLAT');
  const [discountValue, setDiscountValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [minBookingAmount, setMinBookingAmount] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('0');
  const [usagePerCustomer, setUsagePerCustomer] = useState('1');
  const [applicableCategory, setApplicableCategory] = useState('ALL');
  const [isActive, setIsActive] = useState(true);

  const [formError, setFormError] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/coupons');
      setCoupons(response.data || []);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('FLAT');
    setDiscountValue('');
    setMaxDiscount('');
    setMinBookingAmount('0');
    
    // Set start date to today, expiry to 30 days from now
    const now = new Date();
    const expiry = new Date();
    expiry.setDate(now.getDate() + 30);

    setStartDate(now.toISOString().substring(0, 16));
    setExpiryDate(expiry.toISOString().substring(0, 16));
    setUsageLimit('0');
    setUsagePerCustomer('1');
    setApplicableCategory('ALL');
    setIsActive(true);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(String(c.discountValue));
    setMaxDiscount(c.maxDiscount ? String(c.maxDiscount) : '');
    setMinBookingAmount(String(c.minBookingAmount));
    setStartDate(c.startDate.substring(0, 16));
    setExpiryDate(c.expiryDate.substring(0, 16));
    setUsageLimit(String(c.usageLimit));
    setUsagePerCustomer(String(c.usagePerCustomer));
    setApplicableCategory(c.applicableCategory || 'ALL');
    setIsActive(c.isActive);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
      minBookingAmount: parseFloat(minBookingAmount),
      startDate: new Date(startDate).toISOString(),
      expiryDate: new Date(expiryDate).toISOString(),
      usageLimit: parseInt(usageLimit),
      usagePerCustomer: parseInt(usagePerCustomer),
      applicableCategory: applicableCategory === 'ALL' ? null : applicableCategory,
      isActive
    };

    if (!payload.code) {
      setFormError('Coupon code is required.');
      return;
    }
    if (isNaN(payload.discountValue) || payload.discountValue <= 0) {
      setFormError('Discount value must be greater than zero.');
      return;
    }
    if (new Date(startDate) >= new Date(expiryDate)) {
      setFormError('Expiry date must be after the start date.');
      return;
    }

    try {
      if (editingCoupon) {
        await apiClient.put(`/admin/coupons/${editingCoupon.id}`, payload);
      } else {
        await apiClient.post('/admin/coupons', payload);
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to save coupon.');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await apiClient.put(`/admin/coupons/${id}/toggle`);
      fetchCoupons();
    } catch (err) {
      console.error('Failed to toggle coupon status', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiClient.delete(`/admin/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon', err);
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.applicableCategory && c.applicableCategory.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in text-xs text-slate-700 font-semibold">
      
      {/* Actions header bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[280px] items-center gap-3 relative">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search coupons by code or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <PlusCircle className="h-4.5 w-4.5" /> Create Coupon
        </button>
      </div>

      {/* Main coupons registry list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 font-medium">Loading coupon rules...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                  <th className="px-6 py-4">Coupon Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Min Spend / Max Disc</th>
                  <th className="px-6 py-4">Valid Period</th>
                  <th className="px-6 py-4">Applicability</th>
                  <th className="px-6 py-4">Usage Limits</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/20">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-slate-900 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded-lg">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800">
                        {c.discountType === 'FLAT' ? `Rs. ${c.discountValue}` : `${c.discountValue}% OFF`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700">Min spend: Rs. {c.minBookingAmount}</div>
                      {c.discountType === 'PERCENTAGE' && c.maxDiscount && (
                        <div className="text-[10px] text-slate-450 mt-0.5">Max cap: Rs. {c.maxDiscount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-[11px] whitespace-nowrap">
                      <div>Start: {new Date(c.startDate).toLocaleDateString()}</div>
                      <div className="mt-0.5">Expiry: {new Date(c.expiryDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {c.applicableCategory || 'ALL CATEGORIES'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>Global: {c.usageLimit > 0 ? c.usageLimit : 'Unlimited'}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5">Per User: {c.usagePerCustomer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(c.id)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          c.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100'
                        }`}
                      >
                        {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded-lg transition inline-flex"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 hover:bg-slate-100 text-slate-600 hover:text-rose-600 rounded-lg transition inline-flex"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCoupons.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                      No active discount coupons found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-scale-in">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Discount Promo Coupon'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-[11px] font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-slate-700">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Coupon Promo Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MONSOON25"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-900 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-900"
                  >
                    <option value="FLAT">Flat NPR Cash Discount</option>
                    <option value="PERCENTAGE">Percentage (%) Rate OFF</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Discount Value</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="50"
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 pr-7 font-mono font-bold"
                    />
                    <span className="absolute right-3 text-slate-400 font-bold">
                      {discountType === 'FLAT' ? 'Rs' : '%'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-slate-500 mb-1">Max Disc Cap</label>
                  <input
                    type="number"
                    disabled={discountType === 'FLAT'}
                    placeholder="e.g. 200"
                    value={maxDiscount}
                    onChange={e => setMaxDiscount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-mono disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Min Spend Require</label>
                  <input
                    type="number"
                    required
                    value={minBookingAmount}
                    onChange={e => setMinBookingAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Valid From</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Expires On</label>
                  <input
                    type="datetime-local"
                    required
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 mb-1">Max Global Uses</label>
                  <input
                    type="number"
                    required
                    placeholder="0 = Unlimited"
                    value={usageLimit}
                    onChange={e => setUsageLimit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Uses Per User</label>
                  <input
                    type="number"
                    required
                    value={usagePerCustomer}
                    onChange={e => setUsagePerCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Applicable Category</label>
                  <select
                    value={applicableCategory}
                    onChange={e => setApplicableCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl focus:outline-none font-bold text-slate-900"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="AC">AC Repair</option>
                    <option value="PAINTING">Painting</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded border-slate-350 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="isActive" className="font-bold text-slate-700 select-none">Make coupon active immediately</label>
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm"
                >
                  Save Coupon
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
