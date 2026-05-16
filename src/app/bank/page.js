"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import HeaderText from "@/components/HeaderText";
import { useAccount, useBalance, useChainId } from "wagmi";
import { formatEther } from "viem";
import { FaWallet, FaHistory, FaCoins, FaExternalLinkAlt, FaCopy, FaRobot } from "react-icons/fa";
import { useCasinoTreasury } from "@/hooks/useCasinoTreasury";
import { TREASURY_CONFIG, OG_SUPPORTED_CHAIN_IDS } from "@/config/treasury";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useTreasuryAddress } from "@/hooks/useTreasuryAddress";

export default function Bank() {
  const [activeTab, setActiveTab] = useState("treasury");
  const [showBanner, setShowBanner] = useState(true);
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  // Wrong network if connected but not on any supported 0G chain
  const wrongNetwork =
    isConnected && chainId != null && !OG_SUPPORTED_CHAIN_IDS.includes(chainId);

  const { data: walletNative, refetch: refetchWallet } = useBalance({
    address,
  });

  const {
    userBalance,
    isLoadingBalance,
    depositAmount,
    setDepositAmount,
    isDepositing,
    isWithdrawing,
    handleDeposit,
    handleWithdraw,
    refreshHouseBalance,
  } = useCasinoTreasury();

  const [liquidity, setLiquidity] = useState(null);
  const [liquidityError, setLiquidityError] = useState(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyGames, setHistoryGames] = useState([]);
  const [historyMessage, setHistoryMessage] = useState("");

  // AI Compute ledger state
  const [aiBalance, setAiBalance] = useState(null);
  const [aiWalletBalance, setAiWalletBalance] = useState(null);
  const [aiBalanceLoading, setAiBalanceLoading] = useState(false);
  const [aiTopUpAmount, setAiTopUpAmount] = useState("1");
  const [aiTopUpLoading, setAiTopUpLoading] = useState(false);
  const [aiTopUpMsg, setAiTopUpMsg] = useState(null);

  const fetchAiBalance = useCallback(async () => {
    setAiBalanceLoading(true);
    try {
      // Fetch wallet balance (doesn't need broker, always works)
      const wRes = await fetch("/api/og-compute?action=walletBalance");
      const wj = await wRes.json();
      setAiWalletBalance(wj.success ? { balance: parseFloat(wj.balance).toFixed(4), network: wj.network, address: wj.address } : null);

      // Fetch ledger balance (needs broker + account to exist)
      const lRes = await fetch("/api/og-compute?action=balance");
      const lj = await lRes.json();
      if (lj.success) {
        setAiBalance(parseFloat(lj.balance).toFixed(4));
        if (!lj.ledgerExists && lj.message) {
          setAiTopUpMsg({ ok: false, text: lj.message });
        }
      } else {
        setAiBalance(null);
      }
    } catch {
      setAiBalance(null);
    } finally {
      setAiBalanceLoading(false);
    }
  }, []);

  const handleAiTopUp = async () => {
    const amt = parseFloat(aiTopUpAmount);
    if (!amt || amt <= 0) return;
    setAiTopUpLoading(true);
    setAiTopUpMsg(null);
    try {
      const res = await fetch("/api/og-compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createAccount", amount: amt }),
      });
      const j = await res.json();
      if (j.success) {
        setAiTopUpMsg({ ok: true, text: `Successfully deposited ${amt} OG into AI ledger.` });
        fetchAiBalance();
      } else {
        setAiTopUpMsg({ ok: false, text: j.error || "Top-up failed." });
      }
    } catch (e) {
      setAiTopUpMsg({ ok: false, text: e.message });
    } finally {
      setAiTopUpLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ai") fetchAiBalance();
  }, [activeTab, fetchAiBalance]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/treasury-balance");
        const j = await res.json();
        if (cancelled) return;
        if (j.success && j.treasury) {
          setLiquidity(j.treasury);
          setLiquidityError(null);
        } else {
          setLiquidity(null);
          setLiquidityError(j.error || "Liquidity data unavailable");
        }
      } catch (e) {
        if (!cancelled) {
          setLiquidity(null);
          setLiquidityError(e.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadHistory = useCallback(async () => {
    if (!address) {
      setHistoryGames([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/games/history?userAddress=${encodeURIComponent(address)}&limit=30`
      );
      const j = await res.json();
      const games = j?.data?.games || [];
      setHistoryGames(Array.isArray(games) ? games : []);
      setHistoryMessage(j?.message || "");
    } catch (e) {
      setHistoryGames([]);
      setHistoryMessage(e.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (activeTab === "activity" && address) loadHistory();
  }, [activeTab, address, loadHistory]);

  const walletOgDisplay = walletNative?.value
    ? parseFloat(formatEther(walletNative.value)).toFixed(6)
    : "—";

  const resolvedTreasuryAddress = useTreasuryAddress();

  const treasuryExplorer = resolvedTreasuryAddress
    ? `${TREASURY_CONFIG.NETWORK.EXPLORER_URL.replace(/\/$/, "")}/address/${resolvedTreasuryAddress}`
    : null;

  const copyTreasury = () => {
    if (!resolvedTreasuryAddress) return;
    navigator.clipboard.writeText(resolvedTreasuryAddress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sharp-black to-[#150012] text-white">
      <div className="container mx-auto px-4 lg:px-8 pt-10 pb-16 md:pt-12">
        {showBanner && wrongNetwork && (
          <div className="mb-8 rounded-lg bg-amber-500/20 px-4 py-3 text-center text-sm text-amber-100">
            Your wallet is on the wrong network. Switch to{" "}
            <strong>0G Mainnet</strong> or <strong>0G Galileo Testnet</strong> to deposit native OG.
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => setShowBanner(false)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-10 text-center">
          <HeaderText
            header="Casino treasury"
            description="Deposit native OG from your wallet to your house balance, play games, and withdraw back on-chain when you're done."
          />
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-3">
          <ConnectWalletButton />
          {isConnected && (
            <button
              type="button"
              onClick={() => {
                refetchWallet?.();
                refreshHouseBalance?.();
              }}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Refresh balances
            </button>
          )}
        </div>

        <div className="mb-8">
          <div className="custom-scrollbar flex overflow-x-auto border-b border-white/10">
            <button
              type="button"
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === "treasury"
                  ? "border-b-2 border-blue-magic text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("treasury")}
            >
              <FaWallet /> Treasury
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === "ai"
                  ? "border-b-2 border-blue-magic text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("ai")}
            >
              <FaRobot /> AI Compute
            </button>
            <button
              type="button"
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                activeTab === "activity"
                  ? "border-b-2 border-blue-magic text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
              onClick={() => setActiveTab("activity")}
            >
              <FaHistory /> Game activity
            </button>
          </div>
        </div>

        {activeTab === "treasury" && (
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#1A0015] p-6">
              <h2 className="font-display mb-4 text-lg text-white">Your wallets</h2>
              <div className="space-y-4">
                <div className="rounded-lg bg-[#250020] p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Wallet (native OG)
                  </p>
                  <p className="font-mono text-xl tabular-nums text-[#E8C8FF]">
                    {isConnected ? `${walletOgDisplay} OG` : "Connect wallet"}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    On-chain balance used to fund deposits to the house.
                  </p>
                </div>
                <div className="rounded-lg bg-[#250020] p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    House balance
                  </p>
                  <p className="font-mono text-xl tabular-nums text-[#E8C8FF]">
                    {isLoadingBalance
                      ? "…"
                      : `${parseFloat(userBalance || "0").toFixed(5)} OG`}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Tracked for your session; used across casino games.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1A0015] p-6">
              <h2 className="font-display mb-4 text-lg text-white">
                Deposit & withdraw
              </h2>
              {!resolvedTreasuryAddress && (
                <p className="text-sm text-amber-300">
                  Set <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_TREASURY_ADDRESS</code>{" "}
                  to enable deposits.
                </p>
              )}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-xs text-white/50">
                  <span>Treasury address</span>
                  {treasuryExplorer && (
                    <a
                      href={treasuryExplorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-magic hover:underline"
                    >
                      Explorer <FaExternalLinkAlt className="text-[10px]" />
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <code className="flex-1 truncate rounded bg-black/40 px-3 py-2 text-xs text-white/80">
                    {resolvedTreasuryAddress || "Loading…"}
                  </code>
                  <button
                    type="button"
                    onClick={copyTreasury}
                    className="rounded-lg border border-white/15 bg-white/5 p-2 hover:bg-white/10"
                    title="Copy address"
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm text-white/70">
                  Deposit amount (OG)
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    min={TREASURY_CONFIG.LIMITS.MIN_DEPOSIT}
                    max={TREASURY_CONFIG.LIMITS.MAX_DEPOSIT}
                    step="0.000001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0"
                    disabled={isDepositing || !isConnected}
                    className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-[#250020] px-3 py-2 text-white placeholder-white/30 focus:border-blue-magic focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleDeposit}
                    disabled={
                      !isConnected ||
                      !depositAmount ||
                      parseFloat(depositAmount) <= 0 ||
                      isDepositing ||
                      wrongNetwork ||
                      !resolvedTreasuryAddress
                    }
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDepositing ? "Sending…" : "Deposit"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  Min {TREASURY_CONFIG.LIMITS.MIN_DEPOSIT} · Max{" "}
                  {TREASURY_CONFIG.LIMITS.MAX_DEPOSIT} OG per deposit
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {[0.001, 0.01, 0.1, 1].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setDepositAmount(String(q))}
                      className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10"
                    >
                      {q} OG
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={
                    !isConnected ||
                    parseFloat(userBalance || "0") <= 0 ||
                    isWithdrawing
                  }
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isWithdrawing
                    ? "Processing…"
                    : parseFloat(userBalance || "0") > 0
                      ? `Withdraw all (${parseFloat(userBalance || "0").toFixed(5)} OG)`
                      : "Nothing to withdraw"}
                </button>
                <p className="mt-2 text-center text-xs text-white/45">
                  Withdrawals send OG from the house treasury to your connected wallet
                  (server-signed).
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="rounded-xl border border-white/10 bg-[#1A0015] p-6">
                <div className="mb-2 flex items-center gap-2">
                  <FaCoins className="text-yellow-400" />
                  <h3 className="font-display text-lg">Treasury liquidity (server)</h3>
                </div>
                {liquidity ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-[#250020] p-4">
                      <p className="text-xs text-white/50">0G (treasury wallet)</p>
                      <p className="text-lg tabular-nums text-white">
                        {liquidity.og?.balance ?? "—"} OG
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-white/40 break-all">
                        {liquidity.address}
                      </p>
                    </div>
                    {liquidity.entropyOracle && (
                      <div className="rounded-lg bg-[#250020] p-4">
                        <p className="text-xs text-white/50">
                          Entropy oracle ({liquidity.entropyOracle.name})
                        </p>
                        <p className="text-lg tabular-nums text-white">
                          {liquidity.entropyOracle.balance ?? "—"} (native)
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/50">
                    {liquidityError ||
                      "Configure treasury keys on the server to show live liquidity."}
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-red-magic/20 bg-[#1A0015] p-6">
              <h3 className="mb-2 font-display text-lg">How it works</h3>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
                <li>
                  Connect your wallet on <strong>{TREASURY_CONFIG.NETWORK.CHAIN_NAME}</strong>.
                </li>
                <li>Deposit native OG to the treasury address — your house balance increases.</li>
                <li>
                  Play from your house balance in{" "}
                  <Link href="/game" className="text-blue-magic underline">
                    Games
                  </Link>
                  .
                </li>
                <li>
                  Withdraw sends OG from the treasury back to your wallet via{" "}
                  <code className="rounded bg-black/30 px-1">/api/withdraw</code>.
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-white/10 bg-[#1A0015] p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaRobot className="text-2xl text-blue-magic" />
                <div>
                  <h2 className="font-display text-lg text-white">0G Compute AI Ledger</h2>
                  <p className="text-xs text-white/50">OG tokens deposited here pay for AI inference (casino assistant).</p>
                </div>
              </div>

              {/* Balances */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/30 p-4">
                  <p className="text-xs text-white/50 mb-1">Treasury wallet OG</p>
                  {aiBalanceLoading ? (
                    <p className="text-white/40 text-sm">Loading…</p>
                  ) : aiWalletBalance ? (
                    <>
                      <p className={`text-xl font-bold ${parseFloat(aiWalletBalance.balance) < 1 ? "text-red-400" : "text-green-400"}`}>
                        {aiWalletBalance.balance} OG
                      </p>
                      <p className="text-xs text-white/40 mt-1 truncate">{aiWalletBalance.network}</p>
                    </>
                  ) : (
                    <p className="text-white/40 text-sm">—</p>
                  )}
                </div>
                <div className="rounded-lg bg-black/30 p-4">
                  <p className="text-xs text-white/50 mb-1">AI ledger balance</p>
                  {aiBalanceLoading ? (
                    <p className="text-white/40 text-sm">Loading…</p>
                  ) : aiBalance !== null ? (
                    <>
                      <p className={`text-xl font-bold ${parseFloat(aiBalance) < 0.5 ? "text-red-400" : "text-green-400"}`}>
                        {aiBalance} OG
                      </p>
                      {parseFloat(aiBalance) < 0.5 && (
                        <p className="text-xs text-red-400 mt-1">⚠ Below 0.5 OG min</p>
                      )}
                    </>
                  ) : (
                    <p className="text-white/40 text-sm">—</p>
                  )}
                </div>
              </div>

              <div className="mb-4 flex justify-end">
                <button type="button" onClick={fetchAiBalance} disabled={aiBalanceLoading}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-50">
                  Refresh
                </button>
              </div>

              {/* Step 1 warning if treasury wallet is empty */}
              {aiWalletBalance && parseFloat(aiWalletBalance.balance) < 1 && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  <p className="font-semibold mb-1">⚠ Step 1 required — fund the treasury wallet first</p>
                  <p className="text-xs text-red-100/80 mb-2">
                    The treasury wallet has insufficient OG on 0G Mainnet. Send at least <strong>2 OG</strong> to:
                  </p>
                  <code className="block bg-black/30 rounded px-2 py-1 text-xs break-all text-yellow-300">
                    0xb424d2369F07b925D1218B08e56700AF5928287b
                  </code>
                  <p className="text-xs text-red-100/60 mt-1">Network: 0G Mainnet (chain ID 16661)</p>
                </div>
              )}

              {/* Requirement info */}
              <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-200">
                <p className="font-semibold mb-1">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-yellow-100/80">
                  <li>Send OG to treasury wallet on <strong>0G Mainnet</strong> (see address above if needed)</li>
                  <li>Click "Top Up AI" — moves OG from treasury into the AI inference ledger contract</li>
                  <li>Minimum 0.5 OG required for AI chat; 1–2 OG recommended</li>
                </ol>
              </div>

              {/* Top up form */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Amount to deposit into AI ledger (OG)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={aiTopUpAmount}
                    onChange={(e) => setAiTopUpAmount(e.target.value)}
                    disabled={aiTopUpLoading}
                    className="flex-1 rounded-lg border border-white/10 bg-[#250020] px-3 py-2 text-white placeholder-white/30 focus:border-blue-magic focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAiTopUp}
                    disabled={aiTopUpLoading || !aiTopUpAmount || parseFloat(aiTopUpAmount) <= 0}
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {aiTopUpLoading ? "Depositing…" : "Top Up AI"}
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[0.5, 1, 2, 5].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setAiTopUpAmount(String(q))}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
                    >
                      {q} OG
                    </button>
                  ))}
                </div>
              </div>

              {/* Result message */}
              {aiTopUpMsg && (
                <div className={`mt-4 rounded-lg p-3 text-sm ${aiTopUpMsg.ok ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
                  {aiTopUpMsg.text}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="mx-auto max-w-5xl">
            {!address ? (
              <p className="text-center text-white/50">
                Connect your wallet to see game activity from the database.
              </p>
            ) : historyLoading ? (
              <p className="text-center text-white/50">Loading history…</p>
            ) : historyGames.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-[#1A0015] p-12 text-center">
                <FaHistory className="mx-auto mb-4 text-4xl text-white/20" />
                <p className="text-white/60">No recorded games for this wallet yet.</p>
                {historyMessage && (
                  <p className="mt-2 text-xs text-white/40">{historyMessage}</p>
                )}
                <Link
                  href="/game"
                  className="mt-6 inline-block rounded-lg bg-gradient-to-r from-red-magic to-blue-magic px-6 py-2 text-sm font-medium"
                >
                  Play now
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#1A0015]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60">
                      <th className="px-4 py-3">When</th>
                      <th className="px-4 py-3">Game</th>
                      <th className="px-4 py-3">Bet</th>
                      <th className="px-4 py-3">Payout</th>
                      <th className="px-4 py-3">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyGames.map((g, i) => (
                      <tr key={g.id || i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-white/70">
                          {g.timestamp || g.createdAt
                            ? new Date(g.timestamp || g.createdAt).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">{g.gameType || "—"}</td>
                        <td className="px-4 py-3 tabular-nums">{g.betAmount ?? "—"}</td>
                        <td className="px-4 py-3 tabular-nums">{g.payoutAmount ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              g.isWin
                                ? "text-emerald-400"
                                : "text-white/50"
                            }
                          >
                            {g.isWin ? "Win" : "Loss"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
