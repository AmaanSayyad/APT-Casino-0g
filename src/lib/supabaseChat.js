/**
 * chat_messages helpers — supports schema with or without wallet_address column.
 */

const EMBED_PREFIX = '{"__apt":1,"w":';

export function normalizeChatRow(row) {
  if (!row) return row;
  if (row.wallet_address) return row;
  const raw = row.content ?? '';
  if (raw.startsWith(EMBED_PREFIX)) {
    try {
      const p = JSON.parse(raw);
      if (p.__apt === 1 && typeof p.m === 'string') {
        return { ...row, wallet_address: p.w || 'guest', content: p.m };
      }
    } catch {
      /* plain text */
    }
  }
  return { ...row, wallet_address: 'guest', content: raw };
}

export function buildChatInsert(walletAddress, content) {
  const wallet = walletAddress || 'guest';
  return {
    wallet_address: wallet,
    content,
  };
}

export function buildChatInsertFallback(walletAddress, content) {
  const wallet = walletAddress || 'guest';
  return {
    content: JSON.stringify({ __apt: 1, w: wallet, m: content }),
  };
}

export function isWalletColumnError(error) {
  const msg = error?.message || '';
  return msg.includes('wallet_address');
}
