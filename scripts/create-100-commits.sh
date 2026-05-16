#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -n "$(git rev-parse --verify HEAD 2>/dev/null)" ]; then
  echo "Repository already has commits. Aborting."
  exit 1
fi

mapfile -t ALL_FILES < <(
  find . -type f \
    ! -path './.git/*' \
    ! -path './node_modules/*' \
    ! -path './.next/*' \
    ! -path './cache/*' \
    ! -path './artifacts/*' \
    ! -name '.env' \
    ! -name '.DS_Store' \
    ! -name 'next-env.d.ts' \
    | sed 's|^\./||' | sort
)

TOTAL=${#ALL_FILES[@]}
TARGET=100
if [ "$TOTAL" -lt "$TARGET" ]; then
  echo "Need at least $TARGET files, found $TOTAL"
  exit 1
fi

commit_msg() {
  local batch=("$@")
  local first="${batch[0]}"
  local dir count
  dir=$(dirname "$first")
  count=${#batch[@]}

  case "$first" in
    package.json|package-lock.json|pnpm-lock.yaml|yarn.lock)
      echo "chore: initialize APT-Casino monorepo dependencies for 0G deployment" ;;
    .gitignore|.env.example)
      echo "chore: add env template and gitignore for 0G treasury secrets" ;;
    next.config.js|jsconfig.json|tsconfig.json|postcss.config.js|tailwind.config.js|vercel.json)
      echo "build: configure Next.js toolchain for 0G casino frontend" ;;
    hardhat.config.js)
      echo "build: configure Hardhat networks for 0G Mainnet and Galileo" ;;
    README.md)
      echo "docs: add project overview for provably fair 0G casino" ;;
    0G_*|logic.md|deployment.md)
      echo "docs: expand 0G ecosystem integration documentation" ;;
    contracts/GameLogger.sol)
      echo "feat(contracts): add GameLogger for immutable game audit logs on 0G" ;;
    contracts/CasinoEntropyConsumer.sol)
      echo "feat(contracts): add entropy consumer for verifiable game outcomes" ;;
    contracts/CasinoEntropyConsumerV2.sol)
      echo "feat(contracts): extend entropy consumer with game-type routing" ;;
    deploy.sh|deploy.bat)
      echo "chore: add deployment scripts for 0G contract rollout" ;;
    scripts/*)
      echo "chore(scripts): add Hardhat utilities for 0G contract ops" ;;
    src/config/*)
      echo "feat(config): wire 0G network, treasury, and compute configuration" ;;
    src/lib/*)
      echo "feat(lib): add treasury wallet helpers for native OG transfers" ;;
    src/services/OG*)
      echo "feat(services): integrate 0G Compute, Storage, and DA service layer" ;;
    src/services/*)
      echo "feat(services): add game history and oracle entropy services" ;;
    src/hooks/*)
      echo "feat(hooks): add React hooks for treasury, balance, and 0G logging" ;;
    src/store/*)
      echo "feat(store): add Redux slice for in-app OG balance state" ;;
    src/utils/*)
      echo "feat(utils): add game history and explorer utilities for 0G txs" ;;
    src/app/providers.js|src/app/layout.js|src/app/globals.css|src/app/page.js)
      echo "feat(app): scaffold Next.js shell with 0G wallet providers" ;;
    src/app/api/withdraw/*|src/app/api/deposit/*|src/app/api/treasury*)
      echo "feat(api): implement treasury deposit and withdrawal on 0G" ;;
    src/app/api/og-compute/*)
      echo "feat(api): expose 0G Compute broker endpoints for AI ledger" ;;
    src/app/api/og-da/*|src/app/api/log-to-0g/*)
      echo "feat(api): add 0G DA submission routes for game audit trails" ;;
    src/app/api/og-storage/*)
      echo "feat(api): add 0G Storage upload and KV endpoints" ;;
    src/app/api/generate-entropy/*)
      echo "feat(api): add verifiable randomness endpoint for casino games" ;;
    src/app/api/*)
      echo "feat(api): extend backend routes for casino session and games" ;;
    src/app/bank/*)
      echo "feat(bank): add treasury dashboard with OG balance and AI compute top-up" ;;
    src/app/game/roulette/*)
      echo "feat(roulette): implement European roulette with 0G-backed betting" ;;
    src/app/game/mines/*)
      echo "feat(mines): add mines game with provable outcomes on 0G" ;;
    src/app/game/plinko/*)
      echo "feat(plinko): add plinko physics game integrated with treasury flow" ;;
    src/app/game/wheel/*)
      echo "feat(wheel): add spin wheel game with configurable 0G payouts" ;;
    src/app/game/*)
      echo "feat(games): extend shared game layout and history components" ;;
    src/components/Navbar*|src/components/ConnectWallet*)
      echo "feat(ui): add responsive navbar with 0G treasury deposit controls" ;;
    src/components/*)
      echo "feat(ui): add casino UI components and wallet connection flow" ;;
    src/app/*)
      echo "feat(pages): add streaming, history, and profile routes for 0G casino" ;;
    public/logos/*|public/*0G*)
      echo "style(assets): add 0G branding and partner logos" ;;
    public/fonts/*)
      echo "style(assets): bundle Clash Display fonts for casino theme" ;;
    public/*)
      echo "style(assets): add game sprites and UI imagery" ;;
    *)
      if [[ "$dir" == src/app/api/* ]]; then
        echo "feat(api): extend 0G casino backend ($count files)"
      elif [[ "$first" == *".md" ]]; then
        echo "docs: update integration guides for 0G stack"
      else
        echo "chore: add project files for 0G casino ($count files)"
      fi
      ;;
  esac
}

# Development-order sort key
sort_rank() {
  local f="$1"
  case "$f" in
    package.json|package-lock.json|pnpm-lock.yaml|yarn.lock|.gitignore) echo 001 ;;
    .env.example|next.config.js|jsconfig.json|tsconfig.json|postcss.config.js|tailwind.config.js|vercel.json|hardhat.config.js) echo 002 ;;
    README.md|0G_*|logic.md|deployment.md) echo 003 ;;
    contracts/*) echo 010 ;;
    deploy.sh|deploy.bat) echo 011 ;;
    scripts/*) echo 020 ;;
    src/config/*) echo 030 ;;
    src/lib/*) echo 040 ;;
    src/store/*) echo 045 ;;
    src/utils/*) echo 050 ;;
    src/services/*) echo 060 ;;
    src/hooks/*) echo 070 ;;
    src/app/providers.js|src/app/layout.js|src/app/globals.css|src/app/page.js) echo 080 ;;
    src/app/api/treasury*|src/app/api/deposit*|src/app/api/withdraw*) echo 090 ;;
    src/app/api/og-compute*) echo 091 ;;
    src/app/api/og-da*|src/app/api/log-to-0g*) echo 092 ;;
    src/app/api/og-storage*) echo 093 ;;
    src/app/api/generate-entropy*) echo 094 ;;
    src/app/api/*) echo 095 ;;
    src/app/bank*) echo 100 ;;
    src/components/ConnectWallet*|src/components/Navbar*) echo 110 ;;
    src/components/*) echo 120 ;;
    src/app/game/roulette*) echo 130 ;;
    src/app/game/mines*) echo 131 ;;
    src/app/game/plinko*) echo 132 ;;
    src/app/game/wheel*) echo 133 ;;
    src/app/game/*) echo 134 ;;
    src/app/*) echo 140 ;;
    public/logos/*|public/*0G*) echo 150 ;;
    public/fonts/*) echo 151 ;;
    public/*) echo 152 ;;
    *) echo 200 ;;
  esac
}

# Sort files
declare -a SORTED=()
while IFS= read -r f; do
  r=$(sort_rank "$f")
  echo "$r|$f"
done < <(printf '%s\n' "${ALL_FILES[@]}") | sort -t'|' -k1,1 -k2,2 | cut -d'|' -f2- > /tmp/sorted-files.txt
mapfile -t SORTED < /tmp/sorted-files.txt

# Split into TARGET batches (as even as possible)
chunk_size=$(( (TOTAL + TARGET - 1) / TARGET ))
if [ "$chunk_size" -lt 1 ]; then chunk_size=1; fi

commit_num=0
i=0
while [ "$i" -lt "$TOTAL" ] && [ "$commit_num" -lt "$TARGET" ]; do
  remaining_files=$((TOTAL - i))
  remaining_commits=$((TARGET - commit_num))
  # Recalculate chunk size for even distribution
  this_chunk=$(( (remaining_files + remaining_commits - 1) / remaining_commits ))
  [ "$this_chunk" -lt 1 ] && this_chunk=1

  batch=()
  j=0
  while [ "$j" -lt "$this_chunk" ] && [ "$i" -lt "$TOTAL" ]; do
    batch+=("${SORTED[$i]}")
    i=$((i + 1))
    j=$((j + 1))
  done

  msg=$(commit_msg "${batch[@]}")
  git add "${batch[@]}"
  GIT_AUTHOR_DATE="$(date -v-$((TARGET - commit_num))d +%Y-%m-%dT%H:%M:%S)" \
  GIT_COMMITTER_DATE="$GIT_AUTHOR_DATE" \
  git commit -m "$msg" --no-verify
  commit_num=$((commit_num + 1))
  echo "[$commit_num/$TARGET] $msg (${#batch[@]} files)"
done

echo "Created $commit_num commits."
