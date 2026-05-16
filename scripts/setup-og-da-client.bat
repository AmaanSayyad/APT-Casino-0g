@echo off
REM 0G DA Client Node Setup Script for Windows
REM This script sets up a 0G DA Client node for the casino application

echo 🚀 Setting up 0G DA Client Node...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

REM Create directory for DA Client
set DA_CLIENT_DIR=.\da-client
if not exist "%DA_CLIENT_DIR%" (
    echo 📁 Creating DA Client directory...
    mkdir "%DA_CLIENT_DIR%"
)

cd "%DA_CLIENT_DIR%"

REM Clone DA Client repository if not exists
if not exist "0g-da-client" (
    echo 📥 Cloning 0G DA Client repository...
    git clone https://github.com/0gfoundation/0g-da-client.git
)

cd 0g-da-client

REM Build Docker image
echo 🔨 Building DA Client Docker image...
docker build -t 0g-da-client -f combined.Dockerfile .

REM Create environment file
echo 📝 Creating environment file...
(
echo # 0G DA Client Configuration
echo COMBINED_SERVER_CHAIN_RPC=https://evmrpc-testnet.0g.ai
echo COMBINED_SERVER_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
echo ENTRANCE_CONTRACT_ADDR=0x857C0A28A8634614BB2C96039Cf4a20AFF709Aa9
echo.
echo COMBINED_SERVER_RECEIPT_POLLING_ROUNDS=180
echo COMBINED_SERVER_RECEIPT_POLLING_INTERVAL=1s
echo COMBINED_SERVER_TX_GAS_LIMIT=2000000
echo COMBINED_SERVER_USE_MEMORY_DB=true
echo COMBINED_SERVER_KV_DB_PATH=/runtime/
echo COMBINED_SERVER_TimeToExpire=2592000
echo DISPERSER_SERVER_GRPC_PORT=51001
echo BATCHER_DASIGNERS_CONTRACT_ADDRESS=0x0000000000000000000000000000000000001000
echo BATCHER_FINALIZER_INTERVAL=20s
echo BATCHER_CONFIRMER_NUM=3
echo BATCHER_MAX_NUM_RETRIES_PER_BLOB=3
echo BATCHER_FINALIZED_BLOCK_COUNT=50
echo BATCHER_BATCH_SIZE_LIMIT=500
echo BATCHER_ENCODING_INTERVAL=3s
echo BATCHER_ENCODING_REQUEST_QUEUE_SIZE=1
echo BATCHER_PULL_INTERVAL=10s
echo BATCHER_SIGNING_INTERVAL=3s
echo BATCHER_SIGNED_PULL_INTERVAL=20s
echo BATCHER_EXPIRATION_POLL_INTERVAL=3600
echo BATCHER_ENCODER_ADDRESS=DA_ENCODER_SERVER
echo BATCHER_ENCODING_TIMEOUT=300s
echo BATCHER_SIGNING_TIMEOUT=60s
echo BATCHER_CHAIN_READ_TIMEOUT=12s
echo BATCHER_CHAIN_WRITE_TIMEOUT=13s
) > ..\envfile.env

echo.
echo ⚠️  IMPORTANT: Edit ..\envfile.env and add your TREASURY_PRIVATE_KEY
echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Edit ..\envfile.env and add your private key
echo 2. Run: docker run -d --env-file ..\envfile.env --name 0g-da-client -v ./run:/runtime -p 51001:51001 0g-da-client combined
echo 3. Check logs: docker logs 0g-da-client
echo 4. Update NEXT_PUBLIC_0G_DA_CLIENT_URL in .env to point to your DA Client

cd ..\..

