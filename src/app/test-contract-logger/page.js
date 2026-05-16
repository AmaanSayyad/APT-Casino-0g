"use client";
import { useState, useEffect } from 'react';

export default function TestContractLogger() {
  const [contractStats, setContractStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/log-to-0g-contract');
        const data = await response.json();
        
        if (data.success) {
          setContractStats(data);
        } else {
          setError(data.error);
        }
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="p-8">Loading contract stats...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">0G Contract Logger Stats</h1>
      
      {contractStats && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
            <p className="font-mono text-sm mb-2">
              <strong>Contract Address:</strong> {contractStats.stats.contractAddress}
            </p>
            <p className="text-sm text-gray-400">
              <a 
                href={contractStats.contractExplorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                View on 0G Explorer →
              </a>
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Logging Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {contractStats.stats.totalLogs}
                </p>
                <p className="text-sm text-gray-400">Total Games Logged</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {(parseFloat(contractStats.stats.totalGasUsed) / 1e6).toFixed(2)}M
                </p>
                <p className="text-sm text-gray-400">Total Gas Used</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {(parseFloat(contractStats.stats.averageGasPerLog) / 1e3).toFixed(1)}K
                </p>
                <p className="text-sm text-gray-400">Avg Gas per Log</p>
              </div>
              <div>
                <p className="text-xs font-mono text-purple-400">
                  {contractStats.stats.lastLogger.slice(0, 8)}...
                </p>
                <p className="text-sm text-gray-400">Last Logger</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Network Information</h2>
            <div className="space-y-2">
              <p><strong>Network:</strong> {contractStats.network.name}</p>
              <p><strong>Chain ID:</strong> {contractStats.network.chainId}</p>
              <p><strong>RPC URL:</strong> {contractStats.network.rpcUrl}</p>
              <p><strong>Explorer:</strong> 
                <a 
                  href={contractStats.network.explorerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline ml-2"
                >
                  {contractStats.network.explorerUrl}
                </a>
              </p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Benefits of Contract Logging</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                <strong>Trackable:</strong> Easy to query total logs and gas usage
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                <strong>Events:</strong> Indexed events for efficient filtering
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                <strong>Structured:</strong> Organized data storage with validation
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                <strong>Gas Efficient:</strong> Optimized contract calls vs raw transactions
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                <strong>Analytics:</strong> Built-in counters for users and game types
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}