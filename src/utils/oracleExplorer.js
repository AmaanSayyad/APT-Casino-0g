/**
 * Client-safe URLs for entropy oracle txs (chain explorer + Pyth dashboard).
 * Configure NEXT_PUBLIC_ORACLE_TX_EXPLORER and NEXT_PUBLIC_PYTH_CHAIN_SLUG in .env.
 */

function stripTrailingSlash(url) {
  return (url && String(url).replace(/\/$/, '')) || '';
}

export function getOracleTxExplorerBase() {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_ORACLE_TX_EXPLORER);
}

/** Link to the chain explorer tx page (entropy commitments). */
export function oracleTxUrl(txHash) {
  const base = getOracleTxExplorerBase();
  if (!base || !txHash) return '';
  return `${base}/tx/${txHash}`;
}

/** Slug required by Pyth Entropy Explorer (?chain=...); set per Pyth docs. */
export function getPythEntropyChainSlug() {
  return process.env.NEXT_PUBLIC_PYTH_CHAIN_SLUG || '';
}

/**
 * Returns true only when the URL contains an actual tx hash path segment.
 * Filters out fallback base-URL-only strings like "https://sepolia.arbiscan.io/".
 */
export function isRealTxExplorerUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('/tx/') && url.replace(/.*\/tx\//, '').length > 10;
}

export function pythEntropyDashboardSearchUrl(txHash) {
  const slug = getPythEntropyChainSlug();
  const base = 'https://entropy-explorer.pyth.network';
  if (!txHash) return `${base}/`;
  if (slug) {
    return `${base}/?chain=${encodeURIComponent(slug)}&search=${encodeURIComponent(txHash)}`;
  }
  return `${base}/?search=${encodeURIComponent(txHash)}`;
}
