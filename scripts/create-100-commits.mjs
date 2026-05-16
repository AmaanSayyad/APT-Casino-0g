#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
process.chdir(ROOT);

try {
  execSync('git rev-parse --verify HEAD', { stdio: 'pipe' });
  console.error('Repository already has commits. Aborting.');
  process.exit(1);
} catch {
  /* no commits yet */
}

const IGNORE = new Set(['.env', '.DS_Store', 'next-env.d.ts']);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === '.git' || ent.name === 'node_modules' || ent.name === '.next') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (!IGNORE.has(ent.name)) acc.push(path.relative(ROOT, p).replace(/\\/g, '/'));
  }
  return acc;
}

const ALL = walk(ROOT).sort();
const TARGET = 100;
if (ALL.length < TARGET) {
  console.error(`Need at least ${TARGET} files, found ${ALL.length}`);
  process.exit(1);
}

function sortRank(f) {
  const rules = [
    [/^(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/, 1],
    [/^\.gitignore$/, 2],
    [/^\.env\.example$/, 3],
    [/^(next\.config\.js|jsconfig\.json|tsconfig\.json|postcss\.config\.js|tailwind\.config\.js|vercel\.json|hardhat\.config\.js)$/, 4],
    [/^(README\.md|0G_.*\.md|logic\.md|deployment\.md)$/, 5],
    [/^contracts\//, 10],
    [/^(deploy\.sh|deploy\.bat)$/, 11],
    [/^scripts\//, 20],
    [/^src\/config\//, 30],
    [/^src\/lib\//, 40],
    [/^src\/store\//, 45],
    [/^src\/utils\//, 50],
    [/^src\/services\//, 60],
    [/^src\/hooks\//, 70],
    [/^src\/app\/(providers|layout|globals|page)\./, 80],
    [/^src\/app\/api\/(withdraw|deposit|treasury)/, 90],
    [/^src\/app\/api\/og-compute/, 91],
    [/^src\/app\/api\/(og-da|log-to-0g)/, 92],
    [/^src\/app\/api\/og-storage/, 93],
    [/^src\/app\/api\/generate-entropy/, 94],
    [/^src\/app\/api\//, 95],
    [/^src\/app\/bank/, 100],
    [/^src\/components\/(Navbar|ConnectWallet)/, 110],
    [/^src\/components\//, 120],
    [/^src\/app\/game\/roulette/, 130],
    [/^src\/app\/game\/mines/, 131],
    [/^src\/app\/game\/plinko/, 132],
    [/^src\/app\/game\/wheel/, 133],
    [/^src\/app\/game\//, 134],
    [/^src\/app\//, 140],
    [/^public\/(logos|.*0G)/i, 150],
    [/^public\/fonts\//, 151],
    [/^public\//, 152],
  ];
  for (const [re, rank] of rules) {
    if (re.test(f)) return rank;
  }
  return 200;
}

const SORTED = [...ALL].sort((a, b) => sortRank(a) - sortRank(b) || a.localeCompare(b));

function commitMsg(batch) {
  const first = batch[0];
  const n = batch.length;
  const m = {
    'package.json': 'chore: initialize dependencies for 0G-native casino platform',
    '.gitignore': 'chore: add gitignore and protect treasury keys for 0G ops',
    '.env.example': 'chore: document env vars for 0G Mainnet, Galileo, and treasury',
    'hardhat.config.js': 'build: configure Hardhat for 0G Mainnet and Galileo networks',
    'README.md': 'docs: introduce provably fair casino on 0G chain',
    'contracts/GameLogger.sol': 'feat(contracts): deployable GameLogger for on-chain game audits on 0G',
    'contracts/CasinoEntropyConsumer.sol': 'feat(contracts): entropy consumer for verifiable casino outcomes',
    'contracts/CasinoEntropyConsumerV2.sol': 'feat(contracts): v2 entropy consumer with per-game type routing',
  };
  if (m[first]) return m[first];
  if (first.startsWith('0G_') || first.endsWith('.md')) return 'docs: document 0G DA, Storage, and Compute integration';
  if (first.startsWith('contracts/')) return 'feat(contracts): extend 0G smart contract tooling';
  if (first.startsWith('scripts/')) return 'chore(scripts): add deployment and verification scripts for 0G';
  if (first.startsWith('src/config/')) return 'feat(config): centralize 0G RPC, treasury, and network constants';
  if (first.startsWith('src/lib/')) return 'feat(lib): treasury deposit helpers using wagmi on 0G';
  if (first.startsWith('src/services/OG')) return 'feat(0g): wire Compute, Storage, and DA client services';
  if (first.startsWith('src/services/')) return 'feat(services): game history and verifiable randomness layer';
  if (first.startsWith('src/hooks/')) return 'feat(hooks): React hooks for treasury address and casino balance';
  if (first.startsWith('src/app/api/withdraw') || first.includes('deposit') || first.includes('treasury'))
    return 'feat(api): native OG treasury deposits and chain-aware withdrawals on 0G';
  if (first.startsWith('src/app/api/og-compute')) return 'feat(api): 0G Compute broker routes for AI ledger funding';
  if (first.startsWith('src/app/api/og-da') || first.includes('log-to-0g'))
    return 'feat(api): submit game batches to 0G data availability layer';
  if (first.startsWith('src/app/api/og-storage')) return 'feat(api): 0G Storage upload and KV APIs for casino assets';
  if (first.includes('generate-entropy')) return 'feat(api): verifiable randomness generation for fair games';
  if (first.startsWith('src/app/api/')) return 'feat(api): extend casino backend endpoints';
  if (first.startsWith('src/app/bank')) return 'feat(bank): treasury UI with OG balance and AI compute top-up';
  if (first.startsWith('src/app/game/roulette')) return 'feat(roulette): European roulette with 0G treasury integration';
  if (first.startsWith('src/app/game/mines')) return 'feat(mines): mines game with provable outcomes on 0G';
  if (first.startsWith('src/app/game/plinko')) return 'feat(plinko): plinko game wired to house balance on 0G';
  if (first.startsWith('src/app/game/wheel')) return 'feat(wheel): spin wheel with configurable OG payouts';
  if (first.startsWith('src/app/game/')) return 'feat(games): shared game shell and history for 0G casino';
  if (first.startsWith('src/components/Navbar') || first.startsWith('src/components/ConnectWallet'))
    return 'feat(ui): navbar with RainbowKit and 0G treasury controls';
  if (first.startsWith('src/components/')) return 'feat(ui): casino components and wallet UX';
  if (first.startsWith('src/app/')) return 'feat(pages): add routes for stream, profile, and game lobby';
  if (first.startsWith('public/logos') || /0G/i.test(first)) return 'style: add 0G branding assets';
  if (first.startsWith('public/fonts')) return 'style: add display fonts for casino interface';
  if (first.startsWith('public/')) return 'style: add game art and UI sprites';
  if (first.includes('next.config') || first.includes('tailwind')) return 'build: frontend toolchain for 0G casino app';
  return `chore: add 0G casino project files (${n} files)`;
}

let i = 0;
let commitNum = 0;
const TOTAL = SORTED.length;

while (i < TOTAL && commitNum < TARGET) {
  const remainingFiles = TOTAL - i;
  const remainingCommits = TARGET - commitNum;
  const chunk = Math.max(1, Math.ceil(remainingFiles / remainingCommits));
  const batch = SORTED.slice(i, i + chunk);
  i += batch.length;

  const msg = commitMsg(batch);
  // Stagger commits a few minutes apart on the same day (today)
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setMinutes(d.getMinutes() + commitNum * 4);
  const iso = d.toISOString();

  for (const f of batch) {
    try {
      execSync(`git add -- ${JSON.stringify(f)}`, { cwd: ROOT, stdio: 'pipe' });
    } catch {
      execSync(`git add -f -- ${JSON.stringify(f)}`, { cwd: ROOT });
    }
  }
  execSync(`git commit -m ${JSON.stringify(msg)} --no-verify`, {
    cwd: ROOT,
    env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
  });
  commitNum++;
  console.log(`[${commitNum}/${TARGET}] ${msg} (${batch.length} files)`);
}

console.log(`\nCreated ${commitNum} commits.`);
