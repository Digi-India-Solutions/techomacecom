'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Product, Variant } from '@/types';
import { useCartStore, useWishlistStore, usePincodeStore, useToastStore } from '@/lib/store';
import { checkPincodeServiceability } from '@/lib/api';
import { Review } from '@/types';
import EmiModal from '@/components/common/EmiModal';
import ProductCard from '@/components/product/ProductCard';
import ProductGallery from '@/components/product/ProductGallery';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
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
  Clock, 
  ChevronRight, 
  RotateCcw, 
  FileText,
  AlertCircle,
  Share2,
  Award
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

  // Pincode local check state
  const [inputPincode, setInputPincode] = useState(storePin || '110001');
  const [checkingPin, setCheckingPin] = useState(false);
  const [pinEstimate, setPinEstimate] = useState<string>(storeDelivery || '2-3 Business Days');
  const [pinCity, setPinCity] = useState<string>(storeCity || 'Delhi NCR');

  const isFavorited = isInWishlist(product.id);

  // Dynamic price depending on variant selection
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  const currentDiscount = currentMrp > currentPrice
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : product.discountPercentage;
  const savings = currentMrp - currentPrice;

  const handlePincodeCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(inputPincode.trim())) {
      addToast({ type: 'warning', title: 'Invalid PIN', message: 'Please enter a 6-digit Indian PIN code.' });
      return;
    }
    setCheckingPin(true);
    try {
      const res = await checkPincodeServiceability(inputPincode.trim());
      if (res.serviceable) {
        setPinEstimate(res.deliveryDays);
        setPinCity(res.city);
        setPincode(inputPincode.trim(), res.city, res.state, res.deliveryDays);
        addToast({
          type: 'success',
          title: 'Delivery Available',
          message: `Estimated delivery to ${res.city}: ${res.deliveryDays}`
        });
      } else {
        addToast({ type: 'error', title: 'Not Serviceable', message: 'Delivery currently unavailable for this PIN.' });
      }
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
    addItem(product, quantity, selectedVariant);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap font-body">
        <Link href="/" className="hover:text-[#0F766E] transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href={`/category/${product.categoryId.replace('cat-', '')}`} className="hover:text-[#0F766E] transition-colors">
          {product.categoryName}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500">{product.subCategory}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Grid: Gallery & Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* Left Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <ProductGallery
            images={product.images && product.images.length > 0 ? product.images : [product.thumbnail]}
            productName={product.name}
            badges={[
              ...(currentDiscount > 0 ? [{ text: `${currentDiscount}% OFF`, type: 'discount' as const }] : []),
              ...(product.isBestSeller ? [{ text: 'BEST SELLER', type: 'bestseller' as const }] : []),
              ...(product.isDealOfDay ? [{ text: 'DEAL', type: 'deal' as const }] : []),
            ]}
            isWishlisted={isFavorited}
            onToggleWishlist={() => toggleWishlist(product)}
            onShare={handleShare}
          />

          {/* Certifications & Genuine assurance strip */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              <span>Official Distributor Guaranteed Authenticity</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {product.certifications?.map((c, i) => (
                <span key={i} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                  ✓ {c}
                </span>
              ))}
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                GST {product.gstRate}% Tax Invoice
              </span>
            </div>
          </div>
        </div>

        {/* Right Product Details & Actions (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {/* Brand & SKU */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5 font-heading">
              <Link
                href={`/brand/${product.brandId.replace('brand-', '')}`}
                className="font-bold text-[#0F766E] uppercase tracking-wider hover:underline"
              >
                {product.brandName}
              </Link>
              <span className="text-slate-400 font-mono text-[11px]">
                SKU: {selectedVariant ? selectedVariant.sku : product.sku}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 leading-snug">
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
                className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-md font-semibold hover:bg-amber-100 transition-colors cursor-pointer text-left"
                title="View customer reviews"
              >
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-slate-500 font-normal underline">({product.reviewsCount} reviews)</span>
              </button>

              {product.inStock ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  In Stock ({product.stockCount} units available)
                </span>
              ) : (
                <span className="text-red-600 font-bold">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 font-body">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentMrp > currentPrice && (
                <span className="text-base text-slate-400 line-through font-body">
                  ₹{currentMrp.toLocaleString('en-IN')}
                </span>
              )}
              {currentDiscount > 0 && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-heading">
                  Save ₹{savings.toLocaleString('en-IN')} ({currentDiscount}% OFF)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-body">
              Inclusive of all taxes ({product.gstRate}% GST). Eligible for full B2B Input Tax Credit.
            </div>

            {/* EMI tag */}
            {product.emiEnabled && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CreditCard className="w-4 h-4 text-[#0F766E]" />
                  <span>
                    EMI starting from <strong className="text-slate-900">₹{product.emiStartingFrom?.toLocaleString('en-IN') || '1,499'}/month</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEmiModalOpen(true)}
                  className="text-xs font-bold text-[#0F766E] hover:underline"
                >
                  View EMI plans →
                </button>
              </div>
            )}
          </div>

          {/* Variants Selector (if applicable) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block font-heading">
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
                          ? 'border-[#0F766E] bg-[#E6F4F3] text-[#0F766E] shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div>{v.name}</div>
                      <div className="text-[11px] font-bold text-slate-900 mt-0.5 font-body">
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
              <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50 h-11">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-sm text-slate-900 font-body">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stockCount, q + 1))}
                  className="px-3 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                disabled={!product.inStock}
                onClick={handleAddToCart}
                className="flex-1 h-11 px-6 bg-[#0F766E] hover:bg-[#0B5F58] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 font-heading cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {/* Buy Now button */}
              <button
                disabled={!product.inStock}
                onClick={handleBuyNow}
                className="flex-1 h-11 px-6 bg-[#1E293B] hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 font-heading cursor-pointer"
              >
                <span>Buy Now</span>
              </button>
            </div>

            {/* Rent Button if rentEnabled */}
            {product.rentEnabled && (
              <button
                type="button"
                onClick={() => setIsRentalModalOpen(true)}
                className="w-full h-11 px-4 bg-[#E6F4F3] hover:bg-[#d6edea] text-[#0F766E] border border-teal-200 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 font-heading cursor-pointer"
              >
                <Bed className="w-4 h-4" />
                <span>Rent this Product from ₹{product.rentPricePerMonth?.toLocaleString('en-IN')}/Month</span>
              </button>
            )}
          </div>

          {/* Pincode Delivery Estimate Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 font-heading">
              <Truck className="w-4 h-4 text-[#0F766E]" />
              <span>Check Doorstep Delivery to Your Clinic / Hospital:</span>
            </div>

            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={inputPincode}
                onChange={(e) => setInputPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-Digit PIN"
                className="w-36 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F766E] font-semibold tracking-wider font-body"
              />
              <button
                type="submit"
                disabled={checkingPin}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors font-heading cursor-pointer"
              >
                {checkingPin ? 'Checking...' : 'Check'}
              </button>
            </form>

            <div className="text-xs text-slate-600 flex items-center gap-1.5 font-body">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Estimated Delivery to <strong>{pinCity}</strong> ({inputPincode}): <strong>{pinEstimate}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Specifications Table, Reviews */}
      <div id="product-tabs-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mb-12">
        <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('desc')}
            className={`py-3.5 px-6 text-xs sm:text-sm font-bold font-heading transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'desc'
                ? 'border-[#0F766E] text-[#0F766E] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Product Overview & Features
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3.5 px-6 text-xs sm:text-sm font-bold font-heading transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'specs'
                ? 'border-[#0F766E] text-[#0F766E] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 px-6 text-xs sm:text-sm font-bold font-heading transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#0F766E] text-[#0F766E] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Doctor Reviews & Ratings ({product.reviewsCount})
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'desc' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-2 font-heading">Description</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-body">
                  {product.description}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900 mb-3 font-heading">Key Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {product.features?.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-body">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 font-heading">
                  <Award className="w-4 h-4 text-[#0F766E]" />
                  <span>Warranty & Support Terms</span>
                </div>
                <p className="font-body">{product.warranty}</p>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-4 font-heading">Technical Details</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 text-xs font-body">
                {Object.entries(product.specifications).map(([key, val], idx) => (
                  <div key={idx} className="grid grid-cols-3 p-3 hover:bg-slate-50/60">
                    <span className="font-semibold text-slate-500">{key}</span>
                    <span className="col-span-2 font-bold text-slate-900">{val}</span>
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
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
              Frequently Bought Together
            </h2>
            <Link
              href={`/category/${product.categoryId.replace('cat-', '')}`}
              className="text-xs font-semibold text-[#0F766E] hover:underline font-heading"
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

      {/* Rent Modal */}
      {isRentalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="font-bold text-base text-slate-900 flex items-center gap-2 font-heading">
                <Bed className="w-5 h-5 text-[#0F766E]" />
                <span>Rent {product.name.slice(0, 25)}...</span>
              </div>
              <button
                onClick={() => setIsRentalModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-body">
              Select your required rental tenure. All rental contracts include free doorstep setup, calibration, and zero repair liability.
            </p>

            <div className="space-y-2 font-body">
              {product.rentalPlans?.map((plan) => (
                <label
                  key={plan.tenureMonths}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRentalTenure === plan.tenureMonths
                      ? 'border-[#0F766E] bg-[#E6F4F3]'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="rentalTenure"
                      checked={selectedRentalTenure === plan.tenureMonths}
                      onChange={() => setSelectedRentalTenure(plan.tenureMonths)}
                      className="text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 font-heading">
                        {plan.tenureMonths} Month Plan
                      </div>
                      <div className="text-[11px] text-slate-500 font-body">
                        Refundable Deposit: ₹{(plan.securityDeposit ?? product.securityDeposit ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-[#0F766E] font-body">
                      ₹{(plan.pricePerMonth ?? plan.price ?? 0).toLocaleString('en-IN')}/mo
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-2 flex gap-2 font-heading">
              <button
                onClick={() => setIsRentalModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRentalToCart}
                className="flex-1 py-2.5 bg-[#0F766E] hover:bg-[#0B5F58] text-white rounded-xl text-xs font-bold"
              >
                Add Rental to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailClient;
