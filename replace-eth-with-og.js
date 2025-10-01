#!/usr/bin/env node

/**
 * Script to replace ETH references with OG in frontend files
 * This script will replace ETH token references while preserving ethers.js and Ethereum network references
 */

const fs = require('fs');
const path = require('path');

// Files and directories to process
const TARGET_DIRS = [
  'src/components',
  'src/app',
  'src/hooks',
  'src/utils',
  'src/services'
];

// File extensions to process
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patterns to replace (ETH token references, not ethers.js or Ethereum network)
const REPLACEMENT_PATTERNS = [
  // Currency/token references
  { pattern: /(\s|^|"|'|`|>)ETH(\s|$|"|'|`|<|\.|\,|\!|\?)/g, replacement: '$1OG$2' },
  { pattern: /"ETH"/g, replacement: '"OG"' },
  { pattern: /'ETH'/g, replacement: "'OG'" },
  { pattern: /`ETH`/g, replacement: '`OG`' },
  
  // Balance and amount displays
  { pattern: /(\d+\.?\d*)\s*ETH/g, replacement: '$1 OG' },
  { pattern: /ETH\s*balance/gi, replacement: 'OG balance' },
  { pattern: /ETH\s*amount/gi, replacement: 'OG amount' },
  { pattern: /ETH\s*token/gi, replacement: 'OG token' },
  { pattern: /ETH\s*price/gi, replacement: 'OG price' },
  { pattern: /ETH\s*pool/gi, replacement: 'OG pool' },
  { pattern: /ETH\s*APY/gi, replacement: 'OG APY' },
  
  // UI text
  { pattern: /Deposit\s+ETH/gi, replacement: 'Deposit OG' },
  { pattern: /Withdraw\s+ETH/gi, replacement: 'Withdraw OG' },
  { pattern: /Transfer\s+ETH/gi, replacement: 'Transfer OG' },
  { pattern: /Send\s+ETH/gi, replacement: 'Send OG' },
  { pattern: /Receive\s+ETH/gi, replacement: 'Receive OG' },
  
  // Comments and descriptions
  { pattern: /(\s|^)ETH(\s+)(minimum|maximum|limit|fee)/gi, replacement: '$1OG$2$3' },
  { pattern: /(\s|^)ETH(\s+)(from|to|in|on)/gi, replacement: '$1OG$2$3' },
  
  // Specific patterns found in the codebase
  { pattern: /symbol:\s*['"`]ETH['"`]/g, replacement: "symbol: 'OG'" },
  { pattern: /name:\s*['"`]Ethereum['"`]/g, replacement: "name: 'OG'" },
  { pattern: /Total\s+ETH\s+Pool/gi, replacement: 'Total OG Pool' },
  { pattern: /ETH\s+Token\s+Performance/gi, replacement: 'OG Token Performance' },
  { pattern: /invest\s+in\s+ETH/gi, replacement: 'invest in OG' },
  { pattern: /Stake\s+ETH/gi, replacement: 'Stake OG' },
  { pattern: /won\s+over\s+(\d+)\s+ETH/gi, replacement: 'won over $1 OG' },
  { pattern: /borrow\s+ETH/gi, replacement: 'borrow OG' },
  { pattern: /(\d+)\s+ETH\s+tokens/gi, replacement: '$1 OG tokens' },
];

// Patterns to EXCLUDE (preserve these)
const EXCLUDE_PATTERNS = [
  /ethers\./g,
  /ethereum\./g,
  /window\.ethereum/g,
  /Ethereum\s+(address|network|blockchain|testnet|mainnet)/gi,
  /eth_/g,
  /method.*eth/gi,
  /\.eth/g,
  /etherscan/gi,
  /getEtherscanUrl/g,
  /formatEthAmount/g,
  /ethereumClient/g,
  /EthereumConnectWalletButton/g,
  /useEthereumCasino/g,
  /ArbitrumCoin|EthereumCoin/g,
  /import.*ethers/g,
  /from.*ethers/g,
];

let totalFilesProcessed = 0;
let totalReplacements = 0;

/**
 * Check if a file should be excluded from processing
 */
function shouldExcludeFile(filePath) {
  const excludeFiles = [
    'ethers',
    'ethereum',
    'web3.js',
    'EthereumConnectWalletButton',
    'useEthereumCasino'
  ];
  
  return excludeFiles.some(exclude => filePath.includes(exclude));
}

/**
 * Check if content contains patterns that should be preserved
 */
function shouldPreserveContent(content, line) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(line));
}

/**
 * Process a single file
 */
function processFile(filePath) {
  if (shouldExcludeFile(filePath)) {
    console.log(`⏭️  Skipping: ${filePath} (excluded file)`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileReplacements = 0;

    // Process line by line to avoid replacing in excluded contexts
    const lines = content.split('\n');
    const newLines = lines.map(line => {
      // Skip lines that should be preserved
      if (shouldPreserveContent(content, line)) {
        return line;
      }

      let newLine = line;
      
      // Apply replacement patterns
      REPLACEMENT_PATTERNS.forEach(({ pattern, replacement }) => {
        const matches = newLine.match(pattern);
        if (matches) {
          newLine = newLine.replace(pattern, replacement);
          fileReplacements += matches.length;
        }
      });

      return newLine;
    });

    newContent = newLines.join('\n');

    // Only write if there were changes
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Processed: ${filePath} (${fileReplacements} replacements)`);
      totalReplacements += fileReplacements;
    }

    totalFilesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Recursively process directory
 */
function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Skip node_modules and other unwanted directories
      if (!item.startsWith('.') && item !== 'node_modules') {
        processDirectory(itemPath);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (FILE_EXTENSIONS.includes(ext)) {
        processFile(itemPath);
      }
    }
  });
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting ETH to OG replacement...\n');

  TARGET_DIRS.forEach(dir => {
    console.log(`📁 Processing directory: ${dir}`);
    processDirectory(dir);
    console.log('');
  });

  console.log('📊 Summary:');
  console.log(`   Files processed: ${totalFilesProcessed}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  console.log('✅ ETH to OG replacement completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, processDirectory };