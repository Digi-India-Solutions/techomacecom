import type { SiteSettings } from './types';

/**
 * Used only if the API cannot be reached (and for the very first render).
 * Same values as the backend defaults in backend/src/modules/settings/definitions.js.
 */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  store: {
    storeName: 'Buy Denmed Healthcare Pvt. Ltd.',
    brandName: 'Buy Denmed',
    tagline: 'Medical & Dental Direct',
    logoUrl: null,
    footerLogoUrl: null,
    faviconUrl: null,
    supportPhone: '+91 98112 34567',
    supportPhoneHref: 'tel:+919811234567',
    salesPhone: '+91 11 4982 7000',
    salesPhoneHref: 'tel:+911149827000',
    tollFreePhone: '1800-212-3366',
    tollFreePhoneHref: 'tel:18002123366',
    supportEmail: 'support@buydenmed.com',
    salesEmail: 'orders@buydenmed.com',
    whatsappNumber: '+91 98112 34567',
    whatsappLink: 'https://wa.me/919811234567',
    address: 'Okhla Industrial Area Phase-III, New Delhi - 110020',
    mapUrl: '',
    gstin: '',
    supportHours: { open: '09:00', close: '19:30', openOnSunday: false },
    social: { instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '' },
  },
  shipping: {
    flatShippingCharge: 149,
    freeShippingAbove: 1999,
    codEnabled: true,
    codMaxOrderValue: 50000,
    codCharge: 0,
    defaultDeliveryDays: '3-7',
    dispatchCutoffTime: '14:00',
    restrictedToListedPincodes: false,
  },
  tax: {
    gstEnabled: true,
    pricesIncludeGst: true,
    defaultGstRate: 18,
    dispatchStateCode: '07',
    dispatchState: 'Delhi',
    invoiceFooterTerms:
      '1. Subject to New Delhi jurisdiction.\n2. Manufacturer warranty applies per serial number.\n3. Input tax credit is available only for a valid GSTIN.',
    signatoryName: 'Authorised Signatory',
    signatoryUrl: null,
  },
  rental: {
    reminderDaysBeforeDue: 3,
    lateFeePerDay: 250,
    gracePeriodDays: 0,
    depositRefundDays: 2
  },
};
