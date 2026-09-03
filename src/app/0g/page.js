'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Wave3ProofPage() {
  const [proof, setProof] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/wave3-proof')
      .then((res) => res.json())
      .then(setProof)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="min-h-screen bg-[#0A0008] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">0G Bridge Wave 3</p>
        <h1 className="text-4xl font-semibold">APT-Casino on 0G Mainnet</h1>
        <p className="text-white/70 max-w-2xl">
          Provably fair GameFi casino using 0G Chain, Compute, Storage, and DA.
          This page is the Wave 3 integration proof for judges.
          {' '}
          <a className="text-cyan-400 underline" href="https://youtu.be/1QGwBnbokOw" target="_blank" rel="noreferrer">
            Watch the demo
          </a>
          .
        </p>

        {error && <p className="text-red-400">{error}</p>}
        {!proof && !error && <p className="text-white/60">Loading on-chain proof…</p>}

        {proof && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
              <h2 className="text-xl font-medium">0G Chain</h2>
              <p>Network: {proof.chain.name}</p>
              <p>Chain ID: {proof.chain.chainId}</p>
              <p>Mainnet required (16661): {proof.chain.isMainnet ? 'Yes' : 'No'}</p>
              <p>
                Contract: {proof.contract.address || 'Not configured'}
              </p>
              {proof.contract.explorerUrl && (
                <a
                  className="text-cyan-400 underline"
                  href={proof.contract.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open GameLogger on 0G Explorer
                </a>
              )}
              {proof.contract.stats && (
                <p>Total on-chain game logs: {proof.contract.stats.totalLogs}</p>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
              <h2 className="text-xl font-medium">0G Modules</h2>
              {proof.modules.map((module) => (
                <div key={module.name} className="border-b border-white/10 pb-3 last:border-0">
                  <p className="font-medium">{module.name} — {module.status}</p>
                  <p className="text-white/60 text-sm">{module.proof}</p>
                </div>
              ))}
            </section>

            <div className="flex flex-wrap gap-4">
              <a
                className="text-cyan-400 underline"
                href="https://youtu.be/1QGwBnbokOw"
                target="_blank"
                rel="noreferrer"
              >
                Demo video
              </a>
              <Link href="/" className="text-cyan-400 underline">Back to casino</Link>
              <Link href="/game/mines" className="text-cyan-400 underline">Play Mines</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
