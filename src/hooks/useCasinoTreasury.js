'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { useDispatch, useSelector } from 'react-redux';
import { setBalance, setLoading } from '@/store/balanceSlice';
import { useNotification } from '@/components/NotificationSystem';
import { TREASURY_CONFIG } from '@/config/treasury';
import { sendTreasuryNativeDeposit } from '@/lib/treasuryWalletDeposit';

async function recordDepositApi(userAddress, amount, transactionHash) {
  const response = await fetch('/api/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userAddress, amount, transactionHash }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Deposit API failed');
  return result;
}

export function useCasinoTreasury() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const dispatch = useDispatch();
  const notification = useNotification();
  const { userBalance, isLoading: isLoadingBalance } = useSelector((s) => s.balance);

  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadUserBalance = useCallback(async () => {
    if (!address) return;
    try {
      dispatch(setLoading(true));
      const localBalance = localStorage.getItem(`userBalance_${address}`);
      if (localBalance && parseFloat(localBalance) > 0) {
        dispatch(setBalance(localBalance));
      } else {
        const fallback = localStorage.getItem('userBalance') || '0';
        dispatch(setBalance(fallback));
      }
    } catch (e) {
      console.error('loadUserBalance', e);
      dispatch(setBalance('0'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [address, dispatch]);

  useEffect(() => {
    if (isConnected && address) {
      loadUserBalance();
    }
  }, [isConnected, address, loadUserBalance]);

  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      notification.error('Please connect your wallet first');
      return;
    }
    const balanceInOg = parseFloat(userBalance || '0');
    if (balanceInOg <= 0) {
      notification.error('No house balance to withdraw');
      return;
    }

    setIsWithdrawing(true);
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address, amount: balanceInOg, chainId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'Withdrawal failed');

      dispatch(setBalance('0'));
      localStorage.setItem('userBalance', '0');
      const txHash = result?.transactionHash || '';
      const txDisplay = txHash ? `${txHash.slice(0, 10)}…` : 'pending';
      notification.success(
        `Withdrawing ${balanceInOg.toFixed(5)} OG to your wallet. TX: ${txDisplay}`
      );
    } catch (error) {
      notification.error(error?.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleDeposit = async () => {
    if (isDepositing) return;
    if (!isConnected || !address) {
      notification.error('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      notification.error('Enter a valid OG amount');
      return;
    }
    if (amount < TREASURY_CONFIG.LIMITS.MIN_DEPOSIT) {
      notification.error(`Minimum deposit is ${TREASURY_CONFIG.LIMITS.MIN_DEPOSIT} OG`);
      return;
    }
    if (amount > TREASURY_CONFIG.LIMITS.MAX_DEPOSIT) {
      notification.error(`Maximum deposit is ${TREASURY_CONFIG.LIMITS.MAX_DEPOSIT} OG`);
      return;
    }

    setIsDepositing(true);
    try {
      if (!walletClient) {
        throw new Error('Wallet is not ready — try reconnecting with MetaMask');
      }
      const txHash = await sendTreasuryNativeDeposit(walletClient, {
        account: address,
        amount,
      });

      notification.info(`Deposit sent: ${txHash.slice(0, 12)}…`);
      await new Promise((r) => setTimeout(r, 2500));

      const currentBalance = parseFloat(userBalance || '0');
      const newBalance = (currentBalance + amount).toString();
      dispatch(setBalance(newBalance));

      try {
        await recordDepositApi(address, amount, txHash);
      } catch (apiErr) {
        console.warn('Deposit API log failed (balance already updated):', apiErr);
      }

      notification.success(`Deposited ${amount} OG to your house balance`);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit error:', error);
      notification.error(error?.message || 'Deposit failed');
    } finally {
      setIsDepositing(false);
    }
  };

  return {
    address,
    isConnected,
    userBalance,
    isLoadingBalance,
    depositAmount,
    setDepositAmount,
    isDepositing,
    isWithdrawing,
    handleDeposit,
    handleWithdraw,
    refreshHouseBalance: loadUserBalance,
  };
}
