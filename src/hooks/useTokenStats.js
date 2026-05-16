"use client";
import { useState, useEffect } from 'react';

/**
 * Platform stats for the homepage. Avoids third-party feeds tied to other chains;
 * wire OG market data here when you have a canonical source or indexer.
 */
const useTokenStats = () => {
  const [stats, setStats] = useState({
    totalOGPool: null,
    ogPrice: null,
    ogAPY: null,
    loading: true,
    error: null,
    marketCap: null,
    volume24h: null,
    priceChange24h: null,
    lastUpdated: null
  });

  useEffect(() => {
    setStats({
      totalOGPool: null,
      ogPrice: null,
      ogAPY: null,
      loading: false,
      error: null,
      marketCap: null,
      volume24h: null,
      priceChange24h: null,
      lastUpdated: null
    });
  }, []);

  return stats;
};

export default useTokenStats;
