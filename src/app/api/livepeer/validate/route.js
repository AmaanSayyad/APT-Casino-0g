import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * HEAD/GET a Livepeer HLS manifest so the Live page can verify a playback ID or URL.
 */
export async function GET(request) {
  const id = request.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
  }

  try {
    const isUrl = /^https?:\/\//i.test(id);
    const url = isUrl ? id : `https://livepeercdn.com/hls/${id}/index.m3u8`;

    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: '*/*' },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    clearTimeout(t);

    const ok = res.ok && (res.status === 200 || res.status === 206);
    return NextResponse.json({ ok, status: res.status });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Validation failed' },
      { status: 502 }
    );
  }
}
