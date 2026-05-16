"use client";

import { useState, useEffect, useRef } from "react";
import GameWheel, { wheelDataByRisk, getHighRiskMultiplier, getHighRiskProbability } from "../../../components/wheel/GameWheel";
import BettingPanel from "../../../components/wheel/BettingPanel";
import GameHistory from "../../../components/wheel/GameHistory";
import { calculateResult } from "../../../lib/gameLogic";
import Image from "next/image";
// Using Next.js public asset reference instead of import
import { motion } from "framer-motion";
import { FaHistory, FaTrophy, FaInfoCircle, FaChartLine, FaCoins, FaChevronDown, FaPercentage, FaBalanceScale } from "react-icons/fa";
import { GiCardRandom, GiSpinningBlades } from "react-icons/gi";
import { HiOutlineTrendingUp, HiOutlineChartBar } from "react-icons/hi";
import { useSelector, useDispatch } from 'react-redux';
import { setBalance, setLoading, loadBalanceFromStorage } from '@/store/balanceSlice';
import { useNotification } from '@/components/NotificationSystem';
import useWalletStatus from '@/hooks/useWalletStatus';
// Pyth Entropy integration for randomness
// import vrfProofService from '@/services/VRFProofService';
// import VRFProofRequiredModal from '@/components/VRF/VRFProofRequiredModal';
// import vrfLogger from '@/services/VRFLoggingService';
import pythEntropyService from '@/services/PythEntropyService';
import { useGameHistory } from '@/hooks/useGameHistory';
import { useAccount } from 'wagmi';
import { ZG_LOGO_HERO } from '@/config/brandLogos.js';

// Import new components
import WheelVideo from "./components/WheelVideo";
import WheelDescription from "./components/WheelDescription";
import WheelStrategyGuide from "./components/WheelStrategyGuide";
import WheelProbability from "./components/WheelProbability";
import WheelPayouts from "./components/WheelPayouts";
import WheelHistory from "./components/WheelHistory";

export default function Home() {
  const [betAmount, setBetAmount] = useState(0.001);
  const [risk, setRisk] = useState("medium");
  const [noOfSegments, setSegments] = useState(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameMode, setGameMode] = useState("manual");
  const [currentMultiplier, setCurrentMultiplier] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [showVRFModal, setShowVRFModal] = useState(false);
  const [targetMultiplier, setTargetMultiplier] = useState(null);
  const [wheelPosition, setWheelPosition] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState('medium');
  const [result, setResult] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [detectedColor, setDetectedColor] = useState(null);
  const [detectedMultiplier, setDetectedMultiplier] = useState(null);
  
  const dispatch = useDispatch();
  const { userBalance, isLoading: isLoadingBalance } = useSelector((state) => state.balance);
  const notification = useNotification();
  const { isConnected } = useWalletStatus();
  
  // Use ref to prevent infinite loop in useEffect
  const isInitialized = useRef(false);
  
  // Load balance from localStorage on component mount
  useEffect(() => {
    if (isInitialized.current) return; // Prevent multiple executions
    
    const savedBalance = loadBalanceFromStorage();
    if (savedBalance) {
      console.log('Loading saved balance from localStorage:', savedBalance);
      dispatch(setBalance(savedBalance));
    } else {
      // Initialize with zero balance
      console.log('No saved balance, initializing with zero');
      dispatch(setBalance("0"));
    }
    
    isInitialized.current = true; // Mark as initialized
  }, []); // Empty dependency array since we use ref

  // Scroll to section function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Game modes
  const { saveWheelGame } = useGameHistory();
  const { address } = useAccount();
  const manulBet = async () => {
    if (betAmount <= 0 || isSpinning) return;

    // Check if wallet is connected first
    console.log('🔌 Wheel Bet - Wallet Status:', { isConnected, userBalance });
    if (!isConnected) {
      alert("Please connect your wallet first to play Wheel!");
      return;
    }

    // Generate Pyth Entropy in background for provably fair proof
  const generateEntropyInBackground = async (historyItemId) => {
    try {
      console.log('🔮 PYTH ENTROPY: Generating background entropy for Wheel game...');
      
      const entropyResult = await pythEntropyService.generateRandom('WHEEL', { 
        purpose: 'wheel_spin', 
        gameType: 'WHEEL' 
      });
      
      console.log('✅ PYTH ENTROPY: Background entropy generated successfully');
      console.log('🔗 Transaction:', entropyResult.entropyProof.transactionHash);
      
      // Update the history item with real entropy proof
      setGameHistory(prev => prev.map(item => 
        item.id === historyItemId 
          ? {
              ...item,
              entropyProof: {
                requestId: entropyResult.entropyProof?.requestId,
                sequenceNumber: entropyResult.entropyProof?.sequenceNumber,
                randomValue: entropyResult.randomValue,
                randomNumber: entropyResult.randomValue,
                transactionHash: entropyResult.entropyProof?.transactionHash,
                txExplorerUrl: entropyResult.entropyProof?.txExplorerUrl,
                explorerUrl: entropyResult.entropyProof?.explorerUrl,
                timestamp: entropyResult.entropyProof?.timestamp,
                source: 'Pyth Entropy'
              }
            }
          : item
      ));
      
      // Log on-chain via casino wallet (non-blocking)
      try {
        fetch('/api/casino-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: entropyResult.entropyProof?.requestId || `wheel_${Date.now()}`,
            gameType: 'WHEEL',
            channelId: entropyResult.entropyProof?.requestId || 'entropy_channel',
            valueOg: 0
          })
        })
          .then(async (r) => {
            const t = await r.text().catch(() => '');
            console.log('🎡 Casino session log (Wheel):', r.status, t);
          })
          .catch((e) => console.warn('Casino session log failed (Wheel):', e));
      } catch (e) {
        console.warn('Casino session log threw (Wheel):', e);
      }
      
    } catch (error) {
      console.error('❌ PYTH ENTROPY: Background generation failed:', error);
    }
  };

    // Check Redux balance (balance is already in OG)
    const currentBalance = parseFloat(userBalance || '0');
    
    if (currentBalance < betAmount) {
      alert(`Insufficient balance. You have ${currentBalance.toFixed(5)} OG but need ${betAmount} OG`);
      return;
    }

    try {
      setIsSpinning(true);
      setHasSpun(false);

      console.log('=== STARTING WHEEL BET WITH REDUX BALANCE ===');
      console.log('Bet amount (ETH):', betAmount);
      console.log('Current balance (ETH):', currentBalance);
      console.log('Sectors:', noOfSegments);
      
      // Deduct bet amount from Redux balance
      const newBalance = (parseFloat(userBalance || '0') - betAmount).toString();
      dispatch(setBalance(newBalance));
      
      console.log('Balance deducted. New balance:', parseFloat(newBalance).toFixed(5), 'OG');
      
      // Set up callback to handle wheel animation completion
      window.wheelBetCallback = async (landedMultiplier) => {
        console.log('🎯 Wheel animation completed with multiplier:', landedMultiplier);
        
        // Stop spinning immediately when animation completes
        setIsSpinning(false);
        
        // Wait a moment for color detection to update, then get the REAL result
        setTimeout(async () => {
          let actualMultiplier = 0;
          let detectedColor = "#333947";
          
          // Get the final result from color detection
          if (window.triggerWheelColorDetection) {
            const detectionResult = window.triggerWheelColorDetection();
            if (detectionResult && detectionResult.multiplier !== null) {
              actualMultiplier = detectionResult.multiplier;
              detectedColor = detectionResult.color || "#333947";
              console.log('🎯 Using DETECTED multiplier:', actualMultiplier, 'Color:', detectedColor);
            } else {
              console.log('⚠️ Color detection failed, using landed multiplier:', landedMultiplier);
              actualMultiplier = landedMultiplier;
            }
          } else {
            console.log('⚠️ Color detection not available, using landed multiplier:', landedMultiplier);
            actualMultiplier = landedMultiplier;
          }
          
          const winAmount = betAmount * actualMultiplier;
          
          // Add to game history
          const historyItemId = Date.now();
          const newHistoryItem = {
            id: historyItemId,
            game: 'Wheel',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            betAmount: betAmount.toFixed(5),
            multiplier: `${actualMultiplier.toFixed(2)}x`,
            payout: winAmount.toFixed(5),
            result: 0,
            color: detectedColor
          };

          // Add temporary entropy proof (will be updated by background process)
          newHistoryItem.entropyProof = {
            requestId: 'generating_' + Date.now(),
            sequenceNumber: Date.now().toString(),
            randomValue: Math.floor(Math.random() * 1000000),
            randomNumber: Math.floor(Math.random() * 1000000),
            transactionHash: 'generating...',
            txExplorerUrl: '',
            explorerUrl: 'https://entropy-explorer.pyth.network/',
            timestamp: Date.now(),
            source: 'Generating...'
          };

          setGameHistory(prev => [newHistoryItem, ...prev]);
          
          setIsSpinning(false);
          setHasSpun(true);
          
          // Show result and update balance immediately
          if (actualMultiplier > 0) {
            notification.success(`Congratulations! ${betAmount} OG × ${actualMultiplier.toFixed(2)} = ${winAmount.toFixed(5)} OG won!`);
            
            // Update balance with winnings
            const currentBalance = parseFloat(userBalance || '0');
            const newBalanceWithWin = currentBalance + winAmount;
            
            console.log('💰 Adding winnings:', {
              currentBalance: currentBalance.toFixed(5),
              winAmount: winAmount.toFixed(5),
              newBalance: newBalanceWithWin.toFixed(5)
            });
            
            dispatch(setBalance(newBalanceWithWin.toString()));
          } else {
            notification.info(`Game over. Multiplier: ${actualMultiplier.toFixed(2)}x`);
          }

          // Generate Pyth Entropy in background for provably fair proof
          generateEntropyInBackground(historyItemId).catch(error => {
            console.error('❌ Background entropy generation failed:', error);
          });

          // Save to history -> triggers 0G logging
          try {
            const saveResult = await saveWheelGame({
              userAddress: address || '0x0000000000000000000000000000000000000001',
              vrfRequestId: newHistoryItem?.entropyProof?.requestId,
              vrfTransactionHash: newHistoryItem?.entropyProof?.transactionHash,
              vrfValue: newHistoryItem?.entropyProof?.randomValue,
              gameConfig: { segments: noOfSegments, riskLevel: 'medium' },
              resultData: { segment: 0, multiplier: actualMultiplier, color: detectedColor, totalSegments: noOfSegments },
              betAmount: String(betAmount || 0),
              payoutAmount: String(winAmount || 0),
              clientBetId: historyItemId.toString()
            });
            
            console.log('💾 Wheel saved to history (triggers 0G):', saveResult);
            
            // Update game history with 0G network log info
            if (saveResult && saveResult.ogNetworkLog) {
              console.log('🔄 Updating wheel history with 0G log for ID:', historyItemId);
              console.log('🔄 ogNetworkLog:', saveResult.ogNetworkLog);
              setGameHistory(prev => {
                console.log('🔄 Previous history:', prev.map(item => ({ id: item.id, hasOgLog: !!item.ogNetworkLog })));
                const updated = prev.map(item => 
                  item.id === historyItemId 
                    ? { ...item, ogNetworkLog: saveResult.ogNetworkLog }
                    : item
                );
                const updatedItem = updated.find(item => item.id === historyItemId);
                console.log('🔄 Updated item:', { id: updatedItem?.id, hasOgLog: !!updatedItem?.ogNetworkLog, ogLog: updatedItem?.ogNetworkLog });
                console.log('🔄 All updated history:', updated.map(item => ({ id: item.id, hasOgLog: !!item.ogNetworkLog })));
                return updated;
              });
            } else {
              console.warn('⚠️ No ogNetworkLog in saveResult:', saveResult);
            }
          } catch (e) { console.warn('saveWheelGame failed:', e); }
          
          // Clean up callback
          window.wheelBetCallback = null;
        }, 300); // Wait for color detection to update
      };
      
    } catch (e) {
      console.error('Bet failed:', e);
      alert(`Bet failed: ${e?.message || e}`);
      setIsSpinning(false);
      
      // Refund the deducted balance on error
      dispatch(setBalance(userBalance));
    }
  };

  const autoBet = async ({
    numberOfBets,
    winIncrease = 0,
    lossIncrease = 0,
    stopProfit = 0,
    stopLoss = 0,
    betAmount: initialBetAmount,
    risk,
    noOfSegments,
  }) => {
    // Check if wallet is connected first
    if (!isConnected) {
      alert('Please connect your wallet first to play Wheel!');
      return;
    }
    
    // Check if VRF proofs are available for this game
    try {
      const vrfStats = vrfProofService.getProofStats();
      const availableProofs = vrfStats.availableVRFs.WHEEL || 0;
      
      if (availableProofs <= 0) {
        setShowVRFModal(true);
        return;
      }
      
      if (availableProofs < numberOfBets) {
        alert(`❌ Not enough VRF proofs for ${numberOfBets} bets! Only ${availableProofs} proofs available. Please generate more VRF proofs first.`);
        console.warn(`🚫 Wheel auto betting blocked: Need ${numberOfBets} proofs but only ${availableProofs} available`);
        return;
      }
      
      console.log(`✅ Wheel auto betting allowed: ${availableProofs} VRF proofs available for ${numberOfBets} bets`);
    } catch (error) {
      console.error('❌ Error checking VRF proof availability:', error);
      alert('❌ Error checking VRF proof availability. Please try again.');
      return;
    }
    
    if (isSpinning) return; // Prevent overlapping spins

    let currentBet = initialBetAmount;
    let totalProfit = 0;

    for (let i = 0; i < numberOfBets; i++) {
      // Check Redux balance before each bet
      let currentBalance = parseFloat(userBalance || '0');
      
      console.log(`💰 Auto bet ${i + 1} balance check:`, {
        currentBalance: currentBalance.toFixed(5),
        currentBet: currentBet.toFixed(5),
        hasEnoughBalance: currentBalance >= currentBet
      });
      
      if (currentBalance < currentBet) {
        alert(`Insufficient balance for bet ${i + 1}. Need ${currentBet.toFixed(5)} OG but have ${currentBalance.toFixed(5)} OG`);
        break;
      }

      setIsSpinning(true);
      setHasSpun(false);
      
      // Deduct bet amount from Redux balance
      const newBalance = (parseFloat(userBalance || '0') - currentBet).toString();
      dispatch(setBalance(newBalance));

      // Calculate result position
      const resultPosition = Math.floor(Math.random() * noOfSegments);
      
      // Get the wheel data based on risk level to determine proper multipliers
      let wheelSegmentData;
      if (risk === "high") {
        const highRiskData = wheelDataByRisk.high(noOfSegments);
        const zeroSegments = Math.round((1 - getHighRiskProbability(noOfSegments)) * noOfSegments);
        wheelSegmentData = resultPosition < zeroSegments ? 
          { multiplier: 0.0, color: "#333947" } : 
          { multiplier: getHighRiskMultiplier(noOfSegments), color: "#D72E60" };
      } else if (risk === "medium") {
        // For medium risk, alternate between zero and non-zero multipliers
        if (resultPosition % 2 === 0) {
          wheelSegmentData = { multiplier: 0.0, color: "#333947" };
        } else {
          // Pick one of the non-zero multipliers based on result
          const nonZeroOptions = [
            { multiplier: 1.5, color: "#00E403" },
            { multiplier: 1.7, color: "#D9D9D9" },
            { multiplier: 2.0, color: "#FDE905" },
            { multiplier: 3.0, color: "#7F46FD" },
            { multiplier: 4.0, color: "#FCA32F" }
          ];
          const nonZeroIndex = Math.floor(resultPosition / 2) % nonZeroOptions.length;
          wheelSegmentData = nonZeroOptions[nonZeroIndex];
        }
      } else {
        // Low risk
        if (resultPosition % 2 === 0) {
          wheelSegmentData = { multiplier: 1.2, color: "#D9D9D9" };
        } else {
          wheelSegmentData = resultPosition % 4 === 1 ? 
            { multiplier: 0.0, color: "#333947" } : 
            { multiplier: 1.5, color: "#00E403" };
        }
      }
      
      // Set wheel position first
      setWheelPosition(resultPosition);

      // Simulate spin delay
      await new Promise((r) => setTimeout(r, 3000)); // spin animation time

      // Now get the REAL multiplier from color detection
      let actualMultiplier = 0;
      
      // Trigger color detection and get the REAL result
      if (window.triggerWheelColorDetection) {
        const detectionResult = window.triggerWheelColorDetection();
        if (detectionResult && detectionResult.multiplier !== null) {
          actualMultiplier = detectionResult.multiplier;
          console.log('🎯 AutoBet - Using DETECTED multiplier:', actualMultiplier);
        } else {
          console.log('⚠️ AutoBet - Color detection failed!');
          actualMultiplier = 0;
        }
      } else {
        console.log('⚠️ AutoBet - Color detection not available!');
        actualMultiplier = 0;
      }

      setCurrentMultiplier(actualMultiplier);
      setIsSpinning(false);
      setHasSpun(true);

      // Wait 2 seconds to show the result
      await new Promise((r) => setTimeout(r, 2000));

      // Calculate win amount
      const winAmount = currentBet * actualMultiplier;

      // Update Redux balance with winnings
      if (actualMultiplier > 0) {
        const currentBalance = parseFloat(userBalance || '0');
        const newBalanceWithWin = currentBalance + winAmount;
        
        console.log('💰 Auto bet winnings:', {
          currentBalance: currentBalance.toFixed(5),
          winAmount: winAmount.toFixed(5),
          newBalance: newBalanceWithWin.toFixed(5)
        });
        
        dispatch(setBalance(newBalanceWithWin.toString()));
      }

      // Update total profit
      const profit = winAmount - currentBet;
      totalProfit += profit;
      
      // Show notification for win
      if (actualMultiplier > 0) {
        notification.success(`Congratulations! ${currentBet} OG × ${actualMultiplier.toFixed(2)} = ${winAmount.toFixed(8)} OG won!`);
      }

      // Store history entry
      const newHistoryItem = {
        id: Date.now() + i, // unique id per bet
        game: "Wheel",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        betAmount: currentBet,
        multiplier: `${actualMultiplier.toFixed(2)}x`,
        payout: winAmount,
        result: resultPosition,
        color: wheelSegmentData.color
      };

      // Consume VRF proof for this auto bet game
      try {
        const vrfResult = vrfProofService.generateRandomFromProof('WHEEL');
        console.log(`🎲 Wheel auto bet ${i + 1} completed, VRF proof consumed:`, vrfResult);
        
        // Add VRF proof info to the history item
        newHistoryItem.vrfProof = {
          proofId: vrfResult.proofId,
          transactionHash: vrfResult.transactionHash,
          logIndex: vrfResult.logIndex,
          requestId: vrfResult.requestId,
          randomNumber: vrfResult.randomNumber
        };
        
        // Log proof consumption
        const stats = vrfProofService.getProofStats();
        console.log(`📊 VRF Proof Stats after Wheel auto bet ${i + 1}:`, stats);
        
      } catch (error) {
        console.error(`❌ Error consuming VRF proof for Wheel auto bet ${i + 1}:`, error);
      }

      setGameHistory(prev => [newHistoryItem, ...prev]);

      // Adjust bet for next round based on win/loss increase
      if (actualMultiplier > 1) {
        currentBet = currentBet + (currentBet * winIncrease);
      } else {
        currentBet = currentBet + (currentBet * lossIncrease);
      }

      // Clamp bet to balance
      currentBalance = parseFloat(userBalance || '0');
      if (currentBet > currentBalance) {
        console.log(`💰 Bet amount ${currentBet.toFixed(5)} exceeds balance ${currentBalance.toFixed(5)}, clamping to balance`);
        currentBet = currentBalance;
      }
      if (currentBet <= 0) currentBet = initialBetAmount;

      // Stop conditions
      if (stopProfit > 0 && totalProfit >= stopProfit) break;
      if (stopLoss > 0 && totalProfit <= -stopLoss) break;
    }

    setIsSpinning(false);
    setBetAmount(currentBet); // update bet amount in panel
  };

  const handleSelectMultiplier = (value) => {
    setTargetMultiplier(value);
  };

  // Header Section
  const renderHeader = () => {
    // Sample statistics
    const gameStatistics = {
      totalBets: '1,856,342',
      totalVolume: '8.3M OG',
      maxWin: '243,500 OG'
    };
    
    return (
      <div className="relative text-[#FEFEFE] px-4 md:px-8 lg:px-20 mb-8 pt-4 md:pt-6 mt-2">
        {/* Background Elements — 0G brand */}
        <div className="absolute top-5 -right-32 w-64 h-64 rounded-full blur-3xl bg-[#9200E1]/15"></div>
        <div className="absolute top-28 left-1/3 w-32 h-32 rounded-full blur-2xl bg-[#B75FFF]/20"></div>
        <div className="absolute -bottom-20 left-1/4 w-48 h-48 rounded-full blur-3xl bg-[#D5A3FF]/10"></div>
        
        <div className="relative">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            {/* Left Column - Game Info */}
            <div className="md:w-1/2">
              <div className="flex items-center gap-3">
                <div className="mr-1 p-2 rounded-xl bg-[#9200E1]/20 border border-[#B75FFF]/40 shadow-lg shadow-[#9200E1]/10">
                  <Image
                    src={ZG_LOGO_HERO}
                    alt="0G"
                    width={44}
                    height={44}
                    className="object-contain w-11 h-11"
                  />
                </div>
                <div>
                  <motion.div 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-sm text-[#E5E5E5] font-sans">Games / Wheel</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#9200E1]/25 text-[#D5A3FF] font-display border border-[#B75FFF]/30">Classic</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#000000] text-[#B75FFF] font-display border border-[#9200E1]/40">Live</span>
                  </motion.div>
                  <motion.h1 
                    className="text-3xl md:text-4xl font-bold font-display bg-gradient-to-r from-[#B75FFF] via-[#D5A3FF] to-[#FEFEFE] bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    Fortune Wheel
                  </motion.h1>
                </div>
              </div>
              <motion.p 
                className="text-[#E5E5E5]/90 mt-2 max-w-xl font-sans"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Place your bets and experience the thrill of the spinning wheel. From simple risk levels to customizable segments, the choice is yours.
              </motion.p>
              
              {/* Game highlights */}
              <motion.div 
                className="flex flex-wrap gap-4 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center text-sm bg-gradient-to-r from-[#9200E1]/25 to-[#B75FFF]/10 px-3 py-1.5 rounded-full border border-[#9200E1]/30">
                  <FaPercentage className="mr-1.5 text-[#E3C1FF]" />
                  <span className="font-sans">No house edge</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-[#9200E1]/25 to-[#B75FFF]/10 px-3 py-1.5 rounded-full border border-[#9200E1]/25">
                  <GiSpinningBlades className="mr-1.5 text-[#CB8AFF]" />
                  <span className="font-sans">Multiple risk levels</span>
                </div>
                <div className="flex items-center text-sm bg-gradient-to-r from-[#9200E1]/25 to-[#B75FFF]/10 px-3 py-1.5 rounded-full border border-[#B75FFF]/30">
                  <FaBalanceScale className="mr-1.5 text-[#D5A3FF]" />
                  <span className="font-sans">Provably fair gaming</span>
                </div>
              </motion.div>
            </div>
            
            {/* Right Column - Stats and Controls */}
            <div className="md:w-1/2">
              <div className="bg-gradient-to-br from-[#9200E1]/15 to-[#000000] rounded-xl p-4 border border-[#B75FFF]/25 shadow-lg shadow-[#9200E1]/10">
                {/* Quick stats in top row */}
                <motion.div 
                  className="grid grid-cols-3 gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div className="flex flex-col items-center p-2 bg-[#000000]/40 rounded-lg border border-[#E5E5E5]/10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#9200E1]/25 mb-1">
                      <FaChartLine className="text-[#B75FFF]" />
                    </div>
                    <div className="text-xs text-[#E5E5E5]/70 font-sans text-center">Total Bets</div>
                    <div className="text-[#FEFEFE] font-display text-sm md:text-base">{gameStatistics.totalBets}</div>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-[#000000]/40 rounded-lg border border-[#E5E5E5]/10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#9200E1]/20 mb-1">
                      <FaCoins className="text-[#D5A3FF]" />
                    </div>
                    <div className="text-xs text-[#E5E5E5]/70 font-sans text-center">Volume</div>
                    <div className="text-[#FEFEFE] font-display text-sm md:text-base">{gameStatistics.totalVolume}</div>
                  </div>
                  
                  <div className="flex flex-col items-center p-2 bg-[#000000]/40 rounded-lg border border-[#E5E5E5]/10">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#B75FFF]/15 mb-1">
                      <FaTrophy className="text-[#E3C1FF]" />
                    </div>
                    <div className="text-xs text-[#E5E5E5]/70 font-sans text-center">Max Win</div>
                    <div className="text-[#FEFEFE] font-display text-sm md:text-base">{gameStatistics.maxWin}</div>
                  </div>
                </motion.div>
                
                {/* Quick actions */}
                <motion.div
                  className="flex flex-wrap justify-between gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <button 
                    onClick={() => scrollToSection('strategy-guide')}
                    className="flex items-center justify-center px-4 py-2 rounded-lg text-[#FEFEFE] font-medium text-sm transition-all duration-300 bg-[#9200E1]/35 border border-[#B75FFF]/40 hover:bg-[#9200E1]/50"
                  >
                    <GiCardRandom className="mr-2" />
                    Strategy Guide
                  </button>
                  <button 
                    onClick={() => scrollToSection('probability')}
                    className="flex items-center justify-center px-4 py-2 rounded-lg text-[#FEFEFE] font-medium text-sm transition-all duration-300 bg-[#000000]/50 border border-[#CB8AFF]/35 hover:border-[#B75FFF]/60"
                  >
                    <HiOutlineChartBar className="mr-2" />
                    Probabilities
                  </button>
                  <button 
                    onClick={() => scrollToSection('history')}
                    className="flex items-center justify-center px-4 py-2 rounded-lg text-[#FEFEFE] font-medium text-sm transition-all duration-300 bg-[#B75FFF]/15 border border-[#9200E1]/35 hover:bg-[#B75FFF]/25"
                  >
                    <FaChartLine className="mr-2" />
                    Game History
                  </button>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="w-full h-0.5 bg-gradient-to-r from-[#9200E1] via-[#B75FFF] to-transparent mt-6"></div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-[#070005] text-white pb-20 game-page-container">
      {/* Header */}
      {renderHeader()}

      {/* Main Game Section */}
      <div className="px-4 md:px-8 lg:px-20">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <GameWheel
              risk={risk}
              isSpinning={isSpinning}
              noOfSegments={noOfSegments}
              currentMultiplier={currentMultiplier}
              targetMultiplier={targetMultiplier}
              handleSelectMultiplier={handleSelectMultiplier}
              wheelPosition={wheelPosition}
              setWheelPosition={setWheelPosition}
              hasSpun={hasSpun}
              onColorDetected={({ color, multiplier }) => {
                setDetectedColor(color);
                setDetectedMultiplier(multiplier);
                console.log('🎯 Color detected from GameWheel:', color, 'Multiplier:', multiplier);
              }}
            />
          </div>
          <div className="w-full lg:w-1/3">
            <BettingPanel
              gameMode={gameMode}
              setGameMode={setGameMode}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
              balance={parseFloat(userBalance || '0')} // Balance is already in OG
              manulBet={manulBet}
              risk={selectedRisk}
              setRisk={setSelectedRisk}
              noOfSegments={noOfSegments}
              setSegments={setSegments}
              autoBet={autoBet}
              isSpinning={isSpinning}
            />
          </div>
        </div>
      </div>
      
      {/* Video and Description Section */}
      <div className="px-4 md:px-8 lg:px-20 my-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            <WheelVideo />
          </div>
          <div className="w-full lg:w-1/2">
            <WheelDescription />
          </div>
        </div>
      </div>
      
      {/* Strategy Guide and Probabilities Section */}
      <div className="px-4 md:px-8 lg:px-20 my-12">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2">
            <WheelStrategyGuide />
          </div>
          <div className="w-full lg:w-1/2">
            <WheelProbability />
          </div>
        </div>
      </div>
      
      {/* Payouts and History Section */}
      <div className="px-4 md:px-8 lg:px-20 my-12">
        <div className="flex flex-col gap-12">
          <WheelPayouts />
          <WheelHistory gameHistory={gameHistory} />
        </div>
      </div>

      {/* VRF modal removed for Yellow-only mode */}
    </div>
  );
}