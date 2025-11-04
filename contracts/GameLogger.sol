// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract GameLogger {
    struct GameLog {
        string gameId;
        string gameType;
        address userAddress;
        uint256 betAmount;
        uint256 payoutAmount;
        bool isWin;
        string gameConfig;
        string resultData;
        string entropyProof;
        uint256 timestamp;
        uint256 blockNumber;
    }
    
    // Events
    event GameLogged(
        string indexed gameId,
        string indexed gameType,
        address indexed userAddress,
        uint256 betAmount,
        uint256 payoutAmount,
        bool isWin,
        uint256 timestamp
    );
    
    event LoggerStatsUpdated(
        uint256 totalLogs,
        uint256 totalGasUsed,
        address lastLogger
    );
    
    // Storage
    mapping(string => GameLog) public gameLogs;
    mapping(string => bool) public gameExists;
    mapping(address => uint256) public userLogCounts;
    mapping(string => uint256) public gameTypeLogCounts;
    
    uint256 public totalLogs;
    uint256 public totalGasUsed;
    address public owner;
    address public lastLogger;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * Log a game result
     * @param gameId Unique game identifier
     * @param gameType Type of game (ROULETTE, PLINKO, etc.)
     * @param userAddress Player's address
     * @param betAmount Bet amount in wei
     * @param payoutAmount Payout amount in wei
     * @param isWin Whether the game was won
     * @param gameConfig JSON string of game configuration
     * @param resultData JSON string of game result data
     * @param entropyProof JSON string of entropy proof data
     */
    function logGame(
        string memory gameId,
        string memory gameType,
        address userAddress,
        uint256 betAmount,
        uint256 payoutAmount,
        bool isWin,
        string memory gameConfig,
        string memory resultData,
        string memory entropyProof
    ) external {
        require(bytes(gameId).length > 0, "Game ID cannot be empty");
        require(!gameExists[gameId], "Game already logged");
        require(userAddress != address(0), "Invalid user address");
        
        uint256 gasStart = gasleft();
        
        // Create game log
        GameLog memory newLog = GameLog({
            gameId: gameId,
            gameType: gameType,
            userAddress: userAddress,
            betAmount: betAmount,
            payoutAmount: payoutAmount,
            isWin: isWin,
            gameConfig: gameConfig,
            resultData: resultData,
            entropyProof: entropyProof,
            timestamp: block.timestamp,
            blockNumber: block.number
        });
        
        // Store the log
        gameLogs[gameId] = newLog;
        gameExists[gameId] = true;
        
        // Update counters
        userLogCounts[userAddress]++;
        gameTypeLogCounts[gameType]++;
        totalLogs++;
        lastLogger = msg.sender;
        
        // Calculate gas used
        uint256 gasUsed = gasStart - gasleft();
        totalGasUsed += gasUsed;
        
        // Emit events
        emit GameLogged(
            gameId,
            gameType,
            userAddress,
            betAmount,
            payoutAmount,
            isWin,
            block.timestamp
        );
        
        emit LoggerStatsUpdated(
            totalLogs,
            totalGasUsed,
            msg.sender
        );
    }
    
    /**
     * Get game log by ID
     */
    function getGameLog(string memory gameId) external view returns (GameLog memory) {
        require(gameExists[gameId], "Game not found");
        return gameLogs[gameId];
    }
    
    /**
     * Get logger statistics
     */
    function getLoggerStats() external view returns (
        uint256 _totalLogs,
        uint256 _totalGasUsed,
        address _lastLogger,
        uint256 _averageGasPerLog
    ) {
        _totalLogs = totalLogs;
        _totalGasUsed = totalGasUsed;
        _lastLogger = lastLogger;
        _averageGasPerLog = totalLogs > 0 ? totalGasUsed / totalLogs : 0;
    }
    
    /**
     * Get user's log count
     */
    function getUserLogCount(address user) external view returns (uint256) {
        return userLogCounts[user];
    }
    
    /**
     * Get game type log count
     */
    function getGameTypeLogCount(string memory gameType) external view returns (uint256) {
        return gameTypeLogCounts[gameType];
    }
    
    /**
     * Emergency function to update owner (only current owner)
     */
    function updateOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;
    }
    
    /**
     * Get contract info
     */
    function getContractInfo() external view returns (
        address _owner,
        uint256 _deployedBlock,
        uint256 _currentBlock,
        uint256 _totalLogs
    ) {
        _owner = owner;
        _deployedBlock = 0; // Would need to store this in constructor
        _currentBlock = block.number;
        _totalLogs = totalLogs;
    }
}