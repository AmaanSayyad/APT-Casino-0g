const fs = require('fs');

const filePath = 'src/hooks/useWalletStatus.js';
const content = fs.readFileSync(filePath, 'utf8');

const newContent = content.replace(
  /name: 'Arbitrum Sepolia'/g,
  "name: '0G Network Testnet'"
);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ Fixed useWalletStatus.js');