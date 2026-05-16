import { useState, useCallback } from 'react';
import { useChainId } from 'wagmi';
import { saveGameResult } from '../utils/gameHistory';

/**
 * Game History Hook
 * Provides functions to save game results with VRF transaction hashes.
 * Automatically injects the active chainId so the 0G logger uses the correct explorer.
 */
export const useGameHistory = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const chainId = useChainId(); // active wallet chain at time of save

  const saveGame = useCallback(async (gameData) => {
    try {
      setSaving(true);
      setError(null);
      const result = await saveGameResult({ ...gameData, chainId: gameData.chainId ?? chainId });
      console.log('✅ Game saved to history:', result.gameId);
      return result;
    } catch (err) {
      console.error('❌ Failed to save game:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [chainId]);

  const saveRouletteGame = useCallback(async ({
    userAddress, vrfRequestId, vrfTransactionHash, vrfValue,
    gameConfig, resultData, betAmount, payoutAmount, clientBetId
  }) => {
    return saveGame({
      userAddress,
      gameType: 'ROULETTE',
      vrfRequestId, vrfTransactionHash, vrfValue,
      gameConfig: { betType: gameConfig.betType || 'straight', betValue: gameConfig.betValue, wheelType: gameConfig.wheelType || 'european', ...gameConfig },
      resultData: { number: resultData.number, color: resultData.color, properties: resultData.properties, vrfValue, ...resultData },
      betAmount, payoutAmount, clientBetId,
    });
  }, [saveGame]);

  const saveMinesGame = useCallback(async ({
    userAddress, vrfRequestId, vrfTransactionHash, vrfValue,
    gameConfig, resultData, betAmount, payoutAmount
  }) => {
    return saveGame({
      userAddress,
      gameType: 'MINES',
      vrfRequestId, vrfTransactionHash, vrfValue,
      gameConfig: { mineCount: gameConfig.mineCount || 3, gridSize: gameConfig.gridSize || 25, ...gameConfig },
      resultData: { minePositions: resultData.minePositions, revealedTiles: resultData.revealedTiles, hitMine: resultData.hitMine, totalMines: resultData.minePositions?.length || 0, vrfValue, ...resultData },
      betAmount, payoutAmount,
    });
  }, [saveGame]);

  const savePlinkoGame = useCallback(async ({
    userAddress, vrfRequestId, vrfTransactionHash, vrfValue,
    gameConfig, resultData, betAmount, payoutAmount, clientBetId
  }) => {
    return saveGame({
      userAddress,
      gameType: 'PLINKO',
      vrfRequestId, vrfTransactionHash, vrfValue,
      gameConfig: { rows: gameConfig.rows || 16, risk: gameConfig.risk || 'medium', ...gameConfig },
      resultData: { ballPath: resultData.ballPath, finalSlot: resultData.finalSlot, multiplier: resultData.multiplier, rows: resultData.rows, vrfValue, ...resultData },
      betAmount, payoutAmount, clientBetId,
    });
  }, [saveGame]);

  const saveWheelGame = useCallback(async ({
    userAddress, vrfRequestId, vrfTransactionHash, vrfValue,
    gameConfig, resultData, betAmount, payoutAmount
  }) => {
    return saveGame({
      userAddress,
      gameType: 'WHEEL',
      vrfRequestId, vrfTransactionHash, vrfValue,
      gameConfig: { wheelType: gameConfig.wheelType || 'standard', segments: gameConfig.segments || 10, ...gameConfig },
      resultData: { segment: resultData.segment, multiplier: resultData.multiplier, vrfValue, ...resultData },
      betAmount, payoutAmount,
    });
  }, [saveGame]);

  return {
    saving,
    error,
    saveGame,
    saveRouletteGame,
    saveMinesGame,
    savePlinkoGame,
    saveWheelGame,
  };
};

export default useGameHistory;
