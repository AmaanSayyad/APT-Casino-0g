# 0G Data Availability (DA) Integration Guide

Complete guide for integrating and using 0G DA in the casino application.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [DA Client Node Setup](#da-client-node-setup)
6. [Usage](#usage)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

## Overview

0G Data Availability (DA) provides infinitely scalable and programmable data availability for storing game history, transaction data, and audit trails. This integration enables:

- **Blob Submission**: Store data blobs up to 32 MB
- **Batch Processing**: Efficiently handle large game history batches
- **Automatic Logging**: Game results automatically submitted to DA
- **Blob Retrieval**: Retrieve stored data when needed

## Prerequisites

- Node.js >= 18.0.0
- Docker (for DA Client node)
- 0G tokens in treasury wallet (for gas fees)
- Basic knowledge of gRPC and blockchain concepts

## Installation

### 1. Install Dependencies

The required packages are already included in `package.json`. If you need to install manually:

```bash
npm install @grpc/grpc-js @grpc/proto-loader --legacy-peer-deps
```

### 2. Verify Installation

Check that gRPC packages are installed:

```bash
npm list @grpc/grpc-js @grpc/proto-loader
```

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# 0G DA Client URL (gRPC endpoint)
NEXT_PUBLIC_0G_DA_CLIENT_URL=http://localhost:51001

# 0G Network RPC (for DA contract interactions)
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc-testnet.0g.ai

# Treasury Private Key (for DA submissions)
TREASURY_PRIVATE_KEY=your_private_key_here

# Network selection (TESTNET or MAINNET)
NEXT_PUBLIC_NETWORK=TESTNET
```

### Configuration Files

The integration uses configuration files in `src/config/`:

- **`ogDA.js`**: DA network configuration, blob settings, and batch processing options
- **`treasury.js`**: Treasury wallet configuration for DA operations

## DA Client Node Setup

The DA Client node is required for blob submission and retrieval. Follow these steps:

### Option 1: Docker Setup (Recommended)

#### Linux/Mac

```bash
# Run setup script
chmod +x scripts/setup-og-da-client.sh
./scripts/setup-og-da-client.sh
```

#### Windows

```bash
# Run setup script
scripts\setup-og-da-client.bat
```

#### Manual Docker Setup

1. **Clone DA Client Repository**

```bash
git clone https://github.com/0gfoundation/0g-da-client.git
cd 0g-da-client
```

2. **Build Docker Image**

```bash
docker build -t 0g-da-client -f combined.Dockerfile .
```

3. **Create Environment File**

Create `envfile.env`:

```bash
COMBINED_SERVER_CHAIN_RPC=https://evmrpc-testnet.0g.ai
COMBINED_SERVER_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
ENTRANCE_CONTRACT_ADDR=0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9

COMBINED_SERVER_RECEIPT_POLLING_ROUNDS=180
COMBINED_SERVER_RECEIPT_POLLING_INTERVAL=1s
COMBINED_SERVER_TX_GAS_LIMIT=2000000
COMBINED_SERVER_USE_MEMORY_DB=true
COMBINED_SERVER_KV_DB_PATH=/runtime/
COMBINED_SERVER_TimeToExpire=2592000
DISPERSER_SERVER_GRPC_PORT=51001
BATCHER_DASIGNERS_CONTRACT_ADDRESS=0x0000000000000000000000000000000000001000
BATCHER_FINALIZER_INTERVAL=20s
BATCHER_CONFIRMER_NUM=3
BATCHER_MAX_NUM_RETRIES_PER_BLOB=3
BATCHER_FINALIZED_BLOCK_COUNT=50
BATCHER_BATCH_SIZE_LIMIT=500
BATCHER_ENCODING_INTERVAL=3s
BATCHER_ENCODING_REQUEST_QUEUE_SIZE=1
BATCHER_PULL_INTERVAL=10s
BATCHER_SIGNING_INTERVAL=3s
BATCHER_SIGNED_PULL_INTERVAL=20s
BATCHER_EXPIRATION_POLL_INTERVAL=3600
BATCHER_ENCODER_ADDRESS=DA_ENCODER_SERVER
BATCHER_ENCODING_TIMEOUT=300s
BATCHER_SIGNING_TIMEOUT=60s
BATCHER_CHAIN_READ_TIMEOUT=12s
BATCHER_CHAIN_WRITE_TIMEOUT=13s
```

4. **Run DA Client Container**

```bash
docker run -d \
  --env-file envfile.env \
  --name 0g-da-client \
  -v ./run:/runtime \
  -p 51001:51001 \
  0g-da-client combined
```

5. **Verify DA Client is Running**

```bash
# Check container status
docker ps | grep 0g-da-client

# Check logs
docker logs 0g-da-client

# Test connection
curl http://localhost:51001/health
```

### Option 2: Binary Installation

Refer to the [official 0G DA documentation](https://docs.0g.ai/developer-hub/building-on-0g/da-integration) for binary installation instructions.

## Usage

### Basic Usage

#### 1. Check DA Client Status

```javascript
// Via API
const response = await fetch('/api/og-da/status');
const status = await response.json();
console.log(status);

// Via Service
import ogDAService from '@/services/OGDAService';
const isAvailable = await ogDAService.checkDAClientAvailability();
```

#### 2. Submit Single Blob

```javascript
// Via API
const response = await fetch('/api/og-da/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: JSON.stringify({
      message: 'Hello from 0G DA!',
      timestamp: Date.now(),
    }),
    options: {},
  }),
});

const result = await response.json();
console.log('Blob Hash:', result.blobHash);
console.log('Request ID:', result.requestId);

// Via Service
import ogDAService from '@/services/OGDAService';
const result = await ogDAService.submitBlob({
  message: 'Hello from 0G DA!',
  timestamp: Date.now(),
});
```

#### 3. Submit Game Result

```javascript
import ogDAService from '@/services/OGDAService';

const gameResult = {
  gameId: 'game_123',
  gameType: 'ROULETTE',
  userAddress: '0x...',
  betAmount: '1000000000000000000',
  payoutAmount: '2000000000000000000',
  isWin: true,
  gameConfig: { /* ... */ },
  resultData: { /* ... */ },
};

const result = await ogDAService.submitGameResult(gameResult);
console.log('Submitted:', result.blobHash);
```

#### 4. Submit Game History Batch

```javascript
import ogDAService from '@/services/OGDAService';

const gameResults = [
  { /* game 1 */ },
  { /* game 2 */ },
  // ... up to 100 games per batch
];

// Sequential submission (default)
const result = await ogDAService.submitGameHistoryBatch(gameResults);

// Parallel submission (faster for large batches)
const result = await ogDAService.submitGameHistoryBatch(gameResults, {
  parallel: true,
  batchSize: 50, // games per chunk
  compress: true,
});

console.log(`Submitted ${result.totalChunks} chunks`);
console.log(`${result.successfulChunks} successful, ${result.failedChunks} failed`);
```

#### 5. Retrieve Blob

```javascript
// Via API
const batchHeaderHash = '0x...'; // from submission result
const response = await fetch(
  `/api/og-da/retrieve?hash=${batchHeaderHash}&blobIndex=0`
);
const result = await response.json();
console.log('Retrieved data:', result.data);

// Via Service
import ogDAService from '@/services/OGDAService';
const blobData = await ogDAService.retrieveBlob(batchHeaderHash);
```

### Automatic Game History Logging

Game results are automatically submitted to DA when saved:

```javascript
import { saveGameResult } from '@/utils/gameHistory';

const result = await saveGameResult({
  gameType: 'ROULETTE',
  userAddress: '0x...',
  // ... other game data
});

// Result includes DA submission info
if (result.ogDALog) {
  console.log('DA Blob Hash:', result.ogDALog.blobHash);
}
```

### Batch Processing Options

The batch processing supports several options:

```javascript
{
  batchSize: 100,        // Games per chunk (default: 100)
  compress: true,        // Enable compression (default: true)
  parallel: false,       // Parallel submission (default: false)
  customQuorumNumbers: [] // Custom quorum numbers
}
```

### Error Handling

```javascript
try {
  const result = await ogDAService.submitBlob(data);
} catch (error) {
  if (error.message.includes('ECONNREFUSED')) {
    console.error('DA Client node is not running');
  } else if (error.message.includes('size exceeds')) {
    console.error('Blob too large, use batch processing');
  } else {
    console.error('Submission failed:', error.message);
  }
}
```

## API Reference

### REST API Endpoints

#### `POST /api/og-da/submit`

Submit a blob to 0G DA.

**Request Body:**
```json
{
  "data": "string or JSON string",
  "options": {
    "customQuorumNumbers": [],
    "compress": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "string",
  "blobHash": "0x...",
  "dataRoot": "0x...",
  "result": "string",
  "blobSize": 1234,
  "status": "pending",
  "daClientUrl": "http://localhost:51001"
}
```

#### `GET /api/og-da/retrieve`

Retrieve a blob from 0G DA.

**Query Parameters:**
- `hash` or `batchHeaderHash`: Batch header hash (required)
- `blobIndex`: Blob index (default: 0)

**Response:**
```json
{
  "success": true,
  "batchHeaderHash": "0x...",
  "blobIndex": 0,
  "data": {},
  "dataSize": 1234,
  "format": "json"
}
```

#### `GET /api/og-da/status`

Check DA Client node status.

**Response:**
```json
{
  "success": true,
  "available": true,
  "daClientUrl": "http://localhost:51001",
  "network": "0G Testnet",
  "chainId": 16602,
  "connectionTest": "passed"
}
```

### Service Methods

#### `OGDAService`

**Methods:**

- `submitBlob(data, options)` - Submit single blob
- `retrieveBlob(blobHash)` - Retrieve blob
- `submitGameResult(gameResult)` - Submit single game result
- `submitGameHistoryBatch(gameResults, options)` - Submit batch with auto-chunking
- `checkDAClientAvailability()` - Check if DA Client is available
- `getBlobPrice()` - Get current blob price

#### `OGDAClient`

**Methods:**

- `initialize()` - Initialize gRPC client
- `disperseBlob(data, customQuorumNumbers)` - Submit blob via gRPC
- `retrieveBlob(batchHeaderHash, blobIndex)` - Retrieve blob via gRPC
- `getBlobStatus(requestId)` - Get blob submission status
- `close()` - Close gRPC connection

## Troubleshooting

### DA Client Not Available

**Problem:** `Cannot connect to DA Client node`

**Solutions:**
1. Check if DA Client container is running:
   ```bash
   docker ps | grep 0g-da-client
   ```

2. Check DA Client logs:
   ```bash
   docker logs 0g-da-client
   ```

3. Verify environment variables in `envfile.env`

4. Check if port 51001 is accessible:
   ```bash
   curl http://localhost:51001/health
   ```

5. Update `NEXT_PUBLIC_0G_DA_CLIENT_URL` in `.env.local`

### Blob Size Exceeded

**Problem:** `Blob size exceeds maximum`

**Solutions:**
- Maximum blob size is 32,505,852 bytes (~32 MB)
- Use batch processing to split large data
- Enable compression: `{ compress: true }`
- Reduce batch size in options

### gRPC Connection Errors

**Problem:** `ECONNREFUSED` or connection timeout

**Solutions:**
1. Verify DA Client is running on correct port
2. Check firewall settings
3. Verify `NEXT_PUBLIC_0G_DA_CLIENT_URL` matches DA Client address
4. Test connection manually:
   ```bash
   telnet localhost 51001
   ```

### Insufficient Balance

**Problem:** `Insufficient balance for DA submission`

**Solutions:**
1. Fund treasury wallet with OG tokens
2. Check balance:
   ```javascript
   const provider = new ethers.JsonRpcProvider(RPC_URL);
   const balance = await provider.getBalance(walletAddress);
   ```

### Blob Retrieval Fails

**Problem:** `Blob not found`

**Solutions:**
1. Verify batch header hash is correct
2. Wait for blob to be confirmed on-chain
3. Check blob status:
   ```javascript
   const status = await ogDAClient.getBlobStatus(requestId);
   ```

## Production Deployment

### 1. Production DA Client Setup

```bash
# Production environment file
COMBINED_SERVER_CHAIN_RPC=https://evmrpc.0g.ai
COMBINED_SERVER_PRIVATE_KEY=PRODUCTION_PRIVATE_KEY
# ... other production settings

# Run with restart policy
docker run -d \
  --env-file prod-envfile.env \
  --name 0g-da-client-prod \
  -v /data/0g-da:/runtime \
  -p 51001:51001 \
  --restart unless-stopped \
  0g-da-client combined
```

### 2. Environment Variables

```bash
# Production .env
NEXT_PUBLIC_0G_DA_CLIENT_URL=http://your-da-client:51001
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_NETWORK=MAINNET
```

### 3. Monitoring

Set up monitoring for:
- DA Client node health
- Blob submission success rate
- Batch processing performance
- Error rates and retries

### 4. Security Considerations

- Keep private keys secure (use environment variables)
- Use secure gRPC connections in production (TLS)
- Implement rate limiting for API endpoints
- Monitor DA Client logs for anomalies

### 5. Performance Optimization

- Use parallel batch processing for large datasets
- Adjust batch sizes based on data patterns
- Enable compression for text-heavy data
- Monitor and optimize blob size distribution

## Testing

Run the test script to verify installation:

```bash
npm run test:og-da
```

This will:
1. Check DA Client connection
2. Test blob submission
3. Test game history batch submission

## Support

- **Documentation**: [0G DA Documentation](https://docs.0g.ai/developer-hub/building-on-0g/da-integration)
- **GitHub**: [0G DA Client Repository](https://github.com/0gfoundation/0g-da-client)
- **Discord**: [0G Labs Discord](https://discord.gg/0glabs)

## Additional Resources

- [0G DA Technical Deep Dive](0g-doc-main/docs/developer-hub/building-on-0g/da-deep-dive.md)
- [DA Integration Guide](0g-doc-main/docs/developer-hub/building-on-0g/da-integration.md)
- [0G DA Example Repository](https://github.com/0gfoundation/0g-da-example-rust)

---

**Last Updated:** November 2024  
**Version:** 1.0.0  
**Status:** Production Ready

