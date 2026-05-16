import { NextResponse } from 'next/server';

/**
 * Public treasury EVM address for client-side deposits when NEXT_PUBLIC_* inlining fails.
 * Safe: this address is already public in the UI when configured.
 */
export async function GET() {
  const address = (
    process.env.TREASURY_ADDRESS ||
    process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
    ''
  )
    .trim()
    .replace(/^['"]|['"]$/g, '');

  if (!address) {
    return NextResponse.json({ address: null }, { status: 200 });
  }

  return NextResponse.json({ address }, { status: 200 });
}
