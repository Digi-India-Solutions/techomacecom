import type { AdminSettings } from '@/types/admin';
import { mockDelay } from './client';
import { PRODUCT_IMAGES } from './mockData';

let settingsStore: AdminSettings = {
  store: {
    storeName: 'Buy Denmed Healthcare Pvt Ltd',
    logoUrl: PRODUCT_IMAGES.oxygenConcentrator,
    faviconUrl: PRODUCT_IMAGES.oxygenConcentrator,
    supportPhone: '+91 11 4089 2210',
    salesPhone: '+91 98110 42100',
    supportEmail: 'care@buydenmed.in',
    whatsappNumber: '+91 98110 42100',
    address: 'Plot B-114, Okhla Industrial Area Phase II, New Delhi 110020',
    gstin: '07AABCB8129D1Z4',
    instagramUrl: 'https://instagram.com/buydenmed',
    linkedinUrl: 'https://linkedin.com/company/buydenmed',
    youtubeUrl: 'https://youtube.com/@buydenmed',
  },
  shipping: {
    flatShippingCharge: 250,
    freeShippingAbove: 10000,
    codEnabled: true,
    codMaxOrderValue: 50000,
    codCharge: 150,
    serviceablePincodesCount: 19420,
    shiprocketEmail: 'logistics@buydenmed.in',
    shiprocketApiTokenMasked: 'sr_live_••••••••••••••••8f4a',
  },
  payments: {
    razorpayKeyId: 'rzp_live_BDM99281740xK',
    razorpayKeySecretMasked: '••••••••••••••••••••••••91a2',
    mode: 'live',
    emiEnabledGlobally: true,
    minOrderForEmi: 10000,
  },
  taxInvoice: {
    gstEnabled: true,
    defaultStateCode: '07 - Delhi',
    invoicePrefix: 'BDM/26-27/',
    nextInvoiceNumber: 8842,
    footerTerms:
      '1. Subject to New Delhi jurisdiction. 2. Manufacturer warranty applies per serial number. 3. Input Tax Credit available for valid B2B GSTIN.',
    signatoryImageUrl: '',
  },
  notifications: [
    {
      eventKey: 'order_placed',
      label: 'Order Placed',
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      template: 'Hi {{customer_name}}, your Buy Denmed order {{order_number}} of ₹{{total}} is confirmed!',
      variables: ['{{customer_name}}', '{{order_number}}', '{{total}}'],
    },
    {
      eventKey: 'order_shipped',
      label: 'Order Shipped',
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      template: 'Order {{order_number}} shipped via {{courier}}. Track AWB {{awb}}: {{tracking_url}}',
      variables: ['{{order_number}}', '{{courier}}', '{{awb}}', '{{tracking_url}}'],
    },
    {
      eventKey: 'order_delivered',
      label: 'Order Delivered',
      smsEnabled: false,
      whatsappEnabled: true,
      emailEnabled: true,
      template: 'Your Buy Denmed order {{order_number}} has been delivered. Download your GST invoice from My Orders.',
      variables: ['{{customer_name}}', '{{order_number}}'],
    },
    {
      eventKey: 'rental_approved',
      label: 'Rental Approved',
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      template: 'KYC approved for rental {{rental_number}} ({{product_name}}). Unit {{serial_number}} will dispatch shortly.',
      variables: ['{{rental_number}}', '{{product_name}}', '{{serial_number}}'],
    },
    {
      eventKey: 'rental_due_reminder',
      label: 'Rental Due Reminder',
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: false,
      template: 'Reminder: Your rental {{rental_number}} is due on {{end_date}}. Reply EXTEND to renew or schedule pickup.',
      variables: ['{{rental_number}}', '{{end_date}}', '{{customer_name}}'],
    },
    {
      eventKey: 'rental_overdue',
      label: 'Rental Overdue Alert',
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      template: 'Urgent: Rental {{rental_number}} is overdue since {{end_date}}. Late fee ₹{{late_fee}}/day applies.',
      variables: ['{{rental_number}}', '{{end_date}}', '{{late_fee}}'],
    },
    {
      eventKey: 'deposit_refunded',
      label: 'Deposit Refunded',
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      template: 'Security deposit refund of ₹{{refund_amount}} for {{rental_number}} processed (Ref: {{reference}}).',
      variables: ['{{rental_number}}', '{{refund_amount}}', '{{reference}}'],
    },
    {
      eventKey: 'enquiry_received',
      label: 'Enquiry Received',
      smsEnabled: false,
      whatsappEnabled: true,
      emailEnabled: true,
      template: 'Thanks {{customer_name}}! Our specialist received enquiry {{enquiry_number}} and will call within 2 hours.',
      variables: ['{{customer_name}}', '{{enquiry_number}}'],
    },
  ],
  rental: {
    defaultReminderDaysBeforeDue: 3,
    overdueLateFeePerDay: 250,
    requiredKycDocTypes: ['Aadhaar Card', 'Address Proof', 'Doctor Prescription'],
  },
};

export async function getAdminSettings(): Promise<AdminSettings> {
  await mockDelay(110);
  return structuredClone(settingsStore);
}

export async function saveAdminSettings(next: AdminSettings): Promise<AdminSettings> {
  await mockDelay(180);
  settingsStore = structuredClone(next);
  return structuredClone(settingsStore);
}
