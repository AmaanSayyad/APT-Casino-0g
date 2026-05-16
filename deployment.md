> **Note:** This file documents an earlier **Aptos Move** module layout. The current app uses **EVM on 0G** (wagmi, treasury EOA, optional `GameLogger` Solidity contract). For setup and env vars, see [README.md](./README.md) and [`.env.example`](./.env.example).

---

## Current EVM deployment (0G)

| Item | Command / location |
|------|------------------|
| Live app (Vercel) | https://apt-casino-0g-gamma.vercel.app/ |
| GameLogger on 0G | `npm run deploy:game-logger:mainnet` or `deploy:game-logger` (Galileo) |
| Pyth entropy consumer | `npm run deploy:pyth-entropy` (Arbitrum Sepolia) |
| Treasury | Set `TREASURY_ADDRESS` + `TREASURY_PRIVATE_KEY` in `.env` |
| Mainnet GameLogger (deployed) | `0xaca996a4d49e7ed42da68a20600f249be6d024a4` — set `NEXT_PUBLIC_GAME_LOGGER_CONTRACT_MAINNET` |
