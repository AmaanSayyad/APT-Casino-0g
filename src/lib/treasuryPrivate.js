/**
 * Server-only treasury secret. Never import from client components.
 */

export function getTreasuryPrivateKeyOrNull() {
  const k = process.env.TREASURY_PRIVATE_KEY?.trim();
  return k || null;
}

export function requireTreasuryPrivateKey() {
  const k = getTreasuryPrivateKeyOrNull();
  if (!k) {
    throw new Error('TREASURY_PRIVATE_KEY is not set');
  }
  return k;
}
