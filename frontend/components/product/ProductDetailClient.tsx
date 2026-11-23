'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product, Variant } from '@/types';
import { useCartStore, useWishlistStore, usePincodeStore, useToastStore } from '@/lib/store';
import { checkPincodeServiceability } from '@/lib/api';
import { useSiteSettings } from '@/lib/settings/store';
import { Review } from '@/types';
import EmiModal from '@/components/common/EmiModal';
import ProductCard from '@/components/product/ProductCard';
import ProductGallery from '@/components/product/ProductGallery';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import { getProductImages } from '@/lib/utils';
import { useHydrated } from '@/hooks/use-hydrated';
import { 
  Heart, 
  ShoppingBag, 
  Star, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Bed, 
  MapPin, 
  Check, 
  X,
  Clock, 
  ChevronRight, 
  RotateCcw, 
  FileText,
  AlertCircle,
  Share2,
  Award,
  Zap
} from 'lucide-react';

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
  initialReviews?: Review[];
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({
  product,
  relatedProducts,
  initialReviews = []
}) => {
  const router = useRouter();
  const { addItem, setIsCartOpen } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { pincode: storePin, city: storeCity, deliveryDays: storeDelivery, setPincode } = usePincodeStore();
  const { addToast } = useToastStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [isEmiModalOpen, setIsEmiModalOpen] = useState(false);
  const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
  const [selectedRentalTenure, setSelectedRentalTenure] = useState(
    product.rentalPlans && product.rentalPlans.length > 0 ? product.rentalPlans[0].tenureMonths : 1
  );

  const settings = useSiteSettings();
  const { codEnabled, codMaxOrderValue } = settings?.shipping || { codEnabled: true, codMaxOrderValue: 50000 };

  // Pincode local check state
  const [inputPincode, setInputPincode] = useState(storePin || '');
  const [checkingPin, setCheckingPin] = useState(false);
  const [pinEstimate, setPinEstimate] = useState<string>(storeDelivery || '');
  const [pinCity, setPinCity] = useState<string>(storeCity || '');

  // Keep input synchronized with storePin when it updates or rehydrates
  useEffect(() => {
    if (storePin) {
      setInputPincode(storePin);
    }
  }, [storePin]);
  const [pinCheckResult, setPinCheckResult] = useState<{
    checked: boolean;
    serviceable: boolean;
    codAvailable: boolean;
    city: string;
    deliveryDays: string;
  } | null>(null);

  const hydrated = useHydrated();
  const isFavorited = hydrated ? isInWishlist(product.id) : false;

  // Dynamic price depending on variant selection
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  const currentDiscount = currentMrp > currentPrice
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : product.discountPercentage;
  const savings = currentMrp - currentPrice;

  // Auto-verify initial PIN against ecommerce serviceable list on mount/input
  useEffect(() => {
    const pin = (inputPincode || '').trim();
    if (/^[1-9]\d{5}$/.test(pin)) {
      let alive = true;
      checkPincodeServiceability(pin)
        .then((res) => {
          if (alive) {
            setPinCheckResult({
              checked: true,
              serviceable: res.serviceable,
              codAvailable: res.codAvailable,
              city: res.city,
              deliveryDays: res.deliveryDays,
            });
            if (res.serviceable) {
              setPinCity(res.city);
              setPinEstimate(res.deliveryDays);
            }
          }
        })
        .catch(() => {
          if (alive) {
            setPinCheckResult({
              checked: true,
              serviceable: false,
              codAvailable: false,
              city: '',
              deliveryDays: '',
            });
          }
        });
      return () => {
        alive = false;
      };
    } else {
      setPinCheckResult(null);
    }
  }, [inputPincode]);

  const handlePincodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = inputPincode.trim();
    if (!/^\d{6}$/.test(pin)) {
      addToast({ type: 'warning', title: 'Invalid PIN', message: 'Please enter a 6-digit Indian PIN code.' });
      return;
    }
    setCheckingPin(true);
    try {
      const res = await checkPincodeServiceability(pin);
      setPinCheckResult({
        checked: true,
        serviceable: res.serviceable,
        codAvailable: res.codAvailable,
        city: res.city,
        deliveryDays: res.deliveryDays,
      });
      if (res.serviceable) {
        setPinEstimate(res.deliveryDays);
        setPinCity(res.city);
        setPincode(pin, res.city, res.state, res.deliveryDays);
        const codAllowedForProduct = res.codAvailable && codEnabled && (!codMaxOrderValue || currentPrice <= codMaxOrderValue);
        addToast({
          type: 'success',
          title: 'Delivery Available',
          message: codAllowedForProduct
            ? `Estimated delivery to ${res.city}: ${res.deliveryDays} • Cash on Delivery Available`
            : `Estimated delivery to ${res.city}: ${res.deliveryDays} • Prepaid Only (COD Not Available)`,
        });
      } else {
        addToast({ type: 'error', title: 'Not Serviceable', message: `Delivery currently unavailable for PIN ${pin}.` });
      }
    } catch {
      setPinCheckResult({
        checked: true,
        serviceable: false,
        codAvailable: false,
        city: '',
        deliveryDays: '',
      });
      addToast({ type: 'error', title: 'Not Serviceable', message: `Delivery currently unavailable for PIN ${pin}.` });
    } finally {
      setCheckingPin(false);
    }
  };

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addItem(product, quantity, selectedVariant);
    addToast({
      type: 'success',
      title: 'Added to Cart',
      message: `${quantity}x ${product.name.slice(0, 30)}... added to cart.`
    });
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;
    addItem(product, quantity, selectedVariant, false, 1, false);
    setIsCartOpen(false);
    router.push('/checkout');
  };

  const handleAddRentalToCart = () => {
    const selectedPlan = product.rentalPlans?.find((p) => p.tenureMonths === selectedRentalTenure);
    addItem(product, 1, undefined, true, selectedRentalTenure);
    setIsRentalModalOpen(false);
    addToast({
      type: 'success',
      title: 'Rental Contract Added',
      message: `${product.name.slice(0, 30)} added on ${selectedRentalTenure} month(s) rental plan.`
    });
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'info',
        title: 'Link Copied',
        message: 'Product URL copied to clipboard for clinic sharing.'
      });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[#5B6B82] mb-6 flex-wrap font-body">
        <Link href="/" className="hover:text-[#1D5FAF] transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <Link href={`/category/${product.categoryId.replace('cat-', '')}`} className="hover:text-[#1D5FAF] transition-colors">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <span className="text-[#5B6B82]">{product.subCategory}</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B82]" />
        <span className="font-semibold text-[#12263F] truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Grid: Gallery & Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)] gap-6 xl:gap-8 items-start mb-12">
        {/* Left Gallery (5 cols) */}
        <div className="space-y-4">
          <ProductGallery
            images={getProductImages(product)}
            productName={product.name}
            badges={[
              ...(product.isBestSeller ? [{ text: 'BEST SELLER', type: 'bestseller' as const }] : []),
              ...(product.isDealOfDay ? [{ text: 'DEAL', type: 'deal' as const }] : []),
            ]}
            isWishlisted={isFavorited}
            onToggleWishlist={() => toggleWishlist(product)}
            onShare={handleShare}
          />

          {/* Certifications & Genuine assurance strip */}
          <div className="p-4 bg-[#EAF2FC]/60 rounded-xl border border-[#DCE6F2] text-xs text-[#5B6B82] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#12263F]">
              <ShieldCheck className="w-4 h-4 text-[#1D5FAF]" />
              <span>Official Distributor Guaranteed Authenticity</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[12px]">
              {product.certifications?.map((c, i) => (
                <span key={i} className="bg-white px-2 py-0.5 rounded border border-[#DCE6F2] font-semibold text-[#12263F]">
                  ✓ {c}
                </span>
              ))}
              <span className="bg-white px-2 py-0.5 rounded border border-[#DCE6F2] font-semibold text-[#12263F]">
                GST {product.gstRate}% Tax Invoice
              </span>
            </div>
          </div>
        </div>

        {/* Right Product Details & Actions (7 cols) */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DCE6F2] shadow-xs space-y-6">
          {/* Brand & SKU */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-heading">
              <Link
                href={`/brand/${product.brandId.replace('brand-', '')}`}
                className="font-bold text-[#1D5FAF] uppercase tracking-wider hover:underline"
              >
                {product.brandName}
              </Link>
              <span className="text-[#5B6B82] font-mono text-[12px]">
                SKU: {selectedVariant ? selectedVariant.sku : product.sku}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#12263F] leading-snug">
              {product.name}
            </h1>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4 mt-2.5 text-xs font-body">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('reviews');
                  const el = document.getElementById('product-tabs-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-1.5 bg-[#EAF2FC] text-[#174E90] px-2.5 py-1 rounded-md font-semibold hover:bg-[#DCE6F2] transition-colors cursor-pointer text-left"
                title="View customer reviews"
              >
                <Star className="w-4 h-4 text-[#F5B841] fill-current" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-[#5B6B82] font-normal underline">({product.reviewsCount} reviews)</span>
              </button>

              {product.inStock ? (
                <span className="text-[#16A34A] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block animate-pulse"></span>
                  In Stock ({product.stockCount} units available)
                </span>
              ) : (
                <span className="text-[#DC2626] font-bold">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Flash Deal of the Day Banner */}
          {product.isDealOfDay && (
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#EA580C] text-white rounded-xl shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-current text-white" />
                </span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider font-heading leading-tight">
                    Deal of the Day
                  </div>
                  <div className="text-[11px] text-orange-100 font-body">
                    {product.regularPrice && product.regularPrice > currentPrice
                      ? `Save ₹${(product.regularPrice - currentPrice).toLocaleString('en-IN')} off regular clinical price`
                      : 'Special flash sale price'}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5 text-white/90" />
                <span>LIMITED TIME</span>
              </div>
            </div>
          )}

          {/* Pricing Box */}
          <div className="p-4 bg-[#F6F9FD] rounded-xl border border-[#DCE6F2] space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#12263F] font-body">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentMrp > currentPrice && (
                <span className="text-base text-[#5B6B82] line-through font-body">
                  ₹{currentMrp.toLocaleString('en-IN')}
                </span>
              )}
              {currentDiscount > 0 && (
                <span className="text-xs font-bold text-[#16A34A] bg-green-100 px-2 py-0.5 rounded font-heading">
                  Save ₹{savings.toLocaleString('en-IN')} ({currentDiscount}% OFF)
                </span>
              )}
            </div>
            <div className="text-[12px] text-[#5B6B82] font-body">
              Inclusive of all taxes ({product.gstRate}% GST). Eligible for full B2B Input Tax Credit.
            </div>

            {/* EMI tag */}
            {product.emiEnabled && (
              <div className="pt-2 border-t border-[#DCE6F2] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#12263F]">
                  <CreditCard className="w-4 h-4 text-[#1D5FAF]" />
                  <span>
                    EMI starting from <strong className="text-[#12263F]">₹{product.emiStartingFrom?.toLocaleString('en-IN') || '1,499'}/month</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmiModalOpen(true)}
                  className="text-xs font-bold text-[#1D5FAF] hover:underline"
                >
                  View EMI plans →
                </button>
              </div>
            )}
          </div>

          {/* Variants Selector (if applicable) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#12263F] uppercase tracking-wider block font-heading">
                Select Option / Model / Pack:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        isSelected
                          ? 'border-[#1D5FAF] bg-[#EAF2FC] text-[#174E90] shadow-xs'
                          : 'border-[#DCE6F2] text-[#12263F] hover:border-[#1D5FAF]/50'
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="text-[12px] font-bold text-[#12263F] mt-0.5 font-body">
                        ₹{v.price.toLocaleString('en-IN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Direct CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              {/* Quantity */}
              <div className="flex items-center border border-[#DCE6F2] rounded-xl overflow-hidden bg-[#F6F9FD] h-11">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 hover:bg-[#EAF2FC] text-[#12263F] font-bold transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#12263F] font-body">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
                  className="px-3 hover:bg-[#EAF2FC] text-[#12263F] font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                disabled={!product.inStock}
                onClick={handleAddToCart}
                className="flex-1 h-11 px-6 bg-[#1D5FAF] hover:bg-[#174E90] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 font-heading cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Buy Now button (Orange Accent #F28C38 -> hover #E07A26) */}
              <button
                disabled={!product.inStock}
                onClick={handleBuyNow}
                className="flex-1 h-11 px-6 bg-[#F28C38] hover:bg-[#E07A26] text-[#12263F] font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 font-heading cursor-pointer"
              >
                <span>Buy Now</span>
              </button>
            </div>

            {/* Rent Button if rentEnabled */}
            {product.rentEnabled && (
              <Link
                href={`/rent/${product.slug}`}
                className="w-full h-11 px-4 bg-[#EAF2FC] hover:bg-[#DCE6F2] text-[#174E90] border border-[#1D5FAF]/30 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 font-heading cursor-pointer"
              >
                <Bed className="w-4 h-4" />
                <span>Rent this Product from ₹{product.rentPricePerMonth?.toLocaleString('en-IN')}/Month</span>
              </Link>
            )}
          </div>

          {/* Pincode Delivery Estimate Box */}
          <div className="p-4 rounded-xl border border-[#DCE6F2] bg-white space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#12263F] font-heading">
              <Truck className="w-4 h-4 text-[#1D5FAF]" />
              <span>Check Doorstep Delivery to Your Clinic / Hospital:</span>
            </div>

            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                id="pdp-pincode-input"
                name="pincode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={inputPincode}
                onChange={(e) => {
                  setInputPincode(e.target.value.replace(/\D/g, ''));
                  setPinCheckResult(null);
                }}
                placeholder="6-Digit PIN"
                className="w-36 text-xs px-3 py-2 border border-[#DCE6F2] rounded-lg focus:outline-none focus:border-[#1D5FAF] font-semibold tracking-wider font-body text-[#12263F]"
              />
              <button
                type="submit"
                disabled={checkingPin || inputPincode.trim().length !== 6}
                className="px-4 py-2 bg-[#0B2545] hover:bg-[#13335E] text-white text-xs font-semibold rounded-lg transition-colors font-heading cursor-pointer disabled:opacity-50"
              >
                {checkingPin ? 'Checking...' : 'Check'}
              </button>
            </form>

            {pinCheckResult && (
              <div className="space-y-1.5 pt-0.5 font-body">
                <div className="text-xs text-[#5B6B82] flex items-center gap-1.5">
                  {pinCheckResult.serviceable ? (
                    <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  )}
                  <span>
                    {pinCheckResult.serviceable ? (
                      <>
                        Estimated Delivery to <strong className="text-[#12263F]">{pinCity}</strong> ({inputPincode}):{' '}
                        <strong className="text-[#12263F]">{pinEstimate}</strong>
                      </>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        We don&apos;t deliver to PIN {inputPincode} yet.
                      </span>
                    )}
                  </span>
                </div>

                {pinCheckResult.serviceable && (
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {pinCheckResult.codAvailable && codEnabled && (!codMaxOrderValue || currentPrice <= codMaxOrderValue) ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" /> Cash on Delivery Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        {!pinCheckResult.codAvailable
                          ? 'Cash on Delivery Not Available for this PIN (Prepaid Only)'
                          : codMaxOrderValue && currentPrice > codMaxOrderValue
                            ? `Prepaid Only (COD limit ₹${codMaxOrderValue.toLocaleString('en-IN')} exceeded)`
                            : 'Cash on Delivery Disabled (Prepaid Only)'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specifications Table, Reviews */}
      <div id="product-tabs-section" className="bg-white rounded-2xl border border-[#DCE6F2] shadow-xs overflow-hidden mb-12">
        <div className="flex border-b border-[#DCE6F2] bg-[#F6F9FD] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('desc')}
            className={`py-3.5 px-6 text-xs sm:text-sm font-bold font-heading transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'desc'
                ? 'border-[#1D5FAF] text-[#1D5FAF] bg-white'
                : 'border-transparent text-[#5B6B82] hover:text-[#12263F]'
            }`}
          >
            Product Overview & Features
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 px-6 text-xs sm:text-sm font-bold font-heading transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'specs'
                ? 'border-[#1D5FAF] text-[#1D5FAF] bg-white'
                : 'border-transparent text-[#5B6B82] hover:text-[#12263F]'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 px-6 text-xs sm:text-sm font-bold font-heading transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#1D5FAF] text-[#1D5FAF] bg-white'
                : 'border-transparent text-[#5B6B82] hover:text-[#12263F]'
            }`}
          >
            Doctor Reviews & Ratings ({product.reviewsCount})
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'desc' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-base text-[#12263F] mb-2 font-heading">Description</h3>
                {/<[a-z][\s\S]*>/i.test(product.description || '') ? (
                  <div
                    className="text-xs sm:text-sm text-[#5B6B82] leading-relaxed font-body rich-description"
                    dangerouslySetInnerHTML={{ __html: product.description || '' }}
                  />
                ) : (
                  <p className="text-xs sm:text-sm text-[#5B6B82] leading-relaxed font-body whitespace-pre-line">
                    {product.description}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-bold text-base text-[#12263F] mb-3 font-heading">Key Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {product.features?.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#12263F] font-body">
                      <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#EAF2FC]/70 rounded-xl border border-[#DCE6F2] text-xs text-[#12263F] space-y-1">
                <div className="font-bold text-[#12263F] flex items-center gap-1.5 font-heading">
                  <Award className="w-4 h-4 text-[#1D5FAF]" />
                  <span>Warranty & Support Terms</span>
                </div>
                <p className="font-body text-[#5B6B82]">{product.warranty}</p>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              <h3 className="font-bold text-base text-[#12263F] mb-4 font-heading">Technical Details</h3>
              <div className="border border-[#DCE6F2] rounded-xl overflow-hidden divide-y divide-[#DCE6F2] text-xs font-body">
                {Object.entries(product.specifications).map(([key, val], idx) => (
                  <div key={idx} className="grid grid-cols-3 p-3 hover:bg-[#F6F9FD]">
                    <span className="font-semibold text-[#5B6B82]">{key}</span>
                    <span className="col-span-2 font-bold text-[#12263F]">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <ProductReviewsSection
              productId={product.id}
              productName={product.name}
              initialReviews={initialReviews}
              rating={product.rating}
              reviewsCount={product.reviewsCount}
            />
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4 mb-12">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#12263F]">
              Frequently Bought Together
            </h2>
            <Link
              href={`/category/${product.categoryId.replace('cat-', '')}`}
              className="text-xs font-semibold text-[#1D5FAF] hover:underline font-heading"
            >
              View More in {product.categoryName} →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* EMI Modal */}
      {product.emiEnabled && (
        <EmiModal
          product={product}
          isOpen={isEmiModalOpen}
          onClose={() => setIsEmiModalOpen(false)}
        />
      )}

    </div>
  );
};

export default ProductDetailClient;
