import { GameHistoryService } from '../../../services/GameHistoryService';

/**
 * Game History API — retrieves game history for a user.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const {
    userAddress,
    gameType,
    limit = '50',
    offset = '0',
    includeVrfDetails = 'false',
  } = req.query;

  if (!userAddress) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: userAddress',
    });
  }

  const validGameTypes = ['ROULETTE', 'MINES', 'PLINKO', 'WHEEL'];
  if (gameType && !validGameTypes.includes(String(gameType).toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid game type. Must be one of: ${validGameTypes.join(', ')}`,
    });
  }

  const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
  const offsetNum = parseInt(offset, 10) || 0;
  const includeVrf = includeVrfDetails === 'true';

  const emptyPayload = {
    games: [],
    summary: {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      totalBetAmount: 0,
      totalPayoutAmount: 0,
      totalProfitLoss: 0,
      winRate: 0,
    },
    gameTypeStats: null,
    pagination: { limit: limitNum, offset: offsetNum, hasMore: false },
    filters: {
      userAddress,
      gameType: gameType || null,
      includeVrfDetails: includeVrf,
    },
  };

  try {
    const gameHistoryService = new GameHistoryService();
    try {
      await gameHistoryService.initialize();
    } catch (initErr) {
      console.warn('Game history DB unavailable:', initErr?.message);
      return res.status(200).json({
        success: true,
        data: emptyPayload,
        message: 'No game history database configured — showing empty list.',
      });
    }

    const raw = await gameHistoryService.getUserHistory(userAddress, {
      gameType: gameType ? String(gameType).toUpperCase() : null,
      limit: limitNum,
      offset: offsetNum,
      includeVrfDetails: includeVrf,
    });

    const games = (raw.games || []).map((g) => {
      const payout = g.payoutAmount != null ? String(g.payoutAmount) : '0';
      const bet = g.betAmount != null ? String(g.betAmount) : '0';
      const win =
        g.isWin === true ? 'win' : g.isWin === false ? 'lose' : 'lose';
      const vrfTx = g.vrfDetails?.transactionHash;
      return {
        ...g,
        result: win,
        timestamp: g.createdAt,
        payout,
        betAmount: bet,
        playerAddress: g.userAddress,
        gameData: g.resultData,
        entropyProof: vrfTx
          ? {
              transactionHash: vrfTx,
              requestId: g.vrfDetails?.requestId,
              sequenceNumber: g.vrfDetails?.sequenceNumber,
              txExplorerUrl: g.vrfDetails?.etherscanUrl,
            }
          : g.entropyProof,
      };
    });

    const summary = {
      totalGames: games.length,
      totalWins: games.filter((game) => game.isWin).length,
      totalLosses: games.filter((game) => !game.isWin).length,
      totalBetAmount: games.reduce(
        (sum, game) => sum + parseFloat(game.betAmount || 0),
        0
      ),
      totalPayoutAmount: games.reduce(
        (sum, game) => sum + parseFloat(game.payoutAmount || 0),
        0
      ),
      totalProfitLoss: games.reduce(
        (sum, game) => sum + parseFloat(game.profitLoss || 0),
        0
      ),
      winRate:
        games.length > 0
          ? (
              (games.filter((game) => game.isWin).length / games.length) *
              100
            ).toFixed(2)
          : 0,
    };

    const gameTypeStats = {};
    if (!gameType) {
      validGameTypes.forEach((type) => {
        const typeGames = games.filter((game) => game.gameType === type);
        gameTypeStats[type] = {
          count: typeGames.length,
          wins: typeGames.filter((game) => game.isWin).length,
          losses: typeGames.filter((game) => !game.isWin).length,
          totalBet: typeGames.reduce(
            (sum, game) => sum + parseFloat(game.betAmount || 0),
            0
          ),
          totalPayout: typeGames.reduce(
            (sum, game) => sum + parseFloat(game.payoutAmount || 0),
            0
          ),
          profitLoss: typeGames.reduce(
            (sum, game) => sum + parseFloat(game.profitLoss || 0),
            0
          ),
        };
      });
    }

    try {
      await gameHistoryService.close();
    } catch {}

    const responseData = {
      games,
      summary,
      gameTypeStats:
        !gameType && Object.keys(gameTypeStats).length > 0
          ? gameTypeStats
          : null,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        hasMore: games.length === limitNum,
      },
      filters: {
        userAddress,
        gameType: gameType || null,
        includeVrfDetails: includeVrf,
      },
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      message: `Retrieved ${games.length} game records`,
    });
  } catch (error) {
    console.error('Game history fetch error:', error);
    return res.status(200).json({
      success: true,
      data: emptyPayload,
      message:
        process.env.NODE_ENV === 'development'
          ? `History unavailable: ${error.message}`
          : 'History temporarily unavailable.',
    });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};
