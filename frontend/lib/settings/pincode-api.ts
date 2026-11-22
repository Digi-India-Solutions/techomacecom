import { BACKEND_URL } from '@/lib/api/backend';
import type { PincodeCheck } from './types';

/**
 * Delivery / COD check for a PIN code — backend GET /api/v1/pincodes/:pincode
 * (Settings → Shipping → Serviceable PIN codes). Results are cached for the session.
 */
const cache = new Map<string, Promise<PincodeCheck>>();
const rentalCache = new Map<string, Promise<PincodeCheck>>();

export function checkPincode(pincode: string): Promise<PincodeCheck> {
  const pin = pincode.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) {
    return Promise.resolve({ pincode: pin, serviceable: false, codAvailable: false, city: '', state: '', deliveryDays: '', message: 'Enter a valid 6-digit PIN code' });
  }
  if (!cache.has(pin)) {
    const p = fetch(`${BACKEND_URL}/pincodes/${pin}`)
      .then((r) => r.json())
      .then((body: { success: boolean; data?: PincodeCheck }) => {
        if (!body.success || !body.data) throw new Error('Pincode check failed');
        return body.data;
      })
      .catch((err) => {
        cache.delete(pin); // retry next time
        throw err;
      });
    cache.set(pin, p);
  }
  return cache.get(pin)!;
}

/**
 * Rental equipment delivery check for a PIN code — backend GET /api/v1/pincodes/rental/:pincode
 * (Settings → Rental → Rental Serviceable PIN codes). Results are cached for the session.
 */
export function checkRentalPincode(pincode: string): Promise<PincodeCheck> {
  const pin = pincode.trim();
  if (!/^[1-9]\d{5}$/.test(pin)) {
    return Promise.resolve({ pincode: pin, serviceable: false, codAvailable: false, city: '', state: '', deliveryDays: '', message: 'Enter a valid 6-digit PIN code' });
  }
  if (!rentalCache.has(pin)) {
    const p = fetch(`${BACKEND_URL}/pincodes/rental/${pin}`)
      .then((r) => r.json())
      .then((body: { success: boolean; data?: PincodeCheck }) => {
        if (!body.success || !body.data) throw new Error('Rental pincode check failed');
        return body.data;
      })
      .catch(() => {
        rentalCache.delete(pin); // retry next time
        return {
          pincode: pin,
          serviceable: false,
          codAvailable: false,
          city: '',
          state: '',
          deliveryDays: '',
          message: 'Doorstep biomedical setup is currently not available for this pincode.',
        };
      });
    rentalCache.set(pin, p);
  }
  return rentalCache.get(pin)!;
}
