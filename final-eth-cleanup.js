#!/usr/bin/env node

/**
 * Final cleanup script for remaining ETH references
 */

const fs = require('fs');
const path = require('path');

// Specific replacements for remaining cases
const SPECIFIC_REPLACEMENTS = [
  // Variable names
  { pattern: /balanceInEth/g, replacement: 'balanceInOg' },
  { pattern: /getCurrentBalanceInETH/g, replacement: 'getCurrentBalanceInOG' },
  { pattern: /valueEth/g, replacement: 'valueOg' },
  
  // Comments and strings that were missed
  { pattern: /\/\/ .*ETH.*/g, replacement: (match) => match.replace(/ETH/g, 'OG') },
  { pattern: /\/\* .*ETH.*\*\//g, replacement: (match) => match.replace(/ETH/g, 'OG') },
  { pattern: /'ETH'/g, replacement: "'OG'" },
  { pattern: /"ETH"/g, replacement: '"OG"' },
  
  // Specific patterns found
  { pattern: /formatEther\(.*\)\s*ETH/g, replacement: (match) => match.replace('ETH', 'OG') },
  { pattern: /(\d+\.?\d*)\s*ETH/g, replacement: '$1 OG' },
  { pattern: /symbol:\s*'ETH'/g, replacement: "symbol: 'OG'" },
  { pattern: /name:\s*'Ethereum'/g, replacement: "name: 'OG'" },
];

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let hasChanges = false;

    SPECIFIC_REPLACEMENTS.forEach(({ pattern, replacement }) => {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  const items = fs.readdirSync(dirPath);
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(itemPath);
    } else if (stat.isFile() && ['.js', '.jsx', '.ts', '.tsx'].includes(path.extname(item))) {
      processFile(itemPath);
    }
  });
}

console.log('🧹 Final ETH cleanup...');
['src/components', 'src/app', 'src/hooks', 'src/utils', 'src/services'].forEach(dir => {
  processDirectory(dir);
});
console.log('✅ Final cleanup completed!');