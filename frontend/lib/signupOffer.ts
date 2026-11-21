/**
 * Content + timing of the "sign up and save" popup (components/auth/SignupOfferPopup.tsx).
 *
 * The amounts here are what the popup PROMISES. The discount itself is applied by the
 * coupons / checkout module — keep these in sync with the welcome coupon configured there.
 */
export const SIGNUP_OFFER = {
  /** Seconds on the site before the popup opens (signed-out visitors only). */
  delaySeconds: 15,
  /** After "No thanks" / ✕ the popup stays hidden this long on this browser. */
  snoozeDays: 3,
  eyebrow: 'Members-only welcome offer',
  title: 'Sign up & unlock exclusive savings',
  offers: [
    { value: '20%', label: 'OFF', detail: 'on your first equipment order' },
    { value: '50%', label: 'OFF', detail: 'on your first month of rental' },
  ],
  perks: ['GST invoices for every order', 'Track orders & rentals in one place', 'Faster checkout with saved addresses'],
  finePrint: 'Offers apply to new accounts. Terms apply.',
};

/** Pages where the popup never interrupts (sign-in flows, checkout, the focused quiz). */
export const SIGNUP_OFFER_EXCLUDED_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/checkout',
  '/account',
  '/sleep-test/quiz',
];
