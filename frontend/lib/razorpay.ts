'use client';

/**
 * Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js) — loaded on demand.
 * openRazorpay() resolves with the signed response, or rejects with a readable message
 * when the customer closes the window or the payment fails.
 */

export interface RazorpayOrderInfo {
  keyId: string;
  orderId: string;
  amount: number; // paise
  currency: string;
}

export interface RazorpaySuccess {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

const SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const s = document.createElement('script');
    s.src = SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export class PaymentCancelled extends Error {}

export async function openRazorpay(
  order: RazorpayOrderInfo,
  opts: { name: string; description: string; prefill?: { name?: string; email?: string; contact?: string } }
): Promise<RazorpaySuccess> {
  if (!(await loadRazorpay())) throw new Error('Could not load the payment window. Check your internet connection and try again.');
  return new Promise((resolve, reject) => {
    type RzpResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
    const Rzp = (window as unknown as { Razorpay: new (o: object) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void } }).Razorpay;
    let settled = false;
    const rzp = new Rzp({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency || 'INR',
      order_id: order.orderId,
      name: opts.name,
      description: opts.description,
      prefill: opts.prefill,
      theme: { color: '#1D5FAF' },
      handler: (r: RzpResponse) => {
        settled = true;
        resolve({ razorpayPaymentId: r.razorpay_payment_id, razorpayOrderId: r.razorpay_order_id, razorpaySignature: r.razorpay_signature });
      },
      modal: {
        ondismiss: () => {
          if (!settled) reject(new PaymentCancelled('Payment was not completed. You can try again any time.'));
        },
      },
    });
    rzp.on('payment.failed', (resp) => {
      settled = true;
      reject(new Error(resp.error?.description || 'The payment was declined. Please try another method.'));
    });
    rzp.open();
  });
}
