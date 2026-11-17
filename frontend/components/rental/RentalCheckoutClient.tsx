'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRentalStore, useUserStore, useToastStore, RentalDraft } from '@/lib/store';
import { requestMobileOtp, verifyMobileOtp, createRentalBooking } from '@/lib/api';
import { Address, RentalPayment, Rental } from '@/types';
import { getProductImageUrl } from '@/lib/utils';
import { 
  Bed, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Upload, 
  CreditCard, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Phone, 
  Clock, 
  Check, 
  AlertCircle,
  FileCheck,
  Building,
  Eye,
  Trash2,
  Calendar
} from 'lucide-react';

export default function RentalCheckoutClient() {
  const router = useRouter();
  const { draft, setDraft, addRental } = useRentalStore();
  const { user, isAuthenticated, login } = useUserStore();
  const { addToast } = useToastStore();

  // Current active step (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(isAuthenticated ? 2 : 1);

  // Fallback initial draft if none exists in localStorage
  useEffect(() => {
    if (!draft) {
      // Pick a default draft with Philips Everflo so the page works smoothly even if visited directly
      const mockDraft: RentalDraft = {
        product: {
          id: 'prod-philips-everflo-5l',
          slug: 'philips-respironics-everflo-5l-oxygen-concentrator',
          name: 'Philips Respironics EverFlo 5 Litre Stationary Oxygen Concentrator',
          brandId: 'brand-philips',
          brandName: 'Philips Respironics',
          categoryId: 'cat-respiratory',
          categoryName: 'Respiratory Care',
          subCategory: 'Oxygen Concentrators',
          sku: 'PHI-EVF-5L-IN',
          price: 48999,
          mrp: 68000,
          discountPercentage: 28,
          rating: 4.8,
          reviewsCount: 142,
          inStock: true,
          stockCount: 18,
          emiEnabled: true,
          rentEnabled: true,
          rentPricePerMonth: 4500,
          securityDeposit: 10000,
          deliveryPickupCharge: 500,
          rentalKycRequired: true,
          images: [
            { url: '/images/prod_oxygen_main.jpg', alt: 'Philips EverFlo 5L Oxygen Concentrator', type: 'main' }
          ],
          thumbnail: '/images/prod_oxygen_main.jpg',
          shortDescription: 'Quiet, lightweight 5 LPM oxygen concentrator engineered for continuous 24/7 medical therapy.',
          description: 'Philips EverFlo produces medical oxygen at 93% purity for continuous home and clinic therapy.',
          specifications: { 'Flow Rate': '0.5 to 5.0 LPM', 'Purity': '93% ± 3%' },
          features: ['Compact & quiet (<45 dBA)', 'Integrated oxygen purity indicator'],
          warranty: '3 Years Warranty',
          gstRate: 12
        },
        plan: { type: 'monthly', price: 4500, minDuration: 1, maxDuration: 12, freeMaintenance: true },
        duration: 1,
        startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 31 * 86400000).toISOString().split('T')[0],
        deposit: 10000,
        rentAmount: 4500,
        deliveryPickupCharge: 500,
        gstAmount: 540,
        totalPayable: 15540
      };
      setDraft(mockDraft);
    }
  }, [draft, setDraft]);

  // STEP 1: AUTH STATE
  const [phoneInput, setPhoneInput] = useState(user?.phone || '9811234567');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // STEP 2: ADDRESS STATE
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    user?.addresses?.[0]?.id || 'addr-1'
  );
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState<Address>({
    id: 'addr-new',
    type: 'Clinic',
    name: user?.name || 'Dr. Vikram Malhotra',
    clinicHospitalName: 'Malhotra Clinic & Health Center',
    phone: '+91 ' + (user?.phone || '9811234567'),
    addressLine1: 'Suite 204, Metro Plaza, Sector 18',
    addressLine2: 'Near Sector 18 Metro Station',
    pincode: '201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    isDefault: true
  });

  // STEP 3: KYC DOCUMENTS STATE
  const [kycDocs, setKycDocs] = useState<{
    idProofFront: string | null;
    idProofBack: string | null;
    addressProof: string | null;
    doctorPrescription: string | null;
  }>({
    idProofFront: 'Aadhaar_Card_Front_Sample.jpg',
    idProofBack: 'Aadhaar_Card_Back_Sample.jpg',
    addressProof: 'Clinic_Registration_Proof.pdf',
    doctorPrescription: null
  });

  // STEP 4: PAYMENT / RAZORPAY MODAL STATE
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // OTP handlers
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.length < 10) {
      addToast({ type: 'error', title: 'Invalid Phone', message: 'Enter a valid 10-digit mobile number.' });
      return;
    }
    const res = await requestMobileOtp(phoneInput);
    setOtpSent(true);
    addToast({
      type: 'info',
      title: 'OTP Sent',
      message: `Demo OTP is ${res.demoOtp} (instant test).`
    });
    setOtpInput(res.demoOtp);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    try {
      const res = await verifyMobileOtp(phoneInput, otpInput);
      if (res.success && res.user) {
        login(res.user, res.token || 'demo-jwt-token');
        addToast({
          type: 'success',
          title: 'Mobile Verified',
          message: 'Welcome! Identity verified for clinical rental.'
        });
        setCurrentStep(2);
      } else {
        addToast({ type: 'error', title: 'Verification Failed', message: res.message });
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Simulated file upload
  const handleFileUpload = (type: keyof typeof kycDocs, fileName: string) => {
    setKycDocs((prev) => ({ ...prev, [type]: fileName }));
    addToast({
      type: 'success',
      title: 'Document Uploaded',
      message: `${fileName} uploaded successfully for verification.`
    });
  };

  // Final Order Placement
  const handleCompleteRazorpayPayment = async () => {
    if (!draft) return;
    setIsProcessingPayment(true);

    try {
      const selectedAddress =
        user?.addresses?.find((a) => a.id === selectedAddressId) || customAddress;

      const initialPayment: RentalPayment = {
        id: `pay-${Date.now()}`,
        amount: draft.totalPayable,
        date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        method: paymentMethod === 'upi' ? 'Razorpay Instant UPI' : paymentMethod === 'card' ? 'Razorpay Credit/Debit Card' : 'Razorpay NetBanking',
        type: 'initial',
        status: 'paid',
        transactionId: `pay_rzp_${Math.floor(1000000 + Math.random() * 9000000)}`
      };

      const result = await createRentalBooking({
        product: draft.product,
        plan: draft.plan,
        duration: draft.duration,
        startDate: draft.startDate,
        endDate: draft.endDate,
        deposit: draft.deposit,
        rentAmount: draft.rentAmount,
        charges: {
          deliveryPickup: draft.deliveryPickupCharge,
          gst: draft.gstAmount
        },
        address: selectedAddress,
        kycDocuments: {
          idProofFront: kycDocs.idProofFront || undefined,
          idProofBack: kycDocs.idProofBack || undefined,
          addressProof: kycDocs.addressProof || undefined,
          doctorPrescription: kycDocs.doctorPrescription || undefined,
          verified: false
        },
        payments: [initialPayment]
      });

      // Save to Zustand store
      addRental(result.rental);

      addToast({
        type: 'success',
        title: 'Booking Confirmed',
        message: 'Your equipment rental booking has been received!'
      });

      // Redirect to rental success page
      router.push(`/rent/success?bookingId=${result.rental.bookingNumber}`);
    } finally {
      setIsProcessingPayment(false);
      setIsRazorpayModalOpen(false);
    }
  };

  if (!draft) {
    return (
      <div className="py-16 text-center space-y-4">
        <Clock className="w-8 h-8 text-[#1D5FAF] animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#12263F]">Loading rental configuration...</p>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Authentication', icon: User },
    { num: 2, title: 'Delivery Address', icon: MapPin },
    { num: 3, title: 'KYC Verification', icon: FileCheck },
    { num: 4, title: 'Review & Pay', icon: CreditCard }
  ];

  return (
    <div className="w-full mx-auto space-y-8">
      {/* Checkout Progress Stepper */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#DCE6F2] shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((st, i) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.num;
            const isActive = currentStep === st.num;
            return (
              <React.Fragment key={st.num}>
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                      isCompleted
                        ? 'bg-[#174E90] text-white shadow-sm'
                        : isActive
                        ? 'bg-[#1D5FAF] text-white shadow-md ring-4 ring-[#EAF2FC]'
                        : 'bg-[#F6F9FD] text-[#5B6B82] border border-[#DCE6F2]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span
                    className={`text-[12px] font-bold text-center hidden sm:block ${
                      isActive ? 'text-[#1D5FAF]' : isCompleted ? 'text-[#12263F]' : 'text-[#5B6B82]'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors ${
                      currentStep > st.num ? 'bg-[#1D5FAF]' : 'bg-[#DCE6F2]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Step Content (7 cols) + Order Summary (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Forms */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: LOGIN / OTP */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-sm space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
                  Step 1 of 4
                </div>
                <h2 className="text-xl font-black text-[#12263F]">
                  Doctor / Patient Mobile Verification
                </h2>
                <p className="text-xs text-gray-500">
                  Enter your mobile number to receive contract updates, KYC approval alerts, and delivery tracking.
                </p>
              </div>

              {isAuthenticated ? (
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-green-900 block">Logged In as {user?.name}</span>
                    <span className="text-[12px] text-green-700">{user?.email} • +91 {user?.phone}</span>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs rounded-xl"
                  >
                    Continue →
                  </button>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#12263F] mb-1.5">
                          Mobile Number
                        </label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 text-xs bg-[#F6F9FD] border border-r-0 border-[#DCE6F2] rounded-l-xl text-[#5B6B82] font-semibold">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            required
                            placeholder="Enter 10-digit mobile number"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 text-xs px-3.5 py-2.5 border border-[#DCE6F2] rounded-r-xl focus:outline-none focus:border-[#1D5FAF] font-semibold text-[#12263F]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Send Verification OTP
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-[#12263F]">
                            Enter 6-Digit OTP
                          </label>
                          <span className="text-[11px] text-[#5B6B82]">Sent to +91 {phoneInput}</span>
                        </div>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="w-full text-center tracking-widest text-lg font-black py-2.5 border border-[#DCE6F2] rounded-xl focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                        />
                        <p className="text-[11px] text-[#5B6B82] mt-1">For testing convenience, demo code is: <strong>123456</strong></p>
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingOtp}
                        className="w-full py-3 bg-[#16A34A] hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                      >
                        {isVerifyingOtp ? 'Verifying...' : 'Verify OTP & Continue'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DELIVERY ADDRESS */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#DCE6F2] pb-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
                    Step 2 of 4
                  </div>
                  <h2 className="text-xl font-black text-[#12263F]">
                    Delivery & Installation Address
                  </h2>
                  <p className="text-xs text-gray-500">
                    Our biomedical delivery engineer will set up and demonstrate the equipment here.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingNewAddress(!isAddingNewAddress)}
                  className="px-3 py-1.5 border border-gray-300 text-xs font-bold rounded-xl text-gray-700 hover:border-gray-400"
                >
                  {isAddingNewAddress ? 'Use Saved' : '+ New Address'}
                </button>
              </div>

              {!isAddingNewAddress ? (
                <div className="space-y-3">
                  {(user?.addresses && user.addresses.length > 0 ? user.addresses : [customAddress]).map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? 'border-[#1D5FAF] bg-[#EAF2FC]/60 shadow-xs'
                            : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50 bg-white'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'border-[#1D5FAF] bg-[#1D5FAF]' : 'border-[#DCE6F2]'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>

                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#12263F]">
                              {addr.clinicHospitalName || addr.name}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EAF2FC] text-[#174E90]">
                              {addr.type}
                            </span>
                          </div>
                          <p className="text-xs text-[#5B6B82]">
                            {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <div className="text-[12px] text-[#5B6B82]">
                            Contact Person: <strong className="text-[#12263F]">{addr.name}</strong> • Phone: {addr.phone}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-[#F6F9FD] rounded-2xl border border-[#DCE6F2] space-y-3">
                  <div className="font-bold text-xs text-[#12263F]">Enter Hospital / Residence Address</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Clinic / Hospital / Recipient Name"
                      value={customAddress.name}
                      onChange={(e) => setCustomAddress({ ...customAddress, name: e.target.value })}
                      className="text-xs px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                    />
                    <input
                      type="text"
                      placeholder="Contact Phone"
                      value={customAddress.phone}
                      onChange={(e) => setCustomAddress({ ...customAddress, phone: e.target.value })}
                      className="text-xs px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                    />
                    <input
                      type="text"
                      placeholder="Street Address, Building, Floor"
                      value={customAddress.addressLine1}
                      onChange={(e) => setCustomAddress({ ...customAddress, addressLine1: e.target.value })}
                      className="text-xs px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white sm:col-span-2 focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                    />
                    <input
                      type="text"
                      placeholder="6-Digit PIN Code"
                      value={customAddress.pincode}
                      onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                      className="text-xs px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={customAddress.city}
                      onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                      className="text-xs px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white focus:outline-none focus:border-[#1D5FAF] text-[#12263F]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#DCE6F2]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-bold text-[#5B6B82] hover:text-[#12263F] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>Continue to KYC Upload</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: KYC UPLOAD */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-sm space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
                  Step 3 of 4
                </div>
                <h2 className="text-xl font-black text-[#12263F]">
                  Government KYC Document Upload
                </h2>
                <p className="text-xs text-[#5B6B82]">
                  Mandatory regulatory compliance for high-value medical & respiratory rentals. Files are encrypted with 256-bit AES.
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. ID Proof Front */}
                <div className="p-4 rounded-2xl border border-[#DCE6F2] bg-[#F6F9FD] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#1D5FAF]" />
                      <span className="font-bold text-xs text-[#12263F]">
                        1. Government ID Proof (Front) *
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5B6B82]">Aadhaar / Voter ID / Passport</span>
                  </div>

                  {kycDocs.idProofFront ? (
                    <div className="p-3 bg-white rounded-xl border border-green-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-green-700 font-semibold truncate">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                        <span className="truncate">{kycDocs.idProofFront}</span>
                      </div>
                      <button
                        onClick={() => setKycDocs({ ...kycDocs, idProofFront: null })}
                        className="text-[#DC2626] hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleFileUpload('idProofFront', 'Govt_ID_Front_Verified.pdf')}
                      className="border-2 border-dashed border-[#DCE6F2] hover:border-[#1D5FAF] rounded-xl p-4 text-center cursor-pointer bg-white transition-colors"
                    >
                      <Upload className="w-5 h-5 text-[#5B6B82] mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#12263F] block">Click to Upload Front Side</span>
                      <span className="text-[11px] text-[#5B6B82]">PDF, JPG, PNG up to 10MB</span>
                    </div>
                  )}
                </div>

                {/* 2. ID Proof Back */}
                <div className="p-4 rounded-2xl border border-[#DCE6F2] bg-[#F6F9FD] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#1D5FAF]" />
                      <span className="font-bold text-xs text-[#12263F]">
                        2. Government ID Proof (Back) *
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5B6B82]">Showing permanent address</span>
                  </div>

                  {kycDocs.idProofBack ? (
                    <div className="p-3 bg-white rounded-xl border border-green-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-green-700 font-semibold truncate">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                        <span className="truncate">{kycDocs.idProofBack}</span>
                      </div>
                      <button
                        onClick={() => setKycDocs({ ...kycDocs, idProofBack: null })}
                        className="text-[#DC2626] hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleFileUpload('idProofBack', 'Govt_ID_Back_Verified.pdf')}
                      className="border-2 border-dashed border-[#DCE6F2] hover:border-[#1D5FAF] rounded-xl p-4 text-center cursor-pointer bg-white transition-colors"
                    >
                      <Upload className="w-5 h-5 text-[#5B6B82] mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#12263F] block">Click to Upload Back Side</span>
                      <span className="text-[11px] text-[#5B6B82]">PDF, JPG, PNG up to 10MB</span>
                    </div>
                  )}
                </div>

                {/* 3. Address Proof */}
                <div className="p-4 rounded-2xl border border-[#DCE6F2] bg-[#F6F9FD] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#1D5FAF]" />
                      <span className="font-bold text-xs text-[#12263F]">
                        3. Address Proof (Clinic / Residence) *
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5B6B82]">Electricity bill / Rent deed / Hospital registration</span>
                  </div>

                  {kycDocs.addressProof ? (
                    <div className="p-3 bg-white rounded-xl border border-green-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-green-700 font-semibold truncate">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                        <span className="truncate">{kycDocs.addressProof}</span>
                      </div>
                      <button
                        onClick={() => setKycDocs({ ...kycDocs, addressProof: null })}
                        className="text-[#DC2626] hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleFileUpload('addressProof', 'Electricity_Bill_Latest.pdf')}
                      className="border-2 border-dashed border-[#DCE6F2] hover:border-[#1D5FAF] rounded-xl p-4 text-center cursor-pointer bg-white transition-colors"
                    >
                      <Upload className="w-5 h-5 text-[#5B6B82] mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#12263F] block">Click to Upload Address Proof</span>
                      <span className="text-[11px] text-[#5B6B82]">Latest within 3 months</span>
                    </div>
                  )}
                </div>

                {/* 4. Optional Doctor's Prescription */}
                <div className="p-4 rounded-2xl border border-[#DCE6F2] bg-[#F6F9FD] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#1D5FAF]" />
                      <span className="font-bold text-xs text-[#12263F]">
                        4. Doctor&apos;s Prescription (Optional)
                      </span>
                    </div>
                    <span className="text-[11px] text-[#5B6B82]">Expedites instant approval</span>
                  </div>

                  {kycDocs.doctorPrescription ? (
                    <div className="p-3 bg-white rounded-xl border border-green-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-green-700 font-semibold truncate">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
                        <span className="truncate">{kycDocs.doctorPrescription}</span>
                      </div>
                      <button
                        onClick={() => setKycDocs({ ...kycDocs, doctorPrescription: null })}
                        className="text-[#DC2626] hover:text-red-700 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleFileUpload('doctorPrescription', 'Physician_Prescription_Rx.pdf')}
                      className="border-2 border-dashed border-[#DCE6F2] hover:border-[#1D5FAF] rounded-xl p-4 text-center cursor-pointer bg-white transition-colors"
                    >
                      <Upload className="w-5 h-5 text-[#5B6B82] mx-auto mb-1" />
                      <span className="text-xs font-bold text-[#12263F] block">Upload Prescription or Clinical Recommendation</span>
                      <span className="text-[11px] text-[#5B6B82]">PDF, JPG, PNG up to 10MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#DCE6F2]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-bold text-[#5B6B82] hover:text-[#12263F] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <span>Review Contract & Pay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & PAY */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6F2] shadow-sm space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1D5FAF] uppercase tracking-wider">
                  Step 4 of 4
                </div>
                <h2 className="text-xl font-black text-[#12263F]">
                  Review Contract & Pay via Razorpay
                </h2>
                <p className="text-xs text-[#5B6B82]">
                  Rent and refundable security deposit are combined in one secure payment.
                </p>
              </div>

              {/* Delivery & KYC Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#F6F9FD] border border-[#DCE6F2] space-y-1.5">
                  <div className="font-bold text-[#12263F] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1D5FAF]" />
                    <span>Installation Location</span>
                  </div>
                  <p className="text-[#5B6B82] leading-relaxed">
                    {customAddress.addressLine1}, {customAddress.city}, {customAddress.state} - {customAddress.pincode}
                  </p>
                  <div className="text-[12px] text-[#5B6B82]">
                    Contact: {customAddress.name} ({customAddress.phone})
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F6F9FD] border border-[#DCE6F2] space-y-1.5">
                  <div className="font-bold text-[#12263F] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#1D5FAF]" />
                    <span>Rental Tenure</span>
                  </div>
                  <p className="text-[#5B6B82]">
                    Duration: <strong className="text-[#12263F]">{draft.duration} {draft.plan.type}(s)</strong>
                  </p>
                  <p className="text-[12px] text-[#5B6B82]">
                    {draft.startDate} to {draft.endDate}
                  </p>
                </div>
              </div>

              {/* Refundable Deposit Callout */}
              <div className="p-4 rounded-2xl bg-green-50 border border-green-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-[#12263F]">
                    ₹{draft.deposit.toLocaleString('en-IN')} Refundable Deposit Protection
                  </h4>
                  <p className="text-green-800 leading-relaxed">
                    The security deposit is 100% refundable. When your equipment return is completed, the full ₹{draft.deposit.toLocaleString('en-IN')} is returned back to your original payment method in 48 hours.
                  </p>
                </div>
              </div>

              {/* Razorpay Launch Button */}
              <button
                type="button"
                onClick={() => setIsRazorpayModalOpen(true)}
                className="w-full py-4 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-black text-sm rounded-2xl shadow-xl shadow-[#1D5FAF]/20 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Lock className="w-4 h-4" />
                <span>Pay ₹{draft.totalPayable.toLocaleString('en-IN')} via Razorpay Gateway</span>
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to KYC</span>
                </button>
                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>256-bit SSL Bank Grade Security</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg space-y-5 sticky top-24">
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider pb-3 border-b border-gray-100">
              Rental Order Summary
            </h3>

            {/* Equipment Snapshot */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 p-1 overflow-hidden shrink-0">
                <Image
                  src={getProductImageUrl(draft.product)}
                  alt={draft.product.name}
                  fill
                  className="object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {draft.product.brandName}
                </span>
                <h4 className="font-bold text-xs text-gray-900 truncate">
                  {draft.product.name}
                </h4>
                <div className="text-[12px] text-[#1D5FAF] font-bold">
                  {draft.duration} {draft.plan.type}(s) Plan • Starts {draft.startDate}
                </div>
              </div>
            </div>

            {/* Line Item Breakdown */}
            <div className="space-y-2.5 text-xs text-[#5B6B82] pt-3 border-t border-[#DCE6F2]">
              <div className="flex justify-between items-center">
                <span>
                  Equipment Rent ({draft.duration} × ₹{draft.plan.price.toLocaleString('en-IN')})
                </span>
                <span className="font-bold text-[#12263F]">
                  ₹{draft.rentAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center text-green-800 font-semibold bg-green-50/70 p-2 rounded-lg border border-green-200">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  <span>Security Deposit (Refundable)</span>
                </div>
                <span>₹{draft.deposit.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Sanitized Delivery & Pickup</span>
                <span className="font-semibold text-[#12263F]">
                  ₹{draft.deliveryPickupCharge.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#5B6B82]">
                <span>GST (12% on Rental)</span>
                <span>₹{draft.gstAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-3 border-t border-[#DCE6F2] flex justify-between items-baseline">
                <div>
                  <span className="font-black text-sm text-[#12263F] block">Total Payable Now</span>
                  <span className="text-[11px] text-[#5B6B82]">
                    Includes ₹{draft.deposit.toLocaleString('en-IN')} refundable deposit
                  </span>
                </div>
                <span className="font-black text-xl text-[#12263F] font-extrabold">
                  ₹{draft.totalPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Guarantee Pills */}
            <div className="p-3 bg-[#F6F9FD] rounded-2xl border border-[#DCE6F2] space-y-1.5 text-[12px] text-[#5B6B82]">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Zero repair or breakdown maintenance fee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Deposit refund processed in 48h after return</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>Doorstep calibration & biomedical training</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RAZORPAY PAYMENT SIMULATION MODAL */}
      {isRazorpayModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative border border-[#DCE6F2]">
            <button
              onClick={() => setIsRazorpayModalOpen(false)}
              className="absolute top-4 right-4 text-[#5B6B82] hover:text-[#12263F] text-lg font-bold w-8 h-8 rounded-full bg-[#F6F9FD] flex items-center justify-center"
            >
              ✕
            </button>

            {/* Razorpay Brand Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE6F2]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0B2545] text-white flex items-center justify-center font-black text-xs">
                  R
                </div>
                <div>
                  <div className="font-black text-xs text-[#12263F]">Razorpay Trusted Checkout</div>
                  <div className="text-[11px] text-[#5B6B82]">Buy Denmed Healthcare Pvt Ltd</div>
                </div>
              </div>
              <span className="font-black text-sm text-[#0B2545]">
                ₹{draft.totalPayable.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#12263F]">
                Select Payment Mode:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR' },
                  { id: 'card', label: 'Cards' },
                  { id: 'netbanking', label: 'NetBanking' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      paymentMethod === m.id
                        ? 'border-[#0B2545] bg-[#0B2545] text-white shadow-xs'
                        : 'border-[#DCE6F2] bg-[#F6F9FD] text-[#12263F] hover:bg-[#EAF2FC]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Method Details */}
            {paymentMethod === 'upi' && (
              <div className="p-4 bg-[#F6F9FD] rounded-2xl border border-[#DCE6F2] text-center space-y-2">
                <div className="w-12 h-12 rounded-xl bg-white border border-[#DCE6F2] mx-auto flex items-center justify-center text-[#1D5FAF] font-black text-lg">
                  UPI
                </div>
                <div className="text-xs font-bold text-[#12263F]">Scan & Pay with Any UPI App</div>
                <div className="text-[12px] text-[#5B6B82]">GPay, PhonePe, Paytm, BHIM, Cred</div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="p-4 bg-[#F6F9FD] rounded-2xl border border-[#DCE6F2] space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Card Number (4111 2222 3333 4444)"
                  defaultValue="4111 2222 3333 4444"
                  className="w-full px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white font-mono text-[#12263F]"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="12/28"
                    className="px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white font-mono text-[#12263F]"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    defaultValue="123"
                    className="px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white font-mono text-[#12263F]"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div className="p-4 bg-[#F6F9FD] rounded-2xl border border-[#DCE6F2] space-y-2 text-xs">
                <select className="w-full px-3 py-2 border border-[#DCE6F2] rounded-xl bg-white font-medium text-[#12263F]">
                  <option>HDFC Bank (Corporate / Retail)</option>
                  <option>State Bank of India</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Kotak Mahindra Bank</option>
                </select>
              </div>
            )}

            {/* Confirm Payment Button */}
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleCompleteRazorpayPayment}
              className="w-full py-3.5 bg-[#0B2545] hover:bg-[#13335E] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-green-400" />
              <span>
                {isProcessingPayment
                  ? 'Authorizing with Bank...'
                  : `Pay ₹${draft.totalPayable.toLocaleString('en-IN')}`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
