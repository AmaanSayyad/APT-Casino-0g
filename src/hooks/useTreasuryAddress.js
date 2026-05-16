"use client";
import { useState, useEffect } from 'react';
import { TREASURY_CONFIG, isValidTreasuryAddress } from '@/config/treasury';

let _cached = null;

/**
 * Returns the treasury receive address for display purposes.
 * Reads the inlined env first; falls back to GET /api/treasury-address
 * so it works even when NEXT_PUBLIC_* bundling fails in dev.
 */
export function useTreasuryAddress() {
  const [treasuryAddress, setTreasuryAddress] = useState(() => {
    const fromConfig = (TREASURY_CONFIG.ADDRESS || '').trim();
    return isValidTreasuryAddress(fromConfig) ? fromConfig : (_cached || null);
  });

  useEffect(() => {
    const fromConfig = (TREASURY_CONFIG.ADDRESS || '').trim();
    if (isValidTreasuryAddress(fromConfig)) {
      _cached = fromConfig;
      setTreasuryAddress(fromConfig);
      return;
    }
    if (_cached && isValidTreasuryAddress(_cached)) {
      setTreasuryAddress(_cached);
      return;
    }
    fetch('/api/treasury-address', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const addr = (data?.address || '').trim();
        if (isValidTreasuryAddress(addr)) {
          _cached = addr;
          setTreasuryAddress(addr);
        }
      })
      .catch(() => {});
  }, []);

  return treasuryAddress;
}
