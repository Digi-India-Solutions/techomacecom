import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, Variant, CartItem, User, Address, Coupon } from '@/types';
import { getSiteSettingsSnapshot } from '@/lib/settings/store';

// =======================
// CART STORE
// =======================
interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  isCartOpen: boolean;
  addItem: (product: Product, quantity?: number, variant?: Variant, isRental?: boolean, rentalTenureMonths?: number, openCart?: boolean) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  setIsCartOpen: (open: boolean) => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  /** Settings → Shipping: flat charge below the free-shipping amount */
  getShippingFee: () => number;
  /** Settings → Tax: GST in the cart — part of the price when prices include GST, else added on top */
  getGstAmount: () => number;
  /** Rupees still needed for free shipping (0 = already free) */
  getAmountToFreeShipping: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isCartOpen: false,

      addItem: (product, quantity = 1, variant, isRental = false, rentalTenureMonths = 1, openCart = true) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) =>
              item.productId === product.id &&
              item.variantId === (variant?.id || undefined) &&
              Boolean(item.isRental) === Boolean(isRental)
          );

          const itemPrice = isRental
            ? product.rentPricePerMonth || 3500
            : variant?.price || product.price;

          const itemMrp = isRental
            ? (product.rentPricePerMonth || 3500) * 1.3
            : variant?.mrp || product.mrp;

          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems, isCartOpen: openCart };
          } else {
            const newItem: CartItem = {
              productId: product.id,
              product,
              variantId: variant?.id,
              variantName: variant?.name,
              quantity,
              price: itemPrice,
              mrp: itemMrp,
              isRental,
              rentalTenureMonths: isRental ? rentalTenureMonths : undefined
            };
            return { items: [...state.items, newItem], isCartOpen: openCart };
          }
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => !(item.productId === productId && item.variantId === variantId)
              )
            };
          }
          return {
            items: state.items.map((item) => {
              if (item.productId === productId && item.variantId === variantId) {
                return { ...item, quantity };
              }
              return item;
            })
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && item.variantId === variantId)
          )
        }));
      },

      clearCart: () => {
        set({ items: [], coupon: null });
      },

      applyCoupon: (coupon) => {
        set({ coupon });
      },

      removeCoupon: () => {
        set({ coupon: null });
      },

      setIsCartOpen: (open) => {
        set({ isCartOpen: open });
      },

      getSubtotal: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().coupon;
        if (!coupon || subtotal < coupon.minOrderValue) return 0;

        if (coupon.discountType === 'percentage') {
          const discount = Math.round((subtotal * coupon.discountValue) / 100);
          return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
        }
        return coupon.discountValue;
      },

      getShippingFee: () => {
        const subtotal = get().getSubtotal();
        const { shipping } = getSiteSettingsSnapshot();
        if (subtotal === 0) return 0;
        if (shipping.freeShippingAbove > 0 && subtotal >= shipping.freeShippingAbove) return 0;
        return shipping.flatShippingCharge;
      },

      getAmountToFreeShipping: () => {
        const { shipping } = getSiteSettingsSnapshot();
        if (shipping.freeShippingAbove <= 0 || shipping.flatShippingCharge <= 0) return 0;
        return Math.max(0, shipping.freeShippingAbove - get().getSubtotal());
      },

      getGstAmount: () => {
        const { tax } = getSiteSettingsSnapshot();
        if (!tax.gstEnabled) return 0;
        const subtotal = get().getSubtotal();
        if (subtotal <= 0) return 0;
        // Spread a coupon over the lines in proportion, then use each product's own GST rate
        const afterDiscount = Math.max(0, subtotal - get().getDiscount()) / subtotal;
        const gst = get().items.reduce((sum, item) => {
          const line = item.price * item.quantity * afterDiscount;
          const rate = typeof item.product?.gstRate === 'number' ? item.product.gstRate : tax.defaultGstRate;
          return sum + (tax.pricesIncludeGst ? (line * rate) / (100 + rate) : (line * rate) / 100);
        }, 0);
        return Math.round(gst);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const shipping = get().getShippingFee();
        const { tax } = getSiteSettingsSnapshot();
        // GST-inclusive prices already contain the tax; otherwise it is added here
        const gstOnTop = tax.gstEnabled && !tax.pricesIncludeGst ? get().getGstAmount() : 0;
        return Math.max(0, subtotal - discount + shipping + gstOnTop);
      },

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      }
    }),
    {
      name: 'buydenmed-cart-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
      }))
    }
  )
);

// =======================
// WISHLIST STORE
// =======================
interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => boolean;
  isInWishlist: (productId: string) => boolean;
  removeFromWishlist: (productId: string) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== product.id)
          }));
          return false;
        } else {
          set((state) => ({
            items: [...state.items, product]
          }));
          return true;
        }
      },
      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },
      removeFromWishlist: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId)
        }));
      }
    }),
    {
      name: 'buydenmed-wishlist-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
      }))
    }
  )
);

// =======================
// PINCODE & LOCATION STORE
// =======================
interface PincodeState {
  pincode: string;
  city: string;
  stateName: string;
  deliveryDays: string;
  isPincodeModalOpen: boolean;
  setPincodeModalOpen: (open: boolean) => void;
  setPincode: (pincode: string, city: string, stateName: string, deliveryDays: string) => void;
}

export const usePincodeStore = create<PincodeState>()(
  persist(
    (set) => ({
      pincode: '',
      city: '',
      stateName: '',
      deliveryDays: '',
      isPincodeModalOpen: false,
      setPincodeModalOpen: (open) => set({ isPincodeModalOpen: open }),
      setPincode: (pincode, city, stateName, deliveryDays) =>
        set({ pincode, city, stateName, deliveryDays, isPincodeModalOpen: false })
    }),
    {
      name: 'buydenmed-pincode-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
      }))
    }
  )
);

// =======================
// USER & AUTH STORE
// =======================
interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  login: (user: User, token?: string | null) => void;
  /** Records a signed-in user without closing the auth modal (profile step, session sync). */
  setUser: (user: User) => void;
  logout: () => void;
  // Profile, addresses and GST details are saved through the API (lib/api/account.ts);
  // pass the user it returns to setUser — there are no local-only edits.
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Signed out until the API confirms a session (see SessionSync in AppLayoutClient).
      // Auth tokens live in httpOnly cookies set by the API — never in this store.
      user: null,
      token: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      login: (user, token = null) => set({ user, token, isAuthenticated: true, isAuthModalOpen: false }),
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'buydenmed-user-storage',
      // v1: real API auth. Drops the old built-in demo user from browsers that saved it.
      version: 1,
      migrate: () => ({ user: null, token: null, isAuthenticated: false, isAuthModalOpen: false }) as unknown as UserState,
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
      }))
    }
  )
);

// =======================
// TOAST NOTIFICATIONS STORE
// =======================
export interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  }
}));

// =======================
// RENTAL STORE
// =======================
/**
 * The rental the customer is configuring (rent page → /rent/checkout).
 * Prices are never stored here — checkout asks the API for a fresh quote.
 */
export interface RentalDraft {
  productSlug: string;
  productName: string;
  productImage: string;
  period: 'daily' | 'weekly' | 'monthly';
  periods: number;
  startDate: string;
  /** Delivery time slot, 24h "HH:MM" between 10:00 and 16:00 */
  deliveryTime?: string;
  /** Refundable deposit paid online with the booking, or by cheque before delivery */
  depositMode?: 'online' | 'cheque';
}

interface RentalState {
  draft: RentalDraft | null;
  setDraft: (draft: RentalDraft) => void;
  clearDraft: () => void;
}

export const useRentalStore = create<RentalState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'buydenmed-rental-draft',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
      }))
    }
  )
);
