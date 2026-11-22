'use client';

import type { CustomerRental, User } from '@/types';
import { requestRentalExtension, startRentalPayment, verifyRentalPayment } from '@/lib/api/rentals';
import { openRazorpay } from '@/lib/razorpay';

/** Opens Razorpay for the advance / balance of a rental and returns the updated rental. */
export async function payRental(r: CustomerRental, kind: 'advance' | 'balance', brandName: string, user?: User | null) {
  const { razorpay } = await startRentalPayment(r.id, kind);
  const signed = await openRazorpay(razorpay, {
    name: brandName,
    description: `${kind === 'advance' ? 'Booking payment' : 'Balance'} · ${r.rentalNumber}`,
    prefill: { name: user?.name, email: user?.email, contact: r.deliveryAddress?.phone || user?.phone },
  });
  return verifyRentalPayment(r.id, signed);
}

/** Extends by n periods: pays online, then the end date moves automatically. */
export async function payExtension(r: CustomerRental, periods: number, brandName: string, user?: User | null) {
  const { razorpay } = await requestRentalExtension(r.id, periods);
  const signed = await openRazorpay(razorpay, {
    name: brandName,
    description: `Extend ${r.rentalNumber} by ${periods} ${r.plan.unit}${periods === 1 ? '' : 's'}`,
    prefill: { name: user?.name, email: user?.email, contact: r.deliveryAddress?.phone || user?.phone },
  });
  return verifyRentalPayment(r.id, signed);
}
