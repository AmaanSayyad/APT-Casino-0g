"use client";

import { useState, useEffect, useRef } from "react";
import { Typography, TextField, Button, CircularProgress, Alert, Chip } from "@mui/material";
import { Send, Close } from "@mui/icons-material";
import useOGComputeNetwork from "../hooks/useOGComputeNetwork";

export default function AiModal({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  const {
    isInitialized,
    isLoading,
    error,
    balance,
    sendInferenceRequest,
    acknowledgeProvider,
    addFunds,
    isLowBalance,
    refreshBalance,
    getProviderInfo,
  } = useOGComputeNetwork();

  const providerInfo = getProviderInfo();

  // Initialize conversation
  useEffect(() => {
    if (isOpen && isInitialized) {
      // Add welcome message
      setMessages([
        {
          role: "assistant",
          content: `Hello! I'm your AI casino assistant powered by 0G Compute Network (${providerInfo?.name || 'AI'}). I can help you with game strategies, explain game rules, provide betting tips, and answer questions about the casino. How can I assist you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, isInitialized, providerInfo]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending || !isInitialized) return;

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsSending(true);

    try {
      // Prepare messages for API
      const apiMessages = [
        {
          role: "system",
          content: "You are a helpful AI assistant for an on-chain casino. You can help users understand games, provide betting strategies, explain game rules, and answer questions. Be friendly, informative, and responsible.",
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        userMessage,
      ];

      const response = await sendInferenceRequest(apiMessages);

      const assistantMessage = {
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        verified: response.verified,
        chatID: response.chatID,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.message}. Please try again or check your account balance.`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddFunds = async () => {
    try {
      await addFunds(0.5); // Add 0.5 OG (minimum for inference)
      await refreshBalance();
    } catch (err) {
      console.error("Failed to add funds:", err);
    }
  };

  const handleAcknowledgeProvider = async () => {
    try {
      await acknowledgeProvider();
    } catch (err) {
      console.error("Failed to acknowledge provider:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-[80vh] bg-purple-magic rounded-lg shadow-2xl flex flex-col p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                AI Casino Assistant
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Powered by 0G Compute Network
              </Typography>
            </div>
          </div>
          <Button onClick={onClose} sx={{ color: 'white', minWidth: 'auto' }}>
            <Close />
          </Button>
        </div>

        {/* Status Bar */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          {isInitialized ? (
            <>
              <Chip
                label={`Balance: ${balance ? parseFloat(balance).toFixed(4) : '0.0000'} OG`}
                size="small"
                color={isLowBalance ? "warning" : "success"}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                }
              />
              {providerInfo && (
                <Chip
                  label={providerInfo.name}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '& .MuiChip-label': { color: 'white' }
                  }}
                />
              )}
              {isLowBalance && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleAddFunds}
                  disabled={isLoading}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)' }
                  }}
                >
                  Add Funds
                </Button>
              )}
            </>
          ) : (
            <Alert severity="info" sx={{ width: '100%' }}>
              Initializing 0G Compute Network...
            </Alert>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : message.isError
                    ? "bg-red-500/20 text-red-200 border border-red-500/50"
                    : "bg-white/10 text-white"
                }`}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                {message.verified !== undefined && (
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', mt: 1, opacity: 0.7 }}>
                    {message.verified ? "✓ Verified" : "⚠ Unverified"}
                  </Typography>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-lg p-3 flex items-center gap-2">
                <CircularProgress size={16} sx={{ color: 'white' }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  AI is thinking...
                </Typography>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <TextField
            fullWidth
            placeholder="Ask me anything about the casino, games, or strategies..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={!isInitialized || isSending || isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '& input': {
                  color: 'white',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!isInitialized || isSending || isLoading || !inputMessage.trim()}
            sx={{
              backgroundColor: '#2563eb',
              minWidth: '100px',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              },
              '&:disabled': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {isSending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
          </Button>
        </div>

        {/* Footer Info */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
            Responses are generated by 0G Compute Network AI. Balance is deducted per request.
          </Typography>
        </div>
      </div>
    </div>
  );
}

