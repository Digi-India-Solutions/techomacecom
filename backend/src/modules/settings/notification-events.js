/**
 * Customer notification events (Settings → Notifications).
 * Templates are stored in `notification_templates` (one row per event × channel);
 * until an admin saves one, these defaults are used.
 *
 * {{variables}} are filled in by services/notification.service.js → notify(event, …).
 */
export const NOTIFICATION_EVENTS = [
  {
    event: "order_placed",
    label: "Order placed",
    group: "Orders",
    variables: ["customer_name", "order_number", "total"],
    channels: { sms: true, whatsapp: true, email: true },
    subject: "Order {{order_number}} confirmed",
    body: "Hi {{customer_name}}, your Buy Denmed order {{order_number}} of ₹{{total}} is confirmed. We'll let you know when it ships.",
  },
  {
    event: "order_shipped",
    label: "Order shipped",
    group: "Orders",
    variables: ["customer_name", "order_number", "courier", "awb", "tracking_url"],
    channels: { sms: true, whatsapp: true, email: true },
    subject: "Order {{order_number}} has shipped",
    body: "Order {{order_number}} shipped via {{courier}}. Track AWB {{awb}}: {{tracking_url}}",
  },
  {
    event: "order_delivered",
    label: "Order delivered",
    group: "Orders",
    variables: ["customer_name", "order_number"],
    channels: { sms: false, whatsapp: true, email: true },
    subject: "Order {{order_number}} delivered",
    body: "Your Buy Denmed order {{order_number}} has been delivered. Download your GST invoice from My Orders.",
  },
  {
    event: "rental_approved",
    label: "Rental confirmed",
    group: "Rentals",
    variables: ["customer_name", "rental_number", "product_name", "serial_number"],
    channels: { sms: true, whatsapp: true, email: true },
    subject: "Rental {{rental_number}} confirmed",
    body: "Your rental {{rental_number}} ({{product_name}}) is confirmed. Unit {{serial_number}} will dispatch shortly.",
  },
  {
    event: "rental_due_reminder",
    label: "Rental due reminder",
    group: "Rentals",
    variables: ["customer_name", "rental_number", "end_date", "reminder_days"],
    channels: { sms: true, whatsapp: true, email: false },
    subject: "Rental {{rental_number}} ends on {{end_date}}",
    body: "Reminder: your rental {{rental_number}} ends on {{end_date}}. Extend it or schedule a pickup from My Rentals.",
  },
  {
    event: "rental_overdue",
    label: "Rental overdue",
    group: "Rentals",
    variables: ["customer_name", "rental_number", "end_date", "late_fee"],
    channels: { sms: true, whatsapp: true, email: true },
    subject: "Rental {{rental_number}} is overdue",
    body: "Rental {{rental_number}} is overdue since {{end_date}}. A late fee of ₹{{late_fee}} per day applies until it is returned.",
  },
  {
    event: "deposit_refunded",
    label: "Deposit refunded",
    group: "Rentals",
    variables: ["customer_name", "rental_number", "refund_amount", "reference"],
    channels: { sms: true, whatsapp: true, email: true },
    subject: "Deposit refund for {{rental_number}}",
    body: "Your security deposit refund of ₹{{refund_amount}} for {{rental_number}} has been processed (Ref: {{reference}}).",
  },
  {
    event: "enquiry_received",
    label: "Enquiry received",
    group: "Enquiries",
    variables: ["customer_name", "enquiry_number"],
    channels: { sms: false, whatsapp: true, email: true },
    subject: "We received your enquiry {{enquiry_number}}",
    body: "Thanks {{customer_name}}! Our specialist received enquiry {{enquiry_number}} and will call you shortly.",
  },
];

export const CHANNELS = ["sms", "whatsapp", "email"];

/** Example values for "Send test". */
export const SAMPLE_VARIABLES = {
  customer_name: "Dr. Test",
  order_number: "BDM-100245",
  total: "48,999",
  courier: "Delhivery",
  awb: "1234567890",
  tracking_url: "https://buydenmed.com/track/BDM-100245",
  rental_number: "RNT-2045",
  product_name: "Oxygen Concentrator 5L",
  serial_number: "OC5-00912",
  end_date: "25 Nov 2026",
  reminder_days: "3",
  late_fee: "250",
  refund_amount: "10,000",
  reference: "RFND-77812",
  enquiry_number: "ENQ-3301",
};
