import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, getAddresses, addAddress, deleteAddress } from '../../api/users';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { AddressMapPicker } from '../../components/ui/AddressMapPicker';

interface SavedAddress {
  id: number;
  label: string;
  line1: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export const ProfilePage: React.FC = () => {
  const { user, fetchUser } = useAuth();
  
  // Profile settings state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Address book state (CUSTOMER only)
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [addressLat, setAddressLat] = useState<number | null>(null);
  const [addressLng, setAddressLng] = useState<number | null>(null);
  const [isDefaultAddr, setIsDefaultAddr] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

  const loadAddresses = async () => {
    if (user?.role !== 'CUSTOMER') return;
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load user addresses', err);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await updateProfile({ name, email });
      await fetchUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine.trim()) {
      setAddressError('Please enter or pick an address from the map.');
      return;
    }

    setSubmittingAddress(true);
    setAddressError('');
    setAddressSuccess('');

    try {
      await addAddress({
        label: addressLabel,
        line1: addressLine,
        latitude: addressLat || 27.7007,
        longitude: addressLng || 85.3001,
        isDefault: isDefaultAddr
      });
      setAddressSuccess('Address added successfully!');
      setAddressLabel('Home');
      setAddressLine('');
      setAddressLat(null);
      setAddressLng(null);
      setIsDefaultAddr(false);
      setAddingAddress(false);
      await loadAddresses();
      setTimeout(() => setAddressSuccess(''), 3000);
    } catch (err: any) {
      setAddressError(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddress(id);
      await loadAddresses();
    } catch (err) {
      console.error('Failed to delete address', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Profile Card */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">My Profile</h1>
        
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8">
          {success && (
            <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold">
              Profile updated successfully!
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Role</label>
                <div className="text-gray-900 font-bold bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-200 text-sm">
                  {user?.role}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Registered Phone Number</label>
                <div className="text-gray-600 bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-200 text-sm">
                  {user?.phone} (Verified)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" isLoading={loading} className="px-6 py-2.5 font-bold rounded-xl text-sm">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Address Book Section (Only visible for CUSTOMER role) */}
      {user?.role === 'CUSTOMER' && (
        <div className="border-t border-slate-200 pt-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Saved Addresses</h2>
              <p className="text-xs text-gray-500">Manage locations to quickly book services on the platform.</p>
            </div>
            {!addingAddress && (
              <Button 
                type="button" 
                onClick={() => setAddingAddress(true)}
                className="px-4 py-2 text-xs font-bold rounded-xl"
              >
                + Add Address
              </Button>
            )}
          </div>

          {addressSuccess && (
            <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold">
              {addressSuccess}
            </div>
          )}

          {/* Add Address Form Drawer/Block */}
          {addingAddress && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Add New Location</h3>
              {addressError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold">
                  {addressError}
                </div>
              )}

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Label (e.g. Home, Office)</label>
                    <input
                      type="text"
                      required
                      placeholder="Home, Office, Gym..."
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium">
                      <input
                        type="checkbox"
                        checked={isDefaultAddr}
                        onChange={(e) => setIsDefaultAddr(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>Set as default address</span>
                    </label>
                  </div>
                </div>

                {/* Map Picker Component */}
                <AddressMapPicker 
                  onAddressSelect={({ address, lat, lng }) => {
                    setAddressLine(address);
                    setAddressLat(lat);
                    setAddressLng(lng);
                  }}
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Selected Location Address</label>
                  <textarea
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Search/Click on the map to set address automatically, or write it manually"
                    className="w-full border border-gray-300 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingAddress(false);
                      setAddressError('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    isLoading={submittingAddress}
                    className="px-5 py-2 text-xs font-bold rounded-xl"
                  >
                    Save Address
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* List of Saved Addresses */}
          {addresses.length === 0 ? (
            <div className="text-center py-8 bg-white border border-gray-100 rounded-2xl text-gray-400 text-sm">
              You haven't saved any addresses yet. Click '+ Add Address' to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div 
                  key={addr.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-800 text-sm">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{addr.line1}</p>
                    <div className="text-[10px] text-gray-400">Coordinates: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}</div>
                  </div>

                  <div className="border-t border-slate-50 pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-bold"
                    >
                      Delete Location
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
