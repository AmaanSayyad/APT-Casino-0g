"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import GameHistoryList from "@/components/GameHistory/GameHistoryList";
import { getUserHistory } from "@/utils/gameHistory";
import ConnectWalletButton from "@/components/ConnectWalletButton";

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserHistory(address, {
        limit: 50,
        offset: 0,
        includeVrfDetails: false,
      });
      setGames(data?.games || []);
    } catch (e) {
      setError(e?.message || "Failed to load history");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) load();
    else {
      setGames([]);
      setError(null);
    }
  }, [isConnected, address, load]);

  return (
    <div className="min-h-screen bg-sharp-black text-white pt-10 pb-16 px-4 sm:px-8 md:pt-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-magic to-blue-magic">
            Game history
          </h1>
          <p className="text-white/65 mt-2 max-w-2xl">
            Your results and Pyth Entropy verification details when stored in the
            history database.
          </p>
        </div>

        {!isConnected ? (
          <div className="rounded-xl border border-purple-500/25 bg-black/40 backdrop-blur-sm p-10 text-center max-w-md mx-auto">
            <p className="text-white/80 mb-6">
              Connect your wallet to load on-chain gaming history.
            </p>
            <div className="flex justify-center">
              <ConnectWalletButton />
            </div>
          </div>
        ) : (
          <GameHistoryList
            games={games}
            gameType="ALL"
            loading={loading}
            error={error}
          />
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-white/70 border-t border-white/10 pt-10">
          <div>
            <h3 className="font-semibold text-white mb-2">Provably fair</h3>
            <p>
              Games use Pyth Entropy where configured; proofs show on supported
              explorers.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Verification</h3>
            <p>
              Open entropy and oracle transaction links from each history card
              when available.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Database</h3>
            <p>
              History requires a configured Postgres backend. Without it, this
              list stays empty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
