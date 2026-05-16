"use client";
import { useState, useEffect } from 'react';

export default function TestTreasury() {
  const [treasuryData, setTreasuryData] = useState(null);
  const [connectionTest, setConnectionTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const treasuryResponse = await fetch('/api/treasury-balance');
        const t = await treasuryResponse.json().catch(() => ({}));
        if (t.success) {
          setTreasuryData(t);
        } else {
          setError(t.error || t.details || 'Treasury request failed');
        }

        const connectionResponse = await fetch('/api/test-0g-connection');
        setConnectionTest(await connectionResponse.json().catch(() => null));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading treasury data...</div>;

  const oracle = treasuryData?.treasury?.entropyOracle;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Treasury Balance Test</h1>

      {error && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-amber-100 text-sm">
          Treasury API: {error}
        </div>
      )}

      {treasuryData && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Treasury Address</h2>
            <p className="font-mono text-sm">{treasuryData.treasury.address}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">0G balance</h2>
            <p className="text-2xl font-bold text-green-400">{treasuryData.treasury.og.balance} OG</p>
            <p className="text-sm text-gray-400 mt-2">RPC: {treasuryData.treasury.og.rpcUrl}</p>
          </div>

          {oracle && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Entropy oracle balance</h2>
              <p className="text-2xl font-bold text-blue-400">{oracle.balance}</p>
              <p className="text-sm text-gray-400 mt-2">Network: {oracle.name}</p>
              <p className="text-sm text-gray-400">Chain ID: {oracle.chainId}</p>
            </div>
          )}

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Entropy contract</h2>
            <p className="font-mono text-sm">{treasuryData.entropy.contractAddress}</p>
          </div>
        </div>
      )}

      {connectionTest && (
        <div className="bg-gray-800 p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4">0G connection test</h2>
          {connectionTest.success ? (
            <div className="space-y-3">
              <div className="text-green-400 font-semibold">All tests passed</div>
              {Object.entries(connectionTest.tests).map(([test, result]) => (
                <div key={test} className="flex justify-between">
                  <span className="text-gray-300 capitalize">{test.replace('_', ' ')}:</span>
                  <span className="text-sm">{result}</span>
                </div>
              ))}
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded">
                <div className="text-green-400 font-semibold">
                  Can send transactions: {connectionTest.canSendTransaction ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-red-400 font-semibold">Connection test failed</div>
              <div className="text-red-300">Error: {connectionTest.error}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
