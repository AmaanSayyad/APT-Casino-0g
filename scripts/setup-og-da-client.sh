#!/bin/bash

# 0G DA Client Node Setup Script
# This script sets up a 0G DA Client node for the casino application

set -e

echo "🚀 Setting up 0G DA Client Node..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Create directory for DA Client
DA_CLIENT_DIR="./da-client"
if [ ! -d "$DA_CLIENT_DIR" ]; then
    echo "📁 Creating DA Client directory..."
    mkdir -p "$DA_CLIENT_DIR"
fi

cd "$DA_CLIENT_DIR"

# Clone DA Client repository if not exists
if [ ! -d "0g-da-client" ]; then
    echo "📥 Cloning 0G DA Client repository..."
    git clone https://github.com/0gfoundation/0g-da-client.git
fi

cd 0g-da-client

# Build Docker image
echo "🔨 Building DA Client Docker image..."
docker build -t 0g-da-client -f combined.Dockerfile .

# Create environment file
echo "📝 Creating environment file..."
cat > ../envfile.env << EOF
# 0G DA Client Configuration
COMBINED_SERVER_CHAIN_RPC=https://evmrpc-testnet.0g.ai
COMBINED_SERVER_PRIVATE_KEY=${TREASURY_PRIVATE_KEY:-YOUR_PRIVATE_KEY_HERE}
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
EOF

echo "⚠️  IMPORTANT: Edit ../envfile.env and add your TREASURY_PRIVATE_KEY"
echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit ../envfile.env and add your private key"
echo "2. Run: docker run -d --env-file ../envfile.env --name 0g-da-client -v ./run:/runtime -p 51001:51001 0g-da-client combined"
echo "3. Check logs: docker logs 0g-da-client"
echo "4. Update NEXT_PUBLIC_0G_DA_CLIENT_URL in .env to point to your DA Client"

