'use client';

import { useEffect, useState } from 'react';
import { checkPincode } from './pincode-api';
import type { PincodeCheck } from './types';

export { checkPincode };

/** React hook: { result, loading } for the given PIN (null until it has 6 digits). */
export function usePincodeCheck(pincode: string | undefined) {
  const pin = (pincode || '').trim();
  const valid = /^[1-9]\d{5}$/.test(pin);
  const [state, setState] = useState<{ pin: string; result: PincodeCheck | null }>({ pin: '', result: null });

  useEffect(() => {
    if (!valid) return;
    let alive = true;
    checkPincode(pin)
      .then((result) => alive && setState({ pin, result }))
      .catch(() => alive && setState({ pin, result: null }));
    return () => {
      alive = false;
    };
  }, [pin, valid]);

  const current = valid && state.pin === pin ? state.result : null;
  return { result: current, loading: valid && state.pin !== pin };
}
