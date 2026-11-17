import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, Variant, CartItem, User, Address, GstDetails, Coupon, Rental, RentalPlan, RentalPayment } from '@/types';
import { MOCK_RENTALS } from '@/lib/mock/data';

// =======================
// CART STORE
// =======================
interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  isCartOpen: boolean;
  addItem: (product: Product, quantity?: number, variant?: Variant, isRental?: boolean, rentalTenureMonths?: number) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  setIsCartOpen: (open: boolean) => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getShippingFee: () => number;
  getGstAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isCartOpen: false,

      addItem: (product, quantity = 1, variant, isRental = false, rentalTenureMonths = 1) => {
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
            return { items: newItems, isCartOpen: true };
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
            return { items: [...state.items, newItem], isCartOpen: true };
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
        if (subtotal === 0 || subtotal >= 1999) return 0;
        return 149; // Flat standard shipping under ₹1,999
      },

      getGstAmount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const taxable = Math.max(0, subtotal - discount);
        // Weighted composite average medical/dental equipment GST is ~12%
        return Math.round(taxable * 0.12);
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        const shipping = get().getShippingFee();
        const gst = get().getGstAmount();
        return Math.max(0, subtotal - discount + shipping + gst);
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
      pincode: '110001',
      city: 'New Delhi',
      stateName: 'Delhi',
      deliveryDays: 'Same Day / Next Day Delivery',
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
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, updates: Partial<Address>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  updateGst: (gst: GstDetails) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: {
        id: 'usr-demo',
        name: 'Dr. Vikram Malhotra',
        email: 'dr.vikram@malhotraclinic.com',
        phone: '9811234567',
        role: 'doctor',
        degree: 'BDS, MDS (Prosthodontics)',
        registrationNumber: 'DCI-DEL-18920',
        addresses: [
          {
            id: 'addr-1',
            type: 'Clinic',
            name: 'Dr. Vikram Malhotra',
            clinicHospitalName: 'Malhotra Multi-Speciality Dental & Respiratory Center',
            phone: '+91 9811234567',
            addressLine1: 'Suite 204, Metro Plaza, Sector 18',
            addressLine2: 'Near Metro Station',
            pincode: '201301',
            city: 'Noida',
            state: 'Uttar Pradesh',
            isDefault: true
          }
        ],
        gstDetails: {
          gstin: '09AAACM1234F1Z8',
          legalBusinessName: 'Malhotra Healthcare Pvt Ltd',
          isVerified: true
        }
      },
      token: 'bdm_jwt_sample_token',
      isAuthenticated: true,
      isAuthModalOpen: false,
      setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      login: (user, token) => set({ user, token, isAuthenticated: true, isAuthModalOpen: false }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        })),
      addAddress: (address) =>
        set((state) => {
          if (!state.user) return state;
          const addresses = address.isDefault
            ? state.user.addresses.map((a) => ({ ...a, isDefault: false })).concat(address)
            : [...state.user.addresses, address];
          return { user: { ...state.user, addresses } };
        }),
      updateAddress: (id, updates) =>
        set((state) => {
          if (!state.user) return state;
          const addresses = state.user.addresses.map((a) => {
            if (a.id === id) return { ...a, ...updates };
            // Only one default address at a time
            return updates.isDefault ? { ...a, isDefault: false } : a;
          });
          return { user: { ...state.user, addresses } };
        }),
      removeAddress: (id) =>
        set((state) => {
          if (!state.user) return state;
          const removed = state.user.addresses.find((a) => a.id === id);
          let addresses = state.user.addresses.filter((a) => a.id !== id);
          // Keep a default address if the default one was deleted
          if (removed?.isDefault && addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
            addresses = addresses.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
          }
          return { user: { ...state.user, addresses } };
        }),
      setDefaultAddress: (id) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              addresses: state.user.addresses.map((a) => ({
                ...a,
                isDefault: a.id === id
              }))
            }
          };
        }),
      updateGst: (gst) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: { ...state.user, gstDetails: gst }
          };
        })
    }),
    {
      name: 'buydenmed-user-storage',
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
export interface RentalDraft {
  product: Product;
  plan: RentalPlan;
  duration: number;
  startDate: string;
  endDate: string;
  deposit: number;
  rentAmount: number;
  deliveryPickupCharge: number;
  gstAmount: number;
  totalPayable: number;
  address?: Address;
  kycDocuments?: {
    idProofFront?: string;
    idProofBack?: string;
    addressProof?: string;
    doctorPrescription?: string;
  };
}

interface RentalState {
  rentals: Rental[];
  draft: RentalDraft | null;
  setDraft: (draft: RentalDraft) => void;
  updateDraftAddress: (address: Address) => void;
  updateDraftKyc: (kyc: RentalDraft['kycDocuments']) => void;
  clearDraft: () => void;
  addRental: (rental: Rental) => void;
  extendRental: (rentalId: string, extraDuration: number, extraRent: number, payment: RentalPayment) => void;
  scheduleReturn: (rentalId: string, pickupDate: string) => void;
  getRental: (rentalId: string) => Rental | undefined;
}

export const useRentalStore = create<RentalState>()(
  persist(
    (set, get) => ({
      rentals: [...MOCK_RENTALS],
      draft: null,

      setDraft: (draft) => set({ draft }),
      updateDraftAddress: (address) =>
        set((state) => ({
          draft: state.draft ? { ...state.draft, address } : null
        })),
      updateDraftKyc: (kycDocuments) =>
        set((state) => ({
          draft: state.draft
            ? { ...state.draft, kycDocuments: { ...state.draft.kycDocuments, ...kycDocuments } }
            : null
        })),
      clearDraft: () => set({ draft: null }),

      addRental: (rental) =>
        set((state) => ({
          rentals: [rental, ...state.rentals]
        })),

      extendRental: (rentalId, extraDuration, extraRent, payment) =>
        set((state) => ({
          rentals: state.rentals.map((r) => {
            if (r.id === rentalId || r.bookingNumber === rentalId) {
              const currentEnd = new Date(r.endDate);
              if (r.plan.type === 'daily') {
                currentEnd.setDate(currentEnd.getDate() + extraDuration);
              } else if (r.plan.type === 'weekly') {
                currentEnd.setDate(currentEnd.getDate() + extraDuration * 7);
              } else {
                currentEnd.setMonth(currentEnd.getMonth() + extraDuration);
              }
              const newEndDate = currentEnd.toISOString().split('T')[0];

              return {
                ...r,
                duration: r.duration + extraDuration,
                endDate: newEndDate,
                rentAmount: r.rentAmount + extraRent,
                status: 'active',
                payments: [...r.payments, payment]
              };
            }
            return r;
          })
        })),

      scheduleReturn: (rentalId, pickupDate) =>
        set((state) => ({
          rentals: state.rentals.map((r) => {
            if (r.id === rentalId || r.bookingNumber === rentalId) {
              return {
                ...r,
                status: 'return_scheduled',
                returnPickupDate: pickupDate
              };
            }
            return r;
          })
        })),

      getRental: (rentalId) =>
        get().rentals.find((r) => r.id === rentalId || r.bookingNumber === rentalId)
    }),
    {
      name: 'buydenmed-rental-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null
      }))
    }
  )
);

