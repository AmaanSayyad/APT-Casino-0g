# 0G Bridge Wave 3 — APT-Casino

Provably fair GameFi casino on 0G Mainnet with Compute, Storage, and DA.

## Project Information

| Resource | Link |
|---|---|
| Name | APT-Casino |
| One-liner | Non-custodial casino that logs every game on 0G Chain and uses 0G Compute, Storage, and DA for AI + auditability. |
| Live app | [https://apt-casino-0g-gamma.vercel.app](https://apt-casino-0g-gamma.vercel.app) |
| Wave 3 proof | [https://apt-casino-0g-gamma.vercel.app/0g](https://apt-casino-0g-gamma.vercel.app/0g) |
| Proof API | [https://apt-casino-0g-gamma.vercel.app/api/wave3-proof](https://apt-casino-0g-gamma.vercel.app/api/wave3-proof) |
| Demo video | [https://youtu.be/1QGwBnbokOw](https://youtu.be/1QGwBnbokOw) |
| GitHub | [https://github.com/AmaanSayyad/APT-Casino-0g](https://github.com/AmaanSayyad/APT-Casino-0g) |

## Problem

Centralized casinos hide odds, trap deposits behind wager requirements, and keep user funds in custodial wallets. APT-Casino puts play, payouts, and game logs on 0G so outcomes are inspectable on-chain.

## 0G Integration Proof (Wave 3)

Wave 3 requires 0G Chain on **mainnet**. Compute and DA may remain on testnet.

### 0G Chain (Mainnet)

| Item | Value |
|---|---|
| Network | 0G Mainnet |
| Chain ID | `16661` |
| RPC | `https://evmrpc.0g.ai` |
| Contract | `GameLogger` at [`0xac13628e37628E8e8d9238F1564841cf220742a3`](https://chainscan.0g.ai/address/0xac13628e37628E8e8d9238F1564841cf220742a3) |
| Deploy tx | [`0xcb23b1adcab5cfecec10e952bde9887921a647d812d5b729728d8d138b6d3f8f`](https://chainscan.0g.ai/tx/0xcb23b1adcab5cfecec10e952bde9887921a647d812d5b729728d8d138b6d3f8f) |
| Activity tx | [`0x7fac1648037a0d11b0716d93f05cfa5bc0abc352d2318ad5ef124d824f772520`](https://chainscan.0g.ai/tx/0x7fac1648037a0d11b0716d93f05cfa5bc0abc352d2318ad5ef124d824f772520) |
| Live API log tx | [`0x032a460dfe26b4341291308757ae2ab9405af5d64751134e1228041a18db3223`](https://chainscan.0g.ai/tx/0x032a460dfe26b4341291308757ae2ab9405af5d64751134e1228041a18db3223) |
| Deployer / treasury | `0xF7249B507F1f89Eaea5d694cEf5cb96F245Bc5b6` |
| Block (deploy / proof) | `43395250` / `43395260` |

Every game result is written on-chain through `GameLogger.logGame(...)`. The frontend waits for that transaction and surfaces the explorer URL in game history.

### 0G Compute

- SDK: `@0glabs/0g-serving-broker`
- Used by the in-app AI Assistant (`AiModal`) and Mines auto-betting recommendations
- Providers: GPT-OSS-120B and DeepSeek R1 70B
- Network: testnet (allowed for Wave 3)

### 0G Storage

- SDK: `@0glabs/0g-ts-sdk`
- Game history backups, profile blobs, and KV state
- Indexer: `https://indexer-storage-turbo.0g.ai`

### 0G DA

- Game-result blobs submitted via `/api/og-da/submit`
- Allowed to remain on testnet for Wave 3

## Architecture

```
Player
  -> Next.js games (Mines / Roulette / Plinko / Wheel)
  -> Pyth Entropy (provable RNG)
  -> GameLogger on 0G Mainnet (audit log)
  -> 0G Storage (backup) + 0G DA (blob)
  -> 0G Compute (AI assistant + strategy)
```

Local reproduction:

```bash
npm install
cp .env.example .env.local   # fill treasury + public 0G vars
npm run dev
```

Mainnet contract deploy:

```bash
npm run deploy:game-logger:mainnet
```

## Demo

| Resource | Link |
|---|---|
| Demo video | [https://youtu.be/1QGwBnbokOw](https://youtu.be/1QGwBnbokOw) |
| Wave 3 proof | [https://apt-casino-0g-gamma.vercel.app/0g](https://apt-casino-0g-gamma.vercel.app/0g) |
| Proof API | [https://apt-casino-0g-gamma.vercel.app/api/wave3-proof](https://apt-casino-0g-gamma.vercel.app/api/wave3-proof) |

Judges can open `/0g` for live mainnet contract and explorer links.

## What was verified on mainnet

Working:

- Homepage, Mines, Roulette, Plinko, Wheel, Bank, `/0g` all return HTTP 200
- `/api/wave3-proof` reports chain ID `16661` and GameLogger stats
- Production `POST /api/log-to-0g-contract` mined a GameLogger transaction on 0G Mainnet
- 0G Storage indexer responds on mainnet turbo

Not fully E2E (wallet UI):

- A connected-wallet deposit → play → withdraw round was not completed in-browser
- 0G Compute inference currently fails (`could not decode result data`) against the live broker
- 0G DA client is not configured in production (Wave 3 allows DA off mainnet)

## Security

No key-stealer, seed-phrase harvester, trojan, or hidden fund-drainer was found in the app.

- Users connect with RainbowKit/wagmi (MetaMask etc.). The app never asks for a seed phrase or private key.
- House `TREASURY_PRIVATE_KEY` is server-only, used to pay gas for logging/withdrawals. It is not exported on `TREASURY_CONFIG` for the client.
- localStorage only persists wagmi connection flags/address, not keys.

## X Post (required at submit)

Post from the project account with:

- Project name: APT-Casino
- Screenshot or clip of `/0g` or a mainnet explorer tx
- `#0GBridge #BuildOn0G`
- `@0G_labs @0G_Builders @AKINDO_io`
