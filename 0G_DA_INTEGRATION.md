# 0G Data Availability (DA) Integration

This documentation explains how 0G DA is integrated into the casino application.

**For detailed setup guide, see:** [0G_DA_SETUP_GUIDE.md](./0G_DA_SETUP_GUIDE.md)

## Overview

0G DA (Data Availability) is an infinitely scalable and programmable data availability layer. It is used in the casino application to store game history and audit trails on DA.

## Features

- ✅ Blob submission (up to 32 MB)
- ✅ Game history batch submission
- ✅ Automatic DA logging for game results
- ✅ Blob retrieval (for production)
- ✅ Service status checking

## Use Cases

### 1. Game History Storage
- Store game results as DA blobs
- Batch processing (100+ games per blob)
- Immutable storage for audit trails

### 2. Large Data Storage
- Store large transaction batches
- Store tournament data
- Store analytics data

## Installation

### 1. DA Client Node (Required)

You need to run a DA Client node to use 0G DA:

```bash
# Linux/Mac
chmod +x scripts/setup-og-da-client.sh
./scripts/setup-og-da-client.sh

# Windows
scripts\setup-og-da-client.bat
```

### 2. Environment Variables

Add to `.env` file:

```bash
# 0G DA Client URL (gRPC endpoint)
NEXT_PUBLIC_0G_DA_CLIENT_URL=http://localhost:51001

# 0G Network RPC (for DA contract interactions)
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc-testnet.0g.ai
```

### 3. Running DA Client Node

```bash
# Run with Docker
docker run -d \
  --env-file da-client/envfile.env \
  --name 0g-da-client \
  -v ./da-client/run:/runtime \
  -p 51001:51001 \
  0g-da-client combined
```

## File Structure

```
src/
├── config/
│   └── ogDA.js                  ✅ DA configuration
├── services/
│   ├── OGDAService.js          ✅ DA service layer
│   └── OGDAClient.js           ✅ gRPC client for DA
└── app/
    └── api/
        └── og-da/
            ├── submit/
            │   └── route.js     ✅ Blob submission API
            ├── retrieve/
            │   └── route.js     ✅ Blob retrieval API
            └── status/
                └── route.js     ✅ DA status check API

scripts/
├── setup-og-da-client.sh       ✅ DA Client setup (Linux/Mac)
├── setup-og-da-client.bat       ✅ DA Client setup (Windows)
└── test-og-da.js               ✅ Integration test script
```

## Usage

### 1. Service Layer Usage

```javascript
import ogDAService from '@/services/OGDAService';

// Submit single game result
const result = await ogDAService.submitGameResult({
  gameId: 'game_123',
  gameType: 'ROULETTE',
  userAddress: '0x...',
  // ... other game data
});

// Submit batch of game results
const batchResult = await ogDAService.submitGameHistoryBatch([
  game1, game2, game3, // ... up to 100 games
]);

// Retrieve blob
const blob = await ogDAService.retrieveBlob(blobHash);
```

### 2. API Route Usage

```javascript
// Submit blob
const submitResponse = await fetch('/api/og-da/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    data: JSON.stringify(gameData),
    options: { compress: true }
  })
});

// Check status
const statusResponse = await fetch('/api/og-da/status');
const { available } = await statusResponse.json();
```

### 3. Automatic Game History Logging

Game history is automatically submitted to DA (in `gameHistory.js`):

```javascript
// saveGameResult function automatically submits to DA
const result = await saveGameResult(gameData);
// result.ogDALog.blobHash contains the DA blob hash
```

## Blob Configuration

### Maximum Blob Size
- **Maximum**: 32,505,852 bytes (~32 MB)
- **Recommended Batch**: 1,000,000 bytes (~1 MB)
- **Game History Batch**: 100 games per blob

### Blob Structure

```javascript
{
  type: 'game_history_batch',
  timestamp: 1234567890,
  games: [...], // Array of game results
  totalGames: 100,
  version: '1.0'
}
```

## DA Client Node Requirements

### Hardware
- **Memory**: 8 GB
- **CPU**: 2 cores
- **Bandwidth**: 100 MBps

### Software
- Docker
- Private key with OG tokens for gas

## Production Setup

### 1. DA Client Node Deployment

```bash
# Production environment
docker run -d \
  --env-file /path/to/prod-envfile.env \
  --name 0g-da-client-prod \
  -v /data/0g-da:/runtime \
  -p 51001:51001 \
  --restart unless-stopped \
  0g-da-client combined
```

### 2. Monitoring

```bash
# Check logs
docker logs -f 0g-da-client

# Check status
curl http://localhost:51001/health
```

### 3. gRPC Client Integration

The integration uses gRPC client for production:

```javascript
// gRPC client is already integrated in OGDAClient.js
import ogDAClient from '@/services/OGDAClient';

await ogDAClient.initialize();
const result = await ogDAClient.disperseBlob(blobData);
```

## Troubleshooting

### DA Client Not Available

**Problem**: `DA Client node not configured`
**Solution**: 
1. Run DA Client node
2. Set `NEXT_PUBLIC_0G_DA_CLIENT_URL` environment variable
3. Check status: `GET /api/og-da/status`

### Blob Size Exceeded

**Problem**: Blob size too large
**Solution**: 
- Reduce batch sizes
- Use compression
- Optimize data

### gRPC Connection Issues

**Problem**: Cannot connect to DA Client
**Solution**:
- Check that DA Client node is running
- Check that port 51001 is open
- Check firewall settings

## Production Checklist

- ✅ **gRPC Client**: JavaScript/TypeScript gRPC client integrated
- ✅ **Batch Processing**: Game history batches optimized (automatic chunking, parallel submission)
- ✅ **Real Implementation**: All mock/placeholder code removed
- ⏳ **DA Client Node Setup**: DA Client node setup required for production
- ⏳ **Monitoring**: DA submission monitoring can be added
- ⏳ **Retrieval Testing**: Blob retrieval should be tested in production

## Resources

- [0G DA Integration Guide](0g-doc-main/docs/developer-hub/building-on-0g/da-integration.md)
- [0G DA Technical Deep Dive](0g-doc-main/docs/developer-hub/building-on-0g/da-deep-dive.md)
- [DA Client Repository](https://github.com/0gfoundation/0g-da-client)
- [DA Example Repository](https://github.com/0gfoundation/0g-da-example-rust)

## Notes

- **Production Ready**: All mock/placeholder code has been removed. Real gRPC client is used.
- **gRPC Client**: Real DA Client integration implemented using `@grpc/grpc-js` and `@grpc/proto-loader`.
- **Batch Processing**: Optimized batch processing with automatic chunking and parallel submission support.
- **Cost**: BLOB_PRICE is paid for blob submission (usually 0 on testnet).
- **Scalability**: Large datasets can be stored efficiently with DA (max 32 MB per blob).

## Testing

```bash
# Test script
npm run test:og-da
# or
node scripts/test-og-da.js
```

This script:
- Tests DA Client connection
- Tests blob submission
- Tests game history batch submission
