/**
 * useOGComputeNetwork Hook
 * React hook for interacting with 0G Compute Network
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { 
  DEFAULT_PROVIDER,
  OG_COMPUTE_PROVIDERS,
  OG_COMPUTE_ACCOUNT_CONFIG 
} from '../config/ogComputeNetwork';

export function useOGComputeNetwork() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [services, setServices] = useState([]);
  const [providerAddress, setProviderAddress] = useState(DEFAULT_PROVIDER.address);
  
  const { address, isConnected } = useAccount();

  /**
   * Refresh account balance
   */
  const refreshBalance = useCallback(async () => {
    try {
      const response = await fetch('/api/og-compute?action=balance');
      const data = await response.json();
      
      if (data.success) {
        setBalance(data.balance);
      } else {
        throw new Error(data.error || 'Failed to fetch balance');
      }
    } catch (err) {
      console.error('Failed to refresh balance:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Refresh available services
   */
  const refreshServices = useCallback(async () => {
    try {
      const response = await fetch('/api/og-compute?action=services');
      const data = await response.json();
      
      if (data.success) {
        setServices(data.services);
      } else {
        throw new Error(data.error || 'Failed to fetch services');
      }
    } catch (err) {
      console.error('Failed to refresh services:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Initialize broker with user's wallet
   */
  const initialize = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For browser, we'll use the API route instead
      // The broker needs to be initialized server-side with treasury wallet
      setIsInitialized(true);
      await refreshBalance();
      await refreshServices();
      return true;
    } catch (err) {
      console.error('Failed to initialize 0G Compute:', err);
      setError(err.message);
      setIsInitialized(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, refreshBalance, refreshServices]);

  /**
   * Send AI inference request
   */
  const sendInferenceRequest = useCallback(async (messages, options = {}) => {
    if (!isInitialized) {
      throw new Error('0G Compute not initialized');
    }

    // Check balance before sending request
    const currentBalance = parseFloat(balance || '0');
    const MIN_INFERENCE_BALANCE = 0.5; // Minimum required for inference
    
    if (currentBalance < MIN_INFERENCE_BALANCE) {
      const errorMsg = `Insufficient balance for inference. Current: ${currentBalance.toFixed(4)} OG, Required: ${MIN_INFERENCE_BALANCE} OG. Please contact administrator for account funding.`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/og-compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'inference',
          providerAddress: providerAddress,
          messages: messages,
          options: options,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        // Enhanced error message for insufficient balance
        if (data.error && data.error.includes('insufficient balance')) {
          const errorMsg = `Insufficient balance: ${data.currentBalance ? data.currentBalance.toFixed(4) : '0'} OG. Required: ${data.requiredBalance || 0.5} OG. Please contact administrator for account funding.`;
          setError(errorMsg);
          throw new Error(errorMsg);
        }
        throw new Error(data.error || 'Inference request failed');
      }

      // Refresh balance after successful inference
      await refreshBalance();

      return data.response;
    } catch (err) {
      console.error('Failed to send inference request:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, providerAddress, balance, refreshBalance]);

  /**
   * Acknowledge provider (required before first use)
   */
  const acknowledgeProvider = useCallback(async (providerAddr = null) => {
    const targetProvider = providerAddr || providerAddress;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/og-compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'acknowledge',
          providerAddress: targetProvider,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to acknowledge provider');
      }

      return data;
    } catch (err) {
      console.error('Failed to acknowledge provider:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [providerAddress]);

  /**
   * Add funds to account (Disabled on mainnet)
   */
  const addFunds = useCallback(async (amount) => {
    throw new Error('Add funds is disabled on mainnet. Please contact administrator for account funding.');
  }, []);

  /**
   * Check if balance is low
   */
  const isLowBalance = useCallback(() => {
    if (!balance) return false;
    return parseFloat(balance) < OG_COMPUTE_ACCOUNT_CONFIG.lowBalanceThreshold;
  }, [balance]);

  /**
   * Get provider info by address
   */
  const getProviderInfo = useCallback((providerAddr = null) => {
    const targetProvider = providerAddr || providerAddress;
    return Object.values(OG_COMPUTE_PROVIDERS).find(
      p => p.address.toLowerCase() === targetProvider.toLowerCase()
    ) || null;
  }, [providerAddress]);

  // Auto-initialize when wallet is connected
  useEffect(() => {
    if (isConnected && address && !isInitialized && !isLoading) {
      initialize();
    }
  }, [isConnected, address, isInitialized, isLoading, initialize]);

  // Auto-refresh balance periodically
  useEffect(() => {
    if (isInitialized) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isInitialized, refreshBalance]);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    balance,
    services,
    providerAddress,
    
    // Actions
    initialize,
    sendInferenceRequest,
    acknowledgeProvider,
    addFunds,
    refreshBalance,
    refreshServices,
    setProviderAddress,
    
    // Helpers
    isLowBalance: isLowBalance(),
    getProviderInfo,
  };
}

export default useOGComputeNetwork;

