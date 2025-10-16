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
        // Fetch treasury balance
        const treasuryResponse = await fetch('/api/treasury-balance');
        const treasuryData = await treasuryResponse.json();
        
        if (treasuryData.success) {
          setTreasuryData(treasuryData);
        } else {
          setError(treasuryData.error);
        }
        
        // Test 0G connection
        const connectionResponse = await fetch('/api/test-0g-connection');
        const connectionData = await connectionResponse.json();
        setConnectionTest(connectionData);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading treasury data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Treasury Balance Test</h1>
      
      {treasuryData && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Treasury Address</h2>
            <p className="font-mono text-sm">{treasuryData.treasury.address}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">0G Network Balance</h2>
            <p className="text-2xl font-bold text-green-400">
              {treasuryData.treasury.ogNetwork.balance} OG
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Network: {treasuryData.treasury.ogNetwork.network}
            </p>
            <p className="text-sm text-gray-400">
              Chain ID: {treasuryData.treasury.ogNetwork.chainId}
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Arbitrum Sepolia Balance</h2>
            <p className="text-2xl font-bold text-blue-400">
              {treasuryData.treasury.arbitrumSepolia.balance} ETH
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Network: {treasuryData.treasury.arbitrumSepolia.network}
            </p>
            <p className="text-sm text-gray-400">
              Chain ID: {treasuryData.treasury.arbitrumSepolia.chainId}
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Entropy Contract</h2>
            <p className="font-mono text-sm">{treasuryData.entropy.contractAddress}</p>
            <p className="text-sm text-gray-400 mt-2">
              Required Fee: {treasuryData.entropy.requiredFee} ETH
            </p>
          </div>
        </div>
      )}

      {/* 0G Connection Test Results */}
      {connectionTest && (
        <div className="bg-gray-800 p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4">0G Network Connection Test</h2>
          
          {connectionTest.success ? (
            <div className="space-y-3">
              <div className="text-green-400 font-semibold">✅ All tests passed!</div>
              
              {Object.entries(connectionTest.tests).map(([test, result]) => (
                <div key={test} className="flex justify-between">
                  <span className="text-gray-300 capitalize">{test.replace('_', ' ')}:</span>
                  <span className="text-sm">{result}</span>
                </div>
              ))}
              
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded">
                <div className="text-green-400 font-semibold">
                  Can Send Transactions: {connectionTest.canSendTransaction ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              
              {connectionTest.recommendations && connectionTest.recommendations.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded">
                  <div className="text-yellow-400 font-semibold mb-2">Recommendations:</div>
                  <ul className="text-sm text-yellow-300">
                    {connectionTest.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-red-400 font-semibold">❌ Connection test failed</div>
              <div className="text-red-300">Error: {connectionTest.error}</div>
              <div className="text-gray-400">Failed at step: {connectionTest.step}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}