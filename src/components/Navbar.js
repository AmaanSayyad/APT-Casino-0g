"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import BrandWordmark from "./BrandWordmark";
import { usePathname } from "next/navigation";
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { useSelector, useDispatch } from 'react-redux';
import { setBalance, setLoading, loadBalanceFromStorage } from '@/store/balanceSlice';
import ConnectWalletButton from "./ConnectWalletButton";
import WithdrawModal from "./WithdrawModal";
import LiveChat from "./LiveChat";
import AiModal from "./AiModal";
import { useGlobalWalletPersistence } from '../hooks/useGlobalWalletPersistence';


import { useNotification } from './NotificationSystem';
import { TREASURY_CONFIG } from '../config/treasury';
import { sendTreasuryNativeDeposit } from '@/lib/treasuryWalletDeposit';
import { useTreasuryAddress } from '../hooks/useTreasuryAddress';
// Enhanced UserBalanceSystem with deposit functionality
const UserBalanceSystem = {
  getBalance: async (address) => {
    // Try to get balance from localStorage first (use same key as Redux store)
    const savedBalance = localStorage.getItem('userBalance');
    if (savedBalance) {
      return savedBalance;
    }
    // Return zero balance
    return "0";
  },
  
  deposit: async (userAddress, amount, transactionHash) => {
    try {
      console.log('Processing deposit:', { userAddress, amount, transactionHash });
      
      // Call deposit API
      const response = await fetch('/api/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress,
          amount: amount,
          transactionHash: transactionHash || '0x' + Math.random().toString(16).substr(2, 64)
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Deposit failed');
      }
      
      // Don't update balance here - it's already updated in the main deposit function
      console.log('UserBalanceSystem deposit: API call successful, balance already updated');
      
      return result;
    } catch (error) {
      console.error('Deposit error:', error);
      throw error;
    }
  }
};

const CASINO_MODULE_ADDRESS =
  process.env.NEXT_PUBLIC_CASINO_MODULE_ADDRESS ||
  process.env.NEXT_PUBLIC_CASINO_SESSION_CONTRACT ||
  '';

export default function Navbar() {
  const pathname = usePathname();
  const [userAddress, setUserAddress] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notification = useNotification();
  const isDev = process.env.NODE_ENV === 'development';
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const dispatch = useDispatch();
  const { userBalance, isLoading: isLoadingBalance } = useSelector((state) => state.balance);
  const [walletNetworkName, setWalletNetworkName] = useState("");

  // User balance management
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("0");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const resolvedTreasuryAddress = useTreasuryAddress();


  // Wallet connection with persistence
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const isWalletReady = isConnected && address;
  
  // Use global wallet persistence hook
  useGlobalWalletPersistence();

  // Debug wallet connection
  useEffect(() => {
    console.log('🔗 Wallet connection state:', { 
      isConnected, 
      address, 
      chainId, 
      walletClient: !!walletClient,
      isWalletReady 
    });
    
    // Check if wallet is connected but address is not yet available
    if (isConnected && !address) {
      console.log('⚠️ Wallet connected but address not yet available, waiting...');
      // Add a small delay to see if address becomes available
      const timer = setTimeout(() => {
        console.log('⏰ After delay - Wallet state:', { 
          isConnected, 
          address, 
          chainId, 
          walletClient: !!walletClient,
          isWalletReady 
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, chainId, walletClient, isWalletReady]);


  // Mock notifications for UI purposes
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Balance Updated',
      message: 'Your OG balance has been updated',
      isRead: false,
      time: '2 min ago'
    },
    {
      id: '2',
      title: 'New Tournament',
      message: 'High Roller Tournament starts in 1 hour',
      isRead: false,
      time: '1 hour ago'
    }
  ]);

  // Load user balance from house account
  const loadUserBalance = async () => {
    if (!address) return;
    
    try {
      dispatch(setLoading(true));
      
      // First try to get from localStorage
      const localBalance = localStorage.getItem(`userBalance_${address}`);
      console.log('Loading balance from localStorage:', localBalance);
      
      if (localBalance && parseFloat(localBalance) > 0) {
        dispatch(setBalance(localBalance));
        console.log('Balance loaded from localStorage:', localBalance);
      } else {
        // If no local balance, try to get from UserBalanceSystem
        const balance = await UserBalanceSystem.getBalance(address);
        console.log('Balance loaded from UserBalanceSystem:', balance);
        dispatch(setBalance(balance));
        
              // Save to localStorage for persistence (use same key as Redux store)
      localStorage.setItem('userBalance', balance);
      }
      
    } catch (error) {
      console.error('Error loading user balance:', error);
      dispatch(setBalance("0"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Load balance from localStorage
  const loadBalanceFromStorage = (address) => {
    if (!address) return null;
    return localStorage.getItem('userBalance');
  };

  // Load balance when wallet connects
  useEffect(() => {
    if (isWalletReady && address) {
      // First try to load from localStorage
      const savedBalance = loadBalanceFromStorage(address);
      if (savedBalance && savedBalance !== "0") {
        console.log('Loading saved balance from localStorage:', savedBalance);
        dispatch(setBalance(savedBalance));
      } else {
        // If no saved balance, load from blockchain
        loadUserBalance();
      }
      
      // Load deposit history
      
    }
  }, [isWalletReady, address]);
  
  // Auto-refresh balance every 5 seconds when wallet is connected
  useEffect(() => {
    if (!isWalletReady || !address) return;
    
    const interval = setInterval(() => {
      const localBalance = localStorage.getItem('userBalance');
      if (localBalance && localBalance !== userBalance) {
        console.log('Auto-refreshing balance:', { localBalance, userBalance });
        dispatch(setBalance(localBalance));
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isWalletReady, address, userBalance]);
  
  // Load deposit history


  // Check if wallet was previously connected on page load
  useEffect(() => {
    const checkWalletConnection = async () => {
      // Check if wallet was previously connected
      const wasConnected = localStorage.getItem('wagmi.connected');
      if (wasConnected === 'true') {
        console.log('🔄 Wallet was previously connected, restoring balance...');
        
        // Restore balance from localStorage
        const savedBalance = localStorage.getItem('userBalance');
        if (savedBalance) {
          console.log('💰 Restoring balance from localStorage:', savedBalance);
          dispatch(setBalance(parseFloat(savedBalance)));
        }
      }
    };
    
    checkWalletConnection();
  }, [dispatch]);

  useEffect(() => {
    setIsClient(true);
    setUnreadNotifications(notifications.filter(n => !n.isRead).length);

    if (isDev) {
      setUserAddress('0x1234...dev');
    }
  }, [isDev, notifications]);

  // Close balance modal with ESC
  useEffect(() => {
    if (!showBalanceModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowBalanceModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showBalanceModal]);
  
  // Poll for balance changes
  const pollForBalance = async (initialBalance, attempts = 10, interval = 2000) => {
    dispatch(setLoading(true));
    for (let i = 0; i < attempts; i++) {
      try {
        const newBalance = await UserBalanceSystem.getBalance(address);
        if (newBalance !== initialBalance) {
          dispatch(setBalance(newBalance));
          notification.success('Balance updated successfully!');
          dispatch(setLoading(false));
          return;
        }
      } catch (error) {
        console.error(`Polling attempt ${i + 1} failed:`, error);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    notification.error('Balance update timed out. Please refresh manually.');
    dispatch(setLoading(false));
  };

  // Handle withdraw from house account
  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      notification.error('Please connect your wallet first');
      return;
    }

    try {
      setIsWithdrawing(true);
      const balanceInOg = parseFloat(userBalance || '0');
      if (balanceInOg <= 0) {
        notification.error('No balance to withdraw');
        return;
      }

      // Call backend API to process withdrawal from treasury
      console.log('🔍 Account object:', address);
      console.log('🔍 Account address:', address);
      console.log('🔍 Account address type:', typeof address);
      
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: address,
          amount: balanceInOg,
          chainId,
        })
      });

      const result = await response.json();
      console.log('🔍 Withdraw API response:', result);

      if (!response.ok) {
        const errorMessage = result?.error || 'Withdrawal failed';
        throw new Error(errorMessage);
      }

      // Update user balance to 0 after successful withdrawal
      dispatch(setBalance('0'));
      
      // Clear localStorage balance
      localStorage.setItem('userBalance', '0');
      
      // Check if transaction hash exists before using it
      const txHash = result?.transactionHash || 'Unknown';
      const txDisplay = txHash !== 'Unknown' ? `${txHash.slice(0, 8)}...` : 'Pending';
      
      notification.success(`Withdrawal transaction sent! ${balanceInOg.toFixed(5)} OG will be transferred. TX: ${txDisplay}`);
      
      // Close the modal
      setShowBalanceModal(false);
      
    } catch (error) {
      console.error('Withdraw error:', error);
      
      // Ensure error message is a string
      const errorMessage = error?.message || 'Unknown error occurred';
      const safeErrorMessage = typeof errorMessage === 'string' ? errorMessage : 'Unknown error occurred';
      
      notification.error(`Withdrawal failed: ${safeErrorMessage}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // Handle deposit to house balance
  const handleDeposit = async () => {
    // Prevent multiple simultaneous deposits
    if (isDepositing) {
      console.log('🚫 Deposit already in progress, ignoring duplicate call');
      return;
    }
    
    if (!isConnected || !address) {
      notification.error('Please connect your wallet first');
      return;
    }

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      notification.error('Please enter a valid deposit amount');
      return;
    }
    
    // Check deposit limits
    if (amount < TREASURY_CONFIG.LIMITS.MIN_DEPOSIT) {
      notification.error(`Minimum deposit amount is ${TREASURY_CONFIG.LIMITS.MIN_DEPOSIT} OG`);
      return;
    }
    
    if (amount > TREASURY_CONFIG.LIMITS.MAX_DEPOSIT) {
      notification.error(`Maximum deposit amount is ${TREASURY_CONFIG.LIMITS.MAX_DEPOSIT} OG`);
      return;
    }

    setIsDepositing(true);
    console.log('🚀 Starting deposit process for:', amount, 'OG');
    try {
      console.log('Depositing to house balance:', { address: address, amount });

      if (!walletClient) {
        throw new Error('Wallet is not ready — try reconnecting with MetaMask');
      }

      const txHash = await sendTreasuryNativeDeposit(walletClient, {
        account: address,
        amount,
      });

      console.log('Transaction sent:', txHash);
      
      // Wait for transaction confirmation
      notification.info(`Transaction sent! Hash: ${txHash.slice(0, 10)}...`);
      
      // Wait for confirmation (you can implement proper confirmation checking here)
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      // After successful transaction, update local balance
      const currentBalance = parseFloat(userBalance || '0');
      const newBalance = (currentBalance + amount).toString();
      
      console.log('🔄 Balance update before dispatch:', { currentBalance, amount, newBalance });
      
      // Update Redux store immediately (this will also update localStorage)
      dispatch(setBalance(newBalance));
      
      console.log('✅ Balance updated in Redux store');
      
      // Call deposit API to record the transaction (optional - for logging purposes only)
      try {
        if (address) {
          const result = await UserBalanceSystem.deposit(address, amount, txHash);
          console.log('✅ Deposit recorded in API:', result);
        } else {
          console.warn('Account address not available for API call');
        }
        
      } catch (apiError) {
        console.warn('⚠️ Could not record deposit in API:', apiError);
        // Don't fail the deposit if API call fails - balance is already updated
      }
      
      notification.success(`Successfully deposited ${amount} OG to casino treasury! TX: ${txHash.slice(0, 10)}...`);
      
      setDepositAmount("");
      
      
      
    } catch (error) {
      console.error('Deposit error:', error);
      notification.error(`Deposit failed: ${error.message}`);
    } finally {
      setIsDepositing(false);
    }
  };

  const navLinks = [
    {
      name: "Home",
      path: "/",
      classes: "text-hover-gradient-home",
    },
    {
      name: "Game",
      path: "/game",
      classes: "text-hover-gradient-game",
    },
    {
      name: "Live",
      path: "/live",
      classes: "text-hover-gradient-live",
    },
    {
      name: "Bank",
      path: "/bank",
      classes: "text-hover-gradient-bank",
    },
    {
      name: "0G Mainnet",
      path: "/0g",
      classes: "text-hover-gradient-game",
    },
  ];

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? {...n, isRead: true} : n)
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };
  
  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    setUnreadNotifications(0);
    setShowNotificationsPanel(false);
    notification.success("All notifications marked as read");
  };
  
  // Pyth Entropy handles randomness generation

  // Detect injected wallet network (best-effort)
  useEffect(() => {
    const readNetwork = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum?.network) {
          const n = await window.ethereum.network();
          if (n?.name) setWalletNetworkName(String(n.name).toLowerCase());
        }
      } catch {}
    };
    readNetwork();
    const off = window?.ethereum?.onNetworkChange?.((n) => {
      try { setWalletNetworkName(String(n?.name || '').toLowerCase()); } catch {}
    });
    return () => {
      try { off && off(); } catch {}
    };
  }, []);

      // switchToTestnet function removed

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 w-full max-w-[100vw] overflow-x-hidden bg-[#070005]/90 shadow-lg backdrop-blur-md transition-all duration-300">
        <div className="mx-auto w-full min-w-0 max-w-[100vw] px-3 sm:px-4 md:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 py-3 sm:gap-x-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-4 md:py-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 shrink">
              <BrandWordmark
                className="py-0.5"
                textClassName="text-sm sm:text-base md:text-lg lg:text-[1.125rem]"
              />
            </span>
            
            {/* Mobile menu button */}
            <button 
              className="shrink-0 rounded-lg p-1 text-white transition-colors hover:bg-purple-500/20 md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle mobile menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showMobileMenu ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden min-w-0 items-center justify-center gap-4 font-display md:flex lg:gap-8 xl:gap-10">
            {navLinks.map(({ name, path, classes }, index) => (
              <div key={index} className="relative shrink-0 group">
              <Link
                  className={`${path === pathname ? "text-transparent bg-clip-text bg-gradient-to-r from-red-magic to-blue-magic font-semibold" : classes} flex items-center gap-1 text-sm font-medium transition-all duration-200 hover:scale-105 lg:text-base xl:text-lg`}
                href={path}
              >
                {name}
              </Link>
              </div>
            ))}
          </div>
          
          <div className="flex min-w-0 max-w-full items-center justify-end gap-1 sm:gap-1.5 md:gap-2 md:pl-2 lg:gap-2.5">
            {/* Notifications */}
            <div className="relative hidden md:block">
              <button 
                onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                className="p-2 text-white/70 hover:text-white transition-colors relative rounded-full hover:bg-purple-500/20"
                aria-label="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notifications Panel */}
              {showNotificationsPanel && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1A0015]/95 backdrop-blur-md border border-purple-500/30 rounded-lg shadow-xl z-30 animate-fadeIn">
                  <div className="p-3 border-b border-purple-500/20 flex justify-between items-center">
                    <h3 className="font-medium text-white">Notifications</h3>
                    <button 
                      onClick={clearAllNotifications}
                      className="text-xs text-white/50 hover:text-white"
                    >
                      Mark all as read
                    </button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-white/50">
                        No notifications
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b border-purple-500/10 hover:bg-purple-500/5 cursor-pointer ${!notification.isRead ? 'bg-purple-900/10' : ''}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                            <span className="text-xs text-white/40">{notification.time}</span>
                          </div>
                          <p className="text-xs text-white/70 mt-1">{notification.message}</p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-red-500 rounded-full absolute top-3 right-3"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-2 border-t border-purple-500/20 text-center">
                    <a href="/notifications" className="text-xs text-white/70 hover:text-white">
                      View all notifications
                    </a>
                  </div>
                </div>
              )}
            </div>
            

            
            {isWalletReady && (
              <div
                className="ml-0 flex min-w-0 max-w-[min(100%,28rem)] flex-wrap items-center justify-end gap-1 rounded-xl border border-white/[0.08] bg-black/30 px-1 py-1 backdrop-blur-sm sm:max-w-none sm:gap-1.5 sm:px-1.5 sm:py-1.5 md:ml-1"
                aria-label="Wallet actions"
              >
                <div className="flex min-w-0 max-w-full items-center gap-1 rounded-lg border border-[#9200E1]/35 bg-[#9200E1]/[0.08] px-1.5 py-1 sm:gap-1.5 sm:px-2 sm:py-1.5 md:px-2.5">
                  <span className="hidden whitespace-nowrap text-[11px] text-white/55 md:inline">
                    Balance
                  </span>
                  <span className="max-w-[5.5rem] truncate text-xs font-semibold tabular-nums text-[#E8C8FF] sm:max-w-[7rem] md:text-sm lg:max-w-[9rem]">
                    {isLoadingBalance
                      ? '…'
                      : `${parseFloat(userBalance || '0').toFixed(5)}`}
                  </span>
                  <span className="shrink-0 text-[10px] text-white/45 sm:text-[11px]">
                    0G
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowBalanceModal(true)}
                    className="shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/80 transition-colors hover:border-[#B75FFF]/50 hover:bg-[#9200E1]/20 hover:text-white"
                  >
                    Manage
                  </button>
                </div>

                {isConnected && (
                  <div
                    className="hidden items-center gap-1 rounded-md border border-[#9200E1]/30 bg-[#0a0008]/80 px-2 py-1 text-[11px] font-medium text-[#D8B4FE] xl:flex"
                    title="Secured with Pyth Entropy"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 opacity-90"
                      aria-hidden
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span className="max-w-[7rem] truncate lg:max-w-none">
                      Entropy
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#B75FFF]/40 bg-[#9200E1]/25 px-2 text-xs font-medium text-white transition-colors hover:border-[#B75FFF]/60 hover:bg-[#9200E1]/40 sm:h-9 sm:px-2.5"
                  title="AI Assistant"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0"
                    aria-hidden
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="hidden lg:inline">AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLiveChat(true)}
                  className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-[#9200E1]/35 bg-white/5 px-2 text-xs font-medium text-white/90 transition-colors hover:border-[#B75FFF]/45 hover:bg-[#9200E1]/15 sm:h-9 sm:px-2.5"
                  title="Live chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 text-[#E9D5FF]"
                    aria-hidden
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="hidden lg:inline">Chat</span>
                </button>
              </div>
            )}

            {isConnected && !isWalletReady && (
              <div
                className="hidden items-center gap-1 rounded-md border border-[#9200E1]/30 bg-[#9200E1]/10 px-2 py-1 text-[11px] font-medium text-[#D8B4FE] xl:flex"
                title="Secured with Pyth Entropy"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Entropy
              </div>
            )}

            {!isWalletReady && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#B75FFF]/40 bg-[#9200E1]/25 px-3 text-sm font-medium text-white transition-colors hover:border-[#B75FFF]/60 hover:bg-[#9200E1]/40"
                  title="AI Assistant"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <span className="hidden sm:inline">AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLiveChat(true)}
                  className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#9200E1]/35 bg-white/5 px-3 text-sm font-medium text-white/90 transition-colors hover:border-[#B75FFF]/45 hover:bg-[#9200E1]/15"
                  title="Live chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-[#E9D5FF]"
                    aria-hidden
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="hidden sm:inline">Chat</span>
                </button>
              </>
            )}
            
            <div className="min-w-0 shrink">
              <ConnectWalletButton />
            </div>
      
          </div>
        </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden bg-[#0A0008]/95 backdrop-blur-md p-4 border-t border-purple-500/20 animate-slideDown">
            <div className="flex flex-col space-y-3">
              {navLinks.map(({ name, path, classes }, index) => (
                <div key={index}>
                  <Link
                    className={`${path === pathname ? 'text-white font-semibold' : 'text-white/80'} py-2 px-3 rounded-md hover:bg-purple-500/10 flex items-center w-full text-lg`}
                    href={path}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {name}
                  </Link>
                </div>
              ))}
              
              {/* User Balance in Mobile Menu */}
              {isWalletReady && (
                <div className="pt-2 mt-2 border-t border-purple-500/10">
                  <div className="rounded-lg border border-[#9200E1]/35 bg-[#9200E1]/[0.08] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm text-white/55">House balance</span>
                      <span className="text-sm font-semibold tabular-nums text-[#E8C8FF]">
                        {isLoadingBalance
                          ? '…'
                          : `${parseFloat(userBalance || '0').toFixed(5)} 0G`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBalanceModal(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/85 transition-colors hover:border-[#B75FFF]/45 hover:bg-[#9200E1]/20"
                    >
                      Manage balance
                    </button>
                  </div>
                </div>
              )}
              
              <div className="pt-2 mt-2 border-t border-purple-500/10">
                <a 
                  href="#support" 
                  className="block py-2 px-3 text-white/80 hover:text-white hover:bg-purple-500/10 rounded-md"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Balance Management Modal (portal) */}
        {isClient && showBalanceModal && createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBalanceModal(false)}
          >
            <div
              className="bg-[#0A0008] border border-purple-500/20 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">House Balance</h3>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Current Balance */}
              <div className="mb-4 rounded-lg border border-[#9200E1]/35 bg-[#9200E1]/[0.08] p-3">
                <span className="text-sm text-white/55">Current balance</span>
                <div className="text-lg font-bold tabular-nums text-[#E8C8FF]">
                  {isLoadingBalance ? 'Loading...' : `${parseFloat(userBalance || '0').toFixed(5)} 0G`}
                </div>
              </div>
              
              {/* Deposit Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-white mb-2">Deposit OG to Casino Treasury</h4>
                <div className="text-xs text-gray-400 mb-2">
                  Treasury:{' '}
                  {resolvedTreasuryAddress
                    ? `${resolvedTreasuryAddress.slice(0, 10)}...${resolvedTreasuryAddress.slice(-8)}`
                    : <span className="text-yellow-400">Loading…</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter OG amount"
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25"
                    min="0"
                    step="0.00000001"
                    disabled={isDepositing}
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={!isConnected || !depositAmount || parseFloat(depositAmount) <= 0 || isDepositing}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded font-medium transition-colors flex items-center gap-2"
                  >
                    {isDepositing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                        Depositing...
                      </>
                    ) : (
                      <>
                        Deposit
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8l-8-8-8 8" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Transfer OG from your wallet to house balance for gaming
                </p>
                {/* Quick Deposit Buttons */}
                <div className="flex gap-1 mt-2">
                  {[0.001, 0.01, 0.1, 1].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="flex-1 px-2 py-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded transition-colors"
                      disabled={isDepositing}
                    >
                      {amount} OG
                    </button>
                  ))}
                </div>
                
              </div>

              {/* Withdraw Section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-white mb-2">Withdraw All OG</h4>
                <button
                  onClick={handleWithdraw}
                  disabled={!isConnected || parseFloat(userBalance || '0') <= 0 || isWithdrawing}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isWithdrawing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></div>
                      Processing...
                    </>
                  ) : isConnected ? (
                    parseFloat(userBalance || '0') > 0 ? 'Withdraw All OG' : 'No Balance'
                  ) : 'Connect Wallet'}
                  {isConnected && parseFloat(userBalance || '0') > 0 && !isWithdrawing && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
                {isConnected && parseFloat(userBalance || '0') > 0 && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Withdraw {parseFloat(userBalance || '0').toFixed(5)} OG to your wallet
                  </p>
                )}
              </div>
              
              {/* Refresh Balance */}
              <div className="mt-6">
                <button
                  onClick={() => {
                    // Only refresh from localStorage, don't try blockchain
                    const savedBalance = loadBalanceFromStorage(address);
                    if (savedBalance && savedBalance !== "0") {
                      console.log('Refreshing balance from localStorage:', savedBalance);
                      dispatch(setBalance(savedBalance));
                    } else {
                      console.log('No saved balance in localStorage');
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                >
                  Refresh Balance
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        
        <div className="w-full h-[2px] magic-gradient overflow-hidden"></div>
      </nav>
      
      {/* Pyth Entropy handles randomness generation */}
      
      {/* Live Chat Modal */}
      <LiveChat
        open={showLiveChat}
        onClose={() => setShowLiveChat(false)}
      />
      
      {/* AI Modal */}
      <AiModal isOpen={showAiModal} onClose={() => setShowAiModal(false)} />
      
    </>
  );
}