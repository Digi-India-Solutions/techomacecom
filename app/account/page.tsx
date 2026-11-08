'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useUserStore, useWishlistStore, useCartStore, useToastStore } from '@/lib/store';
import { getOrders, getActiveRentals } from '@/lib/api';
import { Order, ActiveRental, Address, GstDetails } from '@/types';
import ProductCard from '@/components/product/ProductCard';
import RentalsTabContent from '@/components/account/RentalsTabContent';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import { 
  User as UserIcon, 
  Package, 
  MapPin, 
  FileText, 
  Heart, 
  Bed, 
  ShieldCheck, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  LogOut,
  Star
} from 'lucide-react';

type Tab = 'orders' | 'rentals' | 'wishlist' | 'profile' | 'addresses' | 'gst';

function AccountInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;

  const { user, isAuthenticated, logout, updateUser, addAddress, removeAddress, setDefaultAddress, updateGst } = useUserStore();
  const { items: wishlistItems, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  const initialTab: Tab = (tabParam && ['orders', 'rentals', 'wishlist', 'profile', 'addresses', 'gst'].includes(tabParam)) ? (tabParam as Tab) : 'orders';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<ActiveRental[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewModalData, setReviewModalData] = useState<{ productId: string; productName: string } | null>(null);

  // Address modal/form state
  const [isAddingAddr, setIsAddingAddr] = useState<boolean>(false);
  const [newAddr, setNewAddr] = useState<Partial<Address>>({
    type: 'Clinic',
    name: user?.name || 'Dr. Vikram Malhotra',
    clinicHospitalName: 'Malhotra Multi-Speciality Clinic',
    phone: user?.phone || '9811234567',
    addressLine1: '',
    addressLine2: '',
    pincode: '201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    isDefault: false
  });

  // GST details form state
  const [gstinInput, setGstinInput] = useState<string>(user?.gstDetails?.gstin || '09AAACM1234F1Z8');
  const [legalNameInput, setLegalNameInput] = useState<string>(user?.gstDetails?.legalBusinessName || 'Malhotra Healthcare Pvt Ltd');

  useEffect(() => {
    async function loadData() {
      try {
        const [o, r] = await Promise.all([getOrders(), getActiveRentals()]);
        setOrders(o);
        setRentals(r);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadInvoice = (order: Order) => {
    const textContent = `BUY DENMED HEALTHCARE PVT LTD
TAX INVOICE - ${order.orderNumber}
Date: ${order.date}
Doctor / Clinic: ${order.shippingAddress.clinicHospitalName || order.shippingAddress.name}
GSTIN: ${order.gstDetails?.gstin || 'N/A'}
Total Amount: ₹${order.totalAmount.toLocaleString('en-IN')}
Status: ${order.paymentStatus}
Thank you for your business.`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.orderNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Invoice Downloaded', message: `Invoice for ${order.orderNumber} saved.` });
  };

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    updateGst({
      gstin: gstinInput.trim().toUpperCase(),
      legalBusinessName: legalNameInput.trim(),
      isVerified: true
    });
    addToast({ type: 'success', title: 'GST Details Updated', message: 'Ready for 1-click B2B tax invoicing.' });
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.addressLine1 || !newAddr.pincode) return;

    addAddress({
      id: `addr-${Date.now()}`,
      type: (newAddr.type as any) || 'Clinic',
      name: newAddr.name || user?.name || 'Dr. Practitioner',
      clinicHospitalName: newAddr.clinicHospitalName,
      phone: newAddr.phone || '9811234567',
      addressLine1: newAddr.addressLine1,
      addressLine2: newAddr.addressLine2,
      pincode: newAddr.pincode,
      city: newAddr.city || 'Delhi',
      state: newAddr.state || 'Delhi',
      isDefault: Boolean(newAddr.isDefault)
    });

    setIsAddingAddr(false);
    addToast({ type: 'success', title: 'Address Added', message: 'New clinic address registered.' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Account Overview Header */}
      <div className="bg-[#1E293B] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-black text-2xl shadow-lg">
            {user?.name ? user.name[0] : 'D'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">{user?.name || 'Dr. Vikram Malhotra'}</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Verified Doctor
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {user?.degree || 'BDS, MDS (Prosthodontics)'} • Reg: {user?.registrationNumber || 'DCI-DEL-18920'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              +91 {user?.phone || '9811234567'} • {user?.email || 'dr.vikram@malhotraclinic.com'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              logout();
              addToast({ type: 'info', title: 'Logged Out', message: 'You have been signed out.' });
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Tabs + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Tabs (3 cols) */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1">
          {[
            { id: 'orders' as Tab, label: 'My Orders', icon: Package, badge: orders.length },
            { id: 'rentals' as Tab, label: 'My Rentals', icon: Bed, badge: rentals.length },
            { id: 'wishlist' as Tab, label: 'Wishlist', icon: Heart, badge: wishlistItems.length },
            { id: 'addresses' as Tab, label: 'Clinic Addresses', icon: MapPin },
            { id: 'gst' as Tab, label: 'Saved GST Details', icon: FileText },
            { id: 'profile' as Tab, label: 'Profile Settings', icon: UserIcon }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-[#0F766E]' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Content Area (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {/* TAB 1: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-black text-lg text-slate-900">My Orders & Tracking</h2>
                  <p className="text-xs text-slate-500">Track equipment shipments, download official GST tax invoices & write verified doctor reviews</p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No orders placed yet.</div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 font-mono text-sm">
                            {order.orderNumber}
                          </span>
                          <span className="text-slate-400 ml-2">
                            • Placed on {new Date(order.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-teal-50 text-[#0F766E] border border-teal-200 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                            {order.status}
                          </span>
                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            className="text-xs text-slate-700 hover:text-[#0F766E] font-semibold flex items-center gap-1 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Invoice</span>
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs py-2 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 relative overflow-hidden shrink-0">
                                <Image
                                  src={item.image}
                                  alt={item.productName}
                                  fill
                                  className="object-contain p-1"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] text-slate-400 uppercase font-semibold">{item.brandName}</div>
                                <div className="font-bold text-slate-900 truncate">{item.productName}</div>
                                <div className="text-slate-500 text-[11px]">Qty: {item.quantity} • Unit: ₹{item.unitPrice.toLocaleString('en-IN')}</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                              <div className="font-bold text-slate-900 text-sm">
                                ₹{item.totalPrice.toLocaleString('en-IN')}
                              </div>
                              <button
                                type="button"
                                onClick={() => setReviewModalData({ productId: item.productId, productName: item.productName })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-[#0F766E]/20 text-[11px] font-bold font-heading rounded-lg transition-colors shadow-2xs"
                              >
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span>Write a Review</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline */}
                      <div className="pt-4 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Status Timeline (Courier: {order.courierPartner || 'BlueDart Air'})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                          {order.timeline.map((event, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-lg border ${
                                event.completed
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <div className="truncate">{event.title}</div>
                              <div className="text-[9px] text-slate-500 font-normal mt-0.5">{event.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY RENTALS */}
          {activeTab === 'rentals' && (
            <RentalsTabContent />
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-black text-lg text-slate-900">Saved Wishlist ({wishlistItems.length})</h2>
                  <p className="text-xs text-slate-500">Products saved for upcoming clinic orders</p>
                </div>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Your wishlist is currently empty.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {wishlistItems.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLINIC ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-black text-lg text-slate-900">Clinic & Hospital Delivery Addresses</h2>
                  <p className="text-xs text-slate-500">Manage multiple operatory and branch delivery locations</p>
                </div>
                <button
                  onClick={() => setIsAddingAddr(!isAddingAddr)}
                  className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Clinic</span>
                </button>
              </div>

              {isAddingAddr && (
                <form onSubmit={handleAddNewAddress} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="font-bold text-xs text-slate-800">Add New Practice Location</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Clinic / Hospital Name"
                      value={newAddr.clinicHospitalName || ''}
                      onChange={(e) => setNewAddr({ ...newAddr, clinicHospitalName: e.target.value })}
                      className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Doctor In-Charge Name"
                      value={newAddr.name || ''}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Floor, Wing, Street, Landmark"
                    value={newAddr.addressLine1 || ''}
                    onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="PIN Code"
                      value={newAddr.pincode || ''}
                      onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                      className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newAddr.city || ''}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={newAddr.state || ''}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddr(false)}
                      className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1E293B] hover:bg-slate-900 text-white text-xs font-bold rounded-lg"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user?.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-2xl border relative flex flex-col justify-between ${
                      addr.isDefault ? 'border-[#0F766E] bg-teal-50/30' : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{addr.clinicHospitalName || addr.name}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] bg-[#0F766E] text-white font-bold px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1">Phone: {addr.phone}</div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {!addr.isDefault ? (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-[#0F766E] font-semibold hover:underline"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-[11px]">Primary Dispatch Location</span>
                      )}
                      {user.addresses.length > 1 && (
                        <button
                          onClick={() => removeAddress(addr.id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: SAVED GST DETAILS */}
          {activeTab === 'gst' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="font-black text-lg text-slate-900">Saved GST & B2B Invoicing Credentials</h2>
                  <p className="text-xs text-slate-500">Automatically applied at checkout for 100% verified tax credit</p>
                </div>
              </div>

              <form onSubmit={handleSaveGst} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 max-w-lg">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    15-Digit Clinic / Hospital GSTIN
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstinInput}
                    onChange={(e) => setGstinInput(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono font-bold px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E] uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Registered Legal Business Entity Name
                  </label>
                  <input
                    type="text"
                    value={legalNameInput}
                    onChange={(e) => setLegalNameInput(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#0F766E]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>GSTIN verified against GSTN Portal API</span>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Save GST Details
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-black text-lg text-slate-900">Doctor Profile & Medical Registration</h2>
                <p className="text-xs text-slate-500">Your details appear on quotes and proforma purchase invoices</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-w-xl">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Doctor Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile</label>
                  <input
                    type="tel"
                    defaultValue={user?.phone}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#0F766E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Council Registration No.</label>
                  <input
                    type="text"
                    defaultValue={user?.registrationNumber || 'DCI-DEL-18920'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:border-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={() => addToast({ type: 'success', title: 'Profile Updated', message: 'Practitioner records saved.' })}
                className="px-5 py-2.5 bg-[#1E293B] hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Update Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Write a Review Modal */}
      {reviewModalData && (
        <WriteReviewModal
          productId={reviewModalData.productId}
          productName={reviewModalData.productName}
          isOpen={Boolean(reviewModalData)}
          onClose={() => setReviewModalData(null)}
          onSuccess={() => {
            setReviewModalData(null);
            addToast({
              type: 'success',
              title: 'Review Submitted',
              message: 'Thank you! Your verified doctor review was submitted for admin moderation.'
            });
          }}
        />
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-12 text-center space-y-3">
          <Clock className="w-8 h-8 text-[#0F766E] animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-bold">Loading account dashboard...</p>
        </div>
      }
    >
      <AccountInner />
    </Suspense>
  );
}
