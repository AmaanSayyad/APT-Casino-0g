"use client";

import { useState } from 'react';
import { Button, TextField, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { Send, Refresh, AccountBalance } from '@mui/icons-material';
import useOGComputeNetwork from '@/hooks/useOGComputeNetwork';

export default function TestOGComputePage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [testResult, setTestResult] = useState(null);
  
  const {
    isInitialized,
    isLoading,
    error,
    balance,
    sendInferenceRequest,
    acknowledgeProvider,
    addFunds,
    refreshBalance,
    refreshServices,
    services,
  } = useOGComputeNetwork();

  const handleTestBalance = async () => {
    try {
      await refreshBalance();
      setTestResult({ success: true, message: `Balance: ${balance} OG` });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    }
  };

  const handleTestServices = async () => {
    try {
      await refreshServices();
      setTestResult({ success: true, message: `Found ${services.length} services` });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeProvider();
      setTestResult({ success: true, message: 'Provider acknowledged successfully' });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    try {
      const apiMessages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for an on-chain casino. Be concise and helpful.',
        },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMessage,
      ];

      const response = await sendInferenceRequest(apiMessages);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.content,
          verified: response.verified,
        },
      ]);

      setTestResult({ success: true, message: 'AI response received!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err.message}`,
          isError: true,
        },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-[#070005] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Typography variant="h4" className="mb-6 text-white">
          0G Compute Network Test
        </Typography>

        {/* Status */}
        <Box className="mb-6 p-4 bg-purple-magic rounded-lg">
          <Typography variant="h6" className="mb-2">Status</Typography>
          <div className="space-y-2">
            <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
            <div>Loading: {isLoading ? '⏳' : '✅'}</div>
            <div>Balance: {balance || '0.0000'} OG</div>
            {error && <Alert severity="error">{error}</Alert>}
            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'}>
                {testResult.message}
              </Alert>
            )}
          </div>
        </Box>

        {/* Test Buttons */}
        <Box className="mb-6 p-4 bg-purple-magic rounded-lg">
          <Typography variant="h6" className="mb-4">Test Actions</Typography>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="contained"
              onClick={handleTestBalance}
              disabled={isLoading}
              startIcon={<AccountBalance />}
            >
              Check Balance
            </Button>
            <Button
              variant="contained"
              onClick={handleTestServices}
              disabled={isLoading}
              startIcon={<Refresh />}
            >
              List Services
            </Button>
            <Button
              variant="contained"
              onClick={handleAcknowledge}
              disabled={isLoading}
            >
              Acknowledge Provider
            </Button>
            <Button
              variant="contained"
              onClick={() => addFunds(0.1)}
              disabled={isLoading}
            >
              Add 0.1 OG
            </Button>
          </div>
        </Box>

        {/* Services List */}
        {services.length > 0 && (
          <Box className="mb-6 p-4 bg-purple-magic rounded-lg">
            <Typography variant="h6" className="mb-2">Available Services</Typography>
            <div className="space-y-2">
              {services.map((service, idx) => (
                <div key={idx} className="p-2 bg-white/10 rounded">
                  <div>Provider: {service.provider}</div>
                  <div>Model: {service.model}</div>
                  <div>Verification: {service.verifiability || 'None'}</div>
                </div>
              ))}
            </div>
          </Box>
        )}

        {/* Chat Interface */}
        <Box className="p-4 bg-purple-magic rounded-lg">
          <Typography variant="h6" className="mb-4">AI Chat Test</Typography>
          
          <div className="mb-4 space-y-2 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <Typography variant="body2" className="text-white/70">
                Start a conversation with the AI...
              </Typography>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded ${
                  msg.role === 'user'
                    ? 'bg-blue-600 ml-auto max-w-[80%]'
                    : msg.isError
                    ? 'bg-red-500/20 border border-red-500'
                    : 'bg-white/10 max-w-[80%]'
                }`}
              >
                <Typography variant="body2">{msg.content}</Typography>
                {msg.verified !== undefined && (
                  <Typography variant="caption" className="text-xs mt-1">
                    {msg.verified ? '✓ Verified' : '⚠ Unverified'}
                  </Typography>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <TextField
              fullWidth
              placeholder="Ask AI something..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!isInitialized || isLoading}
              className="bg-white/10"
              InputProps={{
                className: 'text-white',
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!isInitialized || isLoading || !inputMessage.trim()}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
            >
              Send
            </Button>
          </div>
        </Box>
      </div>
    </div>
  );
}

