/** Public store settings — backend GET /api/v1/settings/public (admin → Settings). */
export interface SiteSettings {
  store: {
    storeName: string;
    brandName: string;
    tagline: string;
    logoUrl: string | null;
    footerLogoUrl: string | null;
    faviconUrl: string | null;
    supportPhone: string;
    supportPhoneHref: string;
    salesPhone: string;
    salesPhoneHref: string;
    tollFreePhone: string;
    tollFreePhoneHref: string;
    supportEmail: string;
    salesEmail: string;
    whatsappNumber: string;
    whatsappLink: string;
    address: string;
    mapUrl: string;
    gstin: string;
    supportHours: { open: string; close: string; openOnSunday: boolean };
    social: { instagram: string; facebook: string; linkedin: string; youtube: string; twitter: string };
  };
  shipping: {
    flatShippingCharge: number;
    freeShippingAbove: number;
    codEnabled: boolean;
    codMaxOrderValue: number;
    codCharge: number;
    defaultDeliveryDays: string;
    dispatchCutoffTime: string;
    restrictedToListedPincodes: boolean;
  };
  tax: {
    gstEnabled: boolean;
    pricesIncludeGst: boolean;
    defaultGstRate: number;
    dispatchStateCode: string;
    dispatchState: string;
    invoiceFooterTerms: string;
    signatoryName: string;
    signatoryUrl: string | null;
  };
  rental: {
    reminderDaysBeforeDue: number;
    lateFeePerDay: number;
    gracePeriodDays: number;
    depositRefundDays: number;
    /** % of the booking total paid online at checkout (100 = full payment) */
    advancePaymentPercent: number;
    balanceDue: 'before_dispatch' | 'on_delivery';
    /** Earliest start date = today + this many days */
    minLeadDays: number;
    kycRequired: boolean;
    kycDocuments: { key: string; label: string; hint: string }[];
    kycInstructions: string;
  };
  returns: {
    returnsEnabled: boolean;
    returnWindowDays: number;
    refundEnabled: boolean;
    replacementEnabled: boolean;
    photosRequired: boolean;
    maxPhotos: number;
    /** Business days, e.g. "5-7" */
    refundProcessingDays: string;
    returnReasons: string[];
    cancelReasons: string[];
    conditions: string;
  };
}

export interface PincodeCheck {
  pincode: string;
  serviceable: boolean;
  codAvailable: boolean;
  city: string;
  state: string;
  deliveryDays: string;
  message: string;
}
