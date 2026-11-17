'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore, useUserStore, useToastStore } from '@/lib/store';
import { Address, GstDetails } from '@/types';
import { getProductImageUrl } from '@/lib/utils';
import { 
  ShieldCheck, 
  MapPin, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Truck, 
  Plus, 
  Check,
  Building2,
  AlertCircle
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getShippingFee, getGstAmount, getTotal, clearCart } = useCartStore();
  const { user, isAuthenticated, login, addAddress } = useUserStore();
  const { addToast } = useToastStore();

  // Step 1: Login / Phone Verification (if not logged in)
  const [phone, setPhone] = useState(user?.phone || '9811234567');
  const [doctorName, setDoctorName] = useState(user?.name || 'Dr. Vikram Malhotra');
  const [email, setEmail] = useState(user?.email || 'dr.vikram@malhotraclinic.com');
  const [otpStep, setOtpStep] = useState(!isAuthenticated);
  const [otpCode, setOtpCode] = useState('123456');

  // Step 2: Address Selection / Addition
  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || 'new');
  const [showNewAddressForm, setShowNewAddressForm] = useState(!defaultAddr);

  const [newAddr, setNewAddr] = useState<Address>({
    id: 'addr-new-entry',
    type: 'Clinic',
    name: 'Dr. Vikram Malhotra',
    clinicHospitalName: 'Malhotra Multi-Speciality Dental Clinic',
    phone: '9811234567',
    addressLine1: 'Suite 204, Metro Plaza, Sector 18',
    addressLine2: 'Near Sector 18 Metro Station',
    pincode: '201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    isDefault: true
  });

  // Step 3: Optional GSTIN business invoice
  const [includeGst, setIncludeGst] = useState<boolean>(Boolean(user?.gstDetails?.gstin));
  const [gstin, setGstin] = useState<string>(user?.gstDetails?.gstin || '09AAACM1234F1Z8');
  const [legalCompanyName, setLegalCompanyName] = useState<string>(user?.gstDetails?.legalBusinessName || 'Malhotra Healthcare Pvt Ltd');
  const [gstError, setGstError] = useState<string>('');

  // Step 4: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const gst = getGstAmount();
  const total = getTotal();

  // Validate Indian GSTIN format
  const validateGstin = (code: string) => {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return regex.test(code.trim().toUpperCase());
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) return;
    const dummyUser = {
      id: 'usr-chkt',
      name: doctorName,
      email: email,
      phone: phone,
      role: 'doctor' as const,
      addresses: [newAddr],
      gstDetails: includeGst ? { gstin, legalBusinessName: legalCompanyName, isVerified: true } : undefined
    };
    login(dummyUser, 'token_xyz');
    setOtpStep(false);
    addToast({ type: 'success', title: 'Verified', message: 'Clinic details confirmed.' });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    // Validate GSTIN if checked
    if (includeGst) {
      if (!validateGstin(gstin)) {
        setGstError('Please enter a valid 15-character Indian GSTIN (e.g. 09AAACM1234F1Z8)');
        return;
      }
      if (!legalCompanyName.trim()) {
        setGstError('Please enter your Registered Legal Entity Name');
        return;
      }
      setGstError('');
    }

    setIsProcessing(true);

    // Simulated payment processing
    setTimeout(() => {
      const generatedOrderId = `BDM-${Date.now().toString().slice(-6)}`;
      clearCart();
      setIsProcessing(false);
      router.push(`/order-success/${generatedOrderId}`);
    }, 1200);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-xl font-bold text-[#12263F]">Your cart is empty. Please add products to proceed.</h1>
        <Link href="/" className="mt-4 inline-block px-5 py-2.5 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold rounded-xl text-xs">
          Return to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#12263F] tracking-tight">
            Checkout & Clinic Verification
          </h1>
          <p className="text-xs text-[#5B6B82] mt-0.5">
            100% Secure Pan-India Logistics • Official Manufacturer Warranty • GST Invoice
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#16A34A] bg-green-50 px-3 py-1.5 rounded-full font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Checkout Steps (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: DOCTOR / CLINIC CONTACT */}
          <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1D5FAF] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-sm text-[#12263F]">Doctor / Practitioner Information</h3>
              </div>
              {isAuthenticated && (
                <span className="text-xs text-[#16A34A] font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Logged In
                </span>
              )}
            </div>

            {otpStep ? (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#12263F] block mb-1">Doctor Name</label>
                    <input
                      type="text"
                      required
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#12263F] block mb-1">Mobile Number (India)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs px-3 py-2 border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter OTP (Demo: 123456)"
                    className="text-xs px-3 py-2 border border-[#DCE6F2] rounded-lg font-mono tracking-wider w-44 text-[#12263F]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-bold rounded-lg"
                  >
                    Verify & Continue
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between text-xs text-[#5B6B82] bg-[#F6F9FD] p-3 rounded-xl">
                <div>
                  <div className="font-bold text-[#12263F]">{doctorName}</div>
                  <div className="text-[#5B6B82]">+91 {phone} • {email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpStep(true)}
                  className="text-xs text-[#1D5FAF] hover:underline font-semibold"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: CLINIC SHIPPING ADDRESS */}
          <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1D5FAF] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-sm text-[#12263F]">Clinic / Hospital Delivery Address</h3>
              </div>
            </div>

            {/* Saved Addresses List */}
            {user?.addresses && user.addresses.length > 0 && (
              <div className="space-y-2">
                {user.addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setShowNewAddressForm(false);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                        isSelected
                          ? 'border-[#1D5FAF] bg-[#EAF2FC]/60 shadow-xs'
                          : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedAddressId(addr.id);
                            setShowNewAddressForm(false);
                          }}
                          className="accent-[#1D5FAF] focus:ring-[#1D5FAF] mt-0.5"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-[#12263F] flex items-center gap-2">
                            <span>{addr.clinicHospitalName || addr.name}</span>
                            <span className="text-[11px] bg-[#EAF2FC] px-1.5 py-0.5 rounded font-semibold text-[#174E90]">
                              {addr.type}
                            </span>
                          </div>
                          <div className="text-[#5B6B82] mt-1 leading-relaxed">
                            {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                            {addr.city}, {addr.state} - {addr.pincode}
                          </div>
                          <div className="text-[#5B6B82] mt-0.5">Phone: {addr.phone}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Address toggle */}
            {!showNewAddressForm ? (
              <button
                type="button"
                onClick={() => {
                  setShowNewAddressForm(true);
                  setSelectedAddressId('new');
                }}
                className="text-xs text-[#1D5FAF] font-bold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Deliver to a different clinic/hospital address</span>
              </button>
            ) : (
              <div className="p-4 bg-[#F6F9FD] rounded-xl border border-[#DCE6F2] space-y-3">
                <div className="text-xs font-bold text-[#12263F]">Add New Clinic Address</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-semibold text-[#12263F] block mb-1">
                      Clinic / Hospital Name
                    </label>
                    <input
                      type="text"
                      value={newAddr.clinicHospitalName || ''}
                      onChange={(e) => setNewAddr({ ...newAddr, clinicHospitalName: e.target.value })}
                      placeholder="e.g. Apex Multispeciality Hospital"
                      className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#12263F] block mb-1">
                      Doctor / Recipient Name
                    </label>
                    <input
                      type="text"
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      placeholder="Dr. Full Name"
                      className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-semibold text-[#12263F] block mb-1">
                    Street Address & Room / Suite
                  </label>
                  <input
                    type="text"
                    value={newAddr.addressLine1}
                    onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                    placeholder="Floor, Wing, Street, Landmark"
                    className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[12px] font-semibold text-[#12263F] block mb-1">PIN Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={newAddr.pincode}
                      onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#12263F] block mb-1">City</label>
                    <input
                      type="text"
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#12263F] block mb-1">State</label>
                    <input
                      type="text"
                      value={newAddr.state}
                      onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: OPTIONAL GST DETAILS FOR BUSINESS INVOICE */}
          <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1D5FAF] text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="font-bold text-sm text-[#12263F]">Tax Invoice & GSTIN Verification</h3>
              </div>
            </div>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[#DCE6F2] hover:border-[#1D5FAF] cursor-pointer select-none bg-[#F6F9FD]">
              <input
                type="checkbox"
                checked={includeGst}
                onChange={(e) => setIncludeGst(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1D5FAF] focus:ring-[#1D5FAF] mt-0.5"
              />
              <div className="text-xs">
                <div className="font-bold text-[#12263F]">
                  Add GST details for business invoice (Claim Input Tax Credit)
                </div>
                <div className="text-[#5B6B82] mt-0.5">
                  Check this to generate a 100% compliant B2B tax invoice with your clinic GSTIN. Save up to 18% in taxes.
                </div>
              </div>
            </label>

            {includeGst && (
              <div className="p-4 bg-[#EAF2FC]/60 rounded-xl border border-[#DCE6F2] space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-bold text-[#12263F] block mb-1">
                      15-Digit GSTIN Number *
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => {
                        setGstin(e.target.value.toUpperCase());
                        setGstError('');
                      }}
                      placeholder="e.g. 09AAACM1234F1Z8"
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg uppercase tracking-wider focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-[#12263F] block mb-1">
                      Registered Legal Business / Clinic Name *
                    </label>
                    <input
                      type="text"
                      value={legalCompanyName}
                      onChange={(e) => {
                        setLegalCompanyName(e.target.value);
                        setGstError('');
                      }}
                      placeholder="e.g. Malhotra Healthcare Pvt Ltd"
                      className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                </div>

                {gstError && (
                  <div className="flex items-center gap-1.5 text-xs text-[#DC2626] font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{gstError}</span>
                  </div>
                )}

                <div className="text-[12px] text-[#174E90] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1D5FAF]" />
                  <span>GSTIN format is validated against official GST portal specs.</span>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: PAYMENT METHOD SELECTION */}
          <div className="bg-white rounded-2xl border border-[#DCE6F2] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1D5FAF] text-white text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <h3 className="font-bold text-sm text-[#12263F]">Payment Method</h3>
              </div>
            </div>

            <div className="space-y-3">
              {/* Razorpay Online */}
              <label
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-[#1D5FAF] bg-[#EAF2FC]/60 shadow-xs'
                    : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="accent-[#1D5FAF] focus:ring-[#1D5FAF] mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#12263F]">
                      Razorpay Online Gateway (Instant Clearance)
                    </span>
                    <span className="text-[11px] font-bold bg-[#1D5FAF] text-white px-2 py-0.5 rounded">
                      Fastest Dispatch
                    </span>
                  </div>
                  <p className="text-xs text-[#5B6B82] mt-1">
                    Pay securely via UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, NetBanking, or Flexible EMI options.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {['UPI', 'Visa', 'Mastercard', 'RuPay', 'EMI Available'].map((tag) => (
                      <span key={tag} className="text-[11px] bg-white border border-[#DCE6F2] px-2 py-0.5 rounded font-semibold text-[#12263F]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </label>

              {/* Cash On Delivery */}
              <label
                className={`p-4 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-[#1D5FAF] bg-[#EAF2FC]/60 shadow-xs'
                    : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="accent-[#1D5FAF] focus:ring-[#1D5FAF] mt-1"
                />
                <div className="flex-1">
                  <span className="font-bold text-sm text-[#12263F]">
                    Cash on Delivery (Pay at Clinic / Hospital)
                  </span>
                  <p className="text-xs text-[#5B6B82] mt-1">
                    Pay via cash or UPI QR scanner upon doorstep parcel arrival. Available for verified pincodes.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Order Summary & Confirmation (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-5 sticky top-28">
          <h2 className="font-bold text-base text-[#12263F] border-b border-[#DCE6F2] pb-3">
            Order Review ({items.length} items)
          </h2>

          {/* Mini items list */}
          <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-[#DCE6F2]">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="pt-2 flex items-center gap-3 text-xs">
                <div className="w-12 h-12 rounded-lg bg-[#F6F9FD] border border-[#DCE6F2] relative overflow-hidden shrink-0">
                  <Image
                    src={getProductImageUrl(item.product)}
                    alt={item.product.name}
                    fill
                    className="object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[#12263F] truncate">{item.product.name}</div>
                  <div className="text-[#5B6B82] text-[12px]">
                    Qty: {item.quantity} {item.variantName && `• ${item.variantName}`}
                  </div>
                </div>
                <div className="font-bold text-[#12263F] shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Calculation */}
          <div className="space-y-2 text-xs text-[#5B6B82] border-t border-[#DCE6F2] pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-[#12263F]">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#16A34A] font-semibold">
                <span>Discount Saved</span>
                <span>-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Doorstep Air Shipping</span>
              <span className="font-semibold text-[#12263F]">
                {shipping === 0 ? <span className="text-[#16A34A] font-bold">FREE</span> : `₹${shipping}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated GST (12% / 18%)</span>
              <span className="font-semibold text-[#12263F]">₹{gst.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-black text-[#12263F] pt-3 border-t border-[#DCE6F2]">
              <span>Total Payable</span>
              <span className="text-xl text-[#12263F] font-extrabold">₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Place Order CTA */}
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full py-4 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Securing Authorization with Razorpay...</span>
            ) : (
              <>
                <span>Place Order & Pay ₹{total.toLocaleString('en-IN')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="p-3 bg-[#F6F9FD] rounded-xl space-y-1.5 text-[12px] text-[#5B6B82]">
            <div className="flex items-center gap-1.5 font-bold text-[#12263F]">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              <span>Buy Denmed Buyer Protection Guarantee</span>
            </div>
            <p>
              Free transit insurance, 7-day hassle-free replacement for transit damage, and manufacturer certified warranty cards included.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
