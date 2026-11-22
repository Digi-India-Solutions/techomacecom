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
import { useHydrated } from '@/hooks/use-hydrated';
import CustomerAuthForm from '@/components/auth/CustomerAuthForm';
import { logoutCustomer } from '@/lib/api/customerAuth';
import { CheckoutSkeleton } from '@/components/skeletons/PageSkeletons';
import { useSiteSettings } from '@/lib/settings/store';
import { usePincodeCheck } from '@/lib/settings/pincode';
import { gstinError } from '@/lib/india';
import { createOrder, verifyOrderPayment } from '@/lib/api/orders';
import { errorMessage } from '@/lib/api/backend';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getSubtotal, getDiscount, getShippingFee, getGstAmount, getTotal, clearCart, coupon } = useCartStore();
  const { user, isAuthenticated, logout } = useUserStore();
  const { addToast } = useToastStore();
  const hydrated = useHydrated();

  // Step 1 is the real sign-in (CustomerAuthForm → API); details come from the signed-in user.

  // Step 2: Address Selection / Addition
  const defaultAddr = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || 'new');
  const [showNewAddressForm, setShowNewAddressForm] = useState(!defaultAddr);

  const [newAddr, setNewAddr] = useState<Address>({
    id: 'addr-new-entry',
    type: 'Clinic',
    name: user?.name || '',
    clinicHospitalName: '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    city: '',
    state: '',
    isDefault: true
  });

  // Automatically populate address recipient name and phone from signed-in customer
  React.useEffect(() => {
    if (user) {
      setNewAddr((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  // Step 3: Optional GSTIN business invoice
  const [includeGst, setIncludeGst] = useState<boolean>(Boolean(user?.gstDetails?.gstin));
  const [gstin, setGstin] = useState<string>(user?.gstDetails?.gstin || '');
  const [legalCompanyName, setLegalCompanyName] = useState<string>(user?.gstDetails?.legalBusinessName || '');
  const [gstError, setGstError] = useState<string>('');

  // Step 4: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const gst = getGstAmount();
  const total = getTotal();
  const settings = useSiteSettings();

  // Delivery PIN code → serviceability + COD (Settings → Shipping)
  const deliveryPincode =
    selectedAddressId === 'new' || showNewAddressForm
      ? newAddr.pincode
      : user?.addresses?.find((a) => a.id === selectedAddressId)?.pincode || '';
  const { result: pinCheck, loading: pinChecking } = usePincodeCheck(deliveryPincode);

  const { codEnabled, codMaxOrderValue, codCharge } = settings.shipping;
  const codBlockedReason = !codEnabled
    ? ''
    : codMaxOrderValue > 0 && total > codMaxOrderValue
      ? `Available for orders up to ₹${codMaxOrderValue.toLocaleString('en-IN')}`
      : pinCheck && !pinCheck.codAvailable
        ? `Not available for PIN ${pinCheck.pincode}`
        : '';
  const codAllowed = codEnabled && !codBlockedReason;
  const effectiveMethod = paymentMethod === 'cod' && !codAllowed ? 'razorpay' : paymentMethod;
  const codFee = effectiveMethod === 'cod' ? codCharge : 0;
  const payable = total + codFee;
  const gstLabel = settings.tax.pricesIncludeGst ? 'GST (included in price)' : 'GST';

  // GSTIN: format, state code and check digit (same rules as the API)
  const validateGstin = (code: string) => !gstinError(code);

  const handleSwitchAccount = async () => {
    await logoutCustomer();
    logout();
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
    if (!isAuthenticated || !user) {
      addToast({ type: 'error', title: 'Sign in required', message: 'Verify your mobile number in step 1 to place the order.' });
      return;
    }

    if (pinCheck && !pinCheck.serviceable) {
      addToast({ type: 'error', title: 'Delivery not available', message: `${pinCheck.message}. Please choose another address.` });
      return;
    }

    const rawChosen =
      selectedAddressId === 'new' || showNewAddressForm
        ? newAddr
        : user?.addresses?.find((a) => a.id === selectedAddressId) || newAddr;

    const chosenAddress: Address = {
      ...rawChosen,
      name: (rawChosen.name?.trim() || user?.name?.trim() || 'Customer'),
      phone: (rawChosen.phone?.trim() || user?.phone?.trim() || ''),
    };

    // Validate address fields if entering a new address
    if (selectedAddressId === 'new' || showNewAddressForm) {
      if (!chosenAddress.name?.trim()) {
        addToast({ type: 'error', title: 'Address incomplete', message: 'Please enter doctor or recipient name.' });
        return;
      }
      if (!chosenAddress.phone?.trim()) {
        addToast({ type: 'error', title: 'Address incomplete', message: 'Please enter a contact phone number.' });
        return;
      }
      if (!chosenAddress.addressLine1?.trim()) {
        addToast({ type: 'error', title: 'Address incomplete', message: 'Please enter street address / building details.' });
        return;
      }
      if (!chosenAddress.pincode?.trim() || !chosenAddress.city?.trim() || !chosenAddress.state?.trim()) {
        addToast({ type: 'error', title: 'Address incomplete', message: 'Please enter PIN code, city, and state.' });
        return;
      }
    }

    // Validate GSTIN if checked
    if (includeGst) {
      if (!validateGstin(gstin)) {
        setGstError(gstinError(gstin) || 'Please enter a valid GSTIN');
        return;
      }
      if (!legalCompanyName.trim()) {
        setGstError('Please enter your Registered Legal Entity Name');
        return;
      }
      setGstError('');
    }

    setIsProcessing(true);

    try {
      const order = await createOrder({
        items: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          productName: it.product.name,
          variantName: it.variantName || 'Default',
          sku: it.product.sku,
          quantity: it.quantity,
          unitPrice: it.price,
          mrp: it.mrp || it.price,
          imageUrl: it.product.thumbnail || it.product.images?.[0]?.url || '',
        })),
        shippingAddress: chosenAddress,
        billingAddress: {
          name: includeGst && legalCompanyName ? legalCompanyName : chosenAddress.name,
          phone: chosenAddress.phone,
          line1: chosenAddress.addressLine1,
          line2: chosenAddress.addressLine2,
          city: chosenAddress.city,
          state: chosenAddress.state,
          pincode: chosenAddress.pincode,
        },
        gstDetails: includeGst ? {
          gstin,
          legalBusinessName: legalCompanyName,
        } : undefined,
        paymentMethod: effectiveMethod,
        subtotal,
        discount,
        shipping,
        codCharge: codFee,
        tax: gst,
        total: payable,
        couponCode: coupon?.code,
      });

      // If online payment via Razorpay
      if (effectiveMethod === 'razorpay') {
        if (!order.razorpay) {
          setIsProcessing(false);
          addToast({
            type: 'error',
            title: 'Payment Gateway Offline',
            message: 'Razorpay gateway could not be initialized. Please try again or select Cash on Delivery.',
          });
          return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded) {
          setIsProcessing(false);
          addToast({
            type: 'error',
            title: 'Payment Gateway Error',
            message: 'Could not load Razorpay checkout SDK. Please check your internet connection.',
          });
          return;
        }

        const rzpOptions = {
          key: order.razorpay.keyId,
          amount: order.razorpay.amount,
          currency: order.razorpay.currency || 'INR',
          name: 'Buy Denmed',
          description: `Order #${order.orderNumber}`,
          order_id: order.razorpay.orderId,
          prefill: {
            name: chosenAddress.name || user?.name || '',
            email: user?.email || '',
            contact: chosenAddress.phone || user?.phone || '',
          },
          theme: {
            color: '#1D5FAF',
          },
          handler: async function (response: any) {
            try {
              setIsProcessing(true);
              await verifyOrderPayment(order.id, {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              clearCart();
              setIsProcessing(false);
              addToast({
                type: 'success',
                title: 'Payment Successful!',
                message: `Order #${order.orderNumber} confirmed.`,
              });
              router.push(`/order-success/${order.orderNumber || order.id}`);
            } catch (vErr) {
              setIsProcessing(false);
              addToast({
                type: 'error',
                title: 'Payment Verification Failed',
                message: errorMessage(vErr, 'Payment verification failed. Please contact support if amount was debited.'),
              });
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              addToast({
                type: 'info',
                title: 'Payment Window Closed',
                message: 'Payment was not completed. You can try again or choose Cash on Delivery.',
              });
            },
          },
        };

        const rzp = new (window as any).Razorpay(rzpOptions);
        rzp.on('payment.failed', function (resp: any) {
          setIsProcessing(false);
          addToast({
            type: 'error',
            title: 'Payment Failed',
            message: resp.error?.description || 'Your payment was declined or could not be completed.',
          });
        });
        rzp.open();
        return;
      }

      // Cash On Delivery
      clearCart();
      setIsProcessing(false);
      addToast({
        type: 'success',
        title: 'Order Placed!',
        message: `Order #${order.orderNumber} successfully booked.`,
      });
      router.push(`/order-success/${order.orderNumber || order.id}`);
    } catch (err) {
      setIsProcessing(false);
      addToast({
        type: 'error',
        title: 'Order placement failed',
        message: errorMessage(err, 'Could not complete your order. Please try again.'),
      });
    }
  };

  if (!hydrated) return <CheckoutSkeleton />;

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

            {!isAuthenticated || !user ? (
              <div className="max-w-md">
                <p className="text-xs text-[#5B6B82] mb-3">
                  Sign in with your mobile number to continue. New customers get an account automatically.
                </p>
                <CustomerAuthForm />
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-[#5B6B82] bg-[#F6F9FD] p-3 rounded-xl">
                <div>
                  <div className="font-bold text-[#12263F]">{user.name || 'Name not added yet'}</div>
                  <div className="text-[#5B6B82]">
                    {user.phone ? `+91 ${user.phone}` : 'No mobile added'}
                    {user.email ? ` • ${user.email}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="text-xs text-[#1D5FAF] hover:underline font-semibold cursor-pointer"
                >
                  Not you? Switch account
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      Doctor / Recipient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      placeholder="Dr. Full Name"
                      className="w-full text-xs px-3 py-2 bg-white border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF]"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-[#12263F] block mb-1">
                      Contact Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      placeholder="10-digit mobile number"
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

            {/* Delivery estimate for the chosen address */}
            {/^[1-9]\d{5}$/.test(deliveryPincode) && (
              <div
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  pinCheck && !pinCheck.serviceable ? 'bg-red-50 text-red-700' : 'bg-[#F6F9FD] text-[#5B6B82]'
                }`}
              >
                {pinCheck && !pinCheck.serviceable ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Truck className="w-4 h-4 shrink-0 text-[#1D5FAF]" />}
                {pinChecking || !pinCheck ? (
                  <span>Checking delivery to {deliveryPincode}…</span>
                ) : pinCheck.serviceable ? (
                  <span>
                    Delivers to <strong className="text-[#12263F]">{deliveryPincode}</strong> in{' '}
                    <strong className="text-[#12263F]">{pinCheck.deliveryDays} business days</strong>
                    {pinCheck.codAvailable && codEnabled ? ' · Cash on delivery available' : ''}
                  </span>
                ) : (
                  <span>{pinCheck.message} ({deliveryPincode}).</span>
                )}
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
                  effectiveMethod === 'razorpay'
                    ? 'border-[#1D5FAF] bg-[#EAF2FC]/60 shadow-xs'
                    : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={effectiveMethod === 'razorpay'}
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

              {/* Cash On Delivery — Settings → Shipping (on/off, order limit, PIN code, charge) */}
              {codEnabled && (
                <label
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                    !codAllowed
                      ? 'border-[#DCE6F2] opacity-60 cursor-not-allowed'
                      : effectiveMethod === 'cod'
                        ? 'border-[#1D5FAF] bg-[#EAF2FC]/60 shadow-xs cursor-pointer'
                        : 'border-[#DCE6F2] hover:border-[#1D5FAF]/50 cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    disabled={!codAllowed}
                    checked={effectiveMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#1D5FAF] focus:ring-[#1D5FAF] mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[#12263F]">Cash on Delivery (Pay at Clinic / Hospital)</span>
                      {codCharge > 0 && (
                        <span className="text-[11px] font-semibold text-[#5B6B82]">+₹{codCharge.toLocaleString('en-IN')} handling</span>
                      )}
                    </div>
                    <p className="text-xs text-[#5B6B82] mt-1">
                      {codBlockedReason || 'Pay via cash or UPI QR scanner when the parcel arrives.'}
                    </p>
                  </div>
                </label>
              )}
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
            {settings.tax.gstEnabled && (
              <div className="flex justify-between">
                <span>{gstLabel}</span>
                <span className="font-semibold text-[#12263F]">₹{gst.toLocaleString('en-IN')}</span>
              </div>
            )}
            {codFee > 0 && (
              <div className="flex justify-between">
                <span>COD handling charge</span>
                <span className="font-semibold text-[#12263F]">₹{codFee.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-[#12263F] pt-3 border-t border-[#DCE6F2]">
              <span>Total Payable</span>
              <span className="text-xl text-[#12263F] font-extrabold">₹{payable.toLocaleString('en-IN')}</span>
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
                <span>
                  {effectiveMethod === 'cod' ? `Place Order · Pay ₹${payable.toLocaleString('en-IN')} on delivery` : `Place Order & Pay ₹${payable.toLocaleString('en-IN')}`}
                </span>
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
              Free transit insurance, manufacturer certified warranty cards
              {settings.returns.returnsEnabled
                ? `, and ${settings.returns.returnWindowDays}-day ${
                    settings.returns.replacementEnabled && settings.returns.refundEnabled
                      ? 'return or replacement'
                      : settings.returns.replacementEnabled
                        ? 'replacement'
                        : 'returns'
                  } if anything arrives damaged or faulty.`
                : ' included.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
