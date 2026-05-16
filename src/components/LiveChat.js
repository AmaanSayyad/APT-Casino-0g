"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  buildChatInsert,
  buildChatInsertFallback,
  isWalletColumnError,
  normalizeChatRow,
} from "@/lib/supabaseChat";
import { useAccount } from 'wagmi';

function normalizeWalletAddress(account) {
  try {
    if (!account) return undefined;
    const addr = account.address ?? account.accountAddress ?? account;
    if (!addr) return undefined;
    if (typeof addr === 'string') return addr;
    if (typeof addr.toString === 'function') return addr.toString();
    if (addr.data && typeof addr.data === 'object') {
      // Uint8Array → hex
      const bytes = Array.from(addr.data);
      const hex = '0x' + bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
      return hex;
    }
    return String(addr);
  } catch {
    return undefined;
  }
}

export default function LiveChat({ open, onClose }) {
  const { address } = useAccount();
  const walletAddr = address || "guest";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chatError, setChatError] = useState("");
  const bottomRef = useRef(null);
  const [minimized, setMinimized] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (!isSupabaseConfigured) {
      setChatError("Chat unavailable: Supabase env vars not configured.");
      return;
    }
    let channel;
    let poller;
    (async () => {
      setChatError("");
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, wallet_address, content, created_at')
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) {
        setChatError(
          error.message.includes('wallet_address')
            ? 'Chat schema mismatch — run supabase/fix-schema.sql in Supabase SQL Editor.'
            : error.message
        );
        return;
      }
      setMessages((data || []).map(normalizeChatRow));

      // Try realtime if available
      try {
        channel = supabase
          .channel('public:chat_messages')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
            setMessages((prev) => [...prev, normalizeChatRow(payload.new)]);
          })
          .subscribe();
      } catch {}

      // Fallback polling every 1s when replication not active
      const fetchLatest = async () => {
        try {
          const { data: d, error: pollErr } = await supabase
            .from('chat_messages')
            .select('id, wallet_address, content, created_at')
            .order('created_at', { ascending: true })
            .limit(200);
          if (!pollErr && Array.isArray(d)) setMessages(d.map(normalizeChatRow));
        } catch {}
      };
      poller = setInterval(fetchLatest, 1000);
    })();

    return () => {
      try { channel && supabase.removeChannel(channel); } catch {}
      try { poller && clearInterval(poller); } catch {}
    };
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const content = text.trim();
    if (!content) return;
    setText("");
    const temp = { id: `temp-${Date.now()}`, wallet_address: walletAddr, content, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, temp]);
    setChatError("");

    let result = await supabase
      .from('chat_messages')
      .insert(buildChatInsert(walletAddr, content))
      .select();

    if (result.error && isWalletColumnError(result.error)) {
      result = await supabase
        .from('chat_messages')
        .insert(buildChatInsertFallback(walletAddr, content))
        .select();
    }

    if (result.error) {
      setChatError(result.error.message);
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      return;
    }

    if (Array.isArray(result.data) && result.data[0]) {
      const real = normalizeChatRow(result.data[0]);
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? real : m)));
    }
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  const node = (
      <div className="fixed right-4 bottom-4 z-[1000] w-[360px] max-w-[90vw] bg-[#0e0010]/95 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur">
        <div
          className={`p-3 border-b border-purple-500/20 flex items-center justify-between ${minimized ? 'cursor-pointer' : ''}`}
          onClick={() => { if (minimized) setMinimized(false); }}
        >
          <div className="text-white/80 text-sm">Live Chat</div>
          <div className="flex items-center gap-2">
            <button className="text-white/60 hover:text-white" onClick={() => setMinimized((v) => !v)}>{minimized ? '▢' : '–'}</button>
            <button className="text-white/60 hover:text-white" onClick={onClose}>✕</button>
          </div>
        </div>
        {chatError && (
          <p className="px-3 py-2 text-xs text-red-300 border-b border-red-500/30">{chatError}</p>
        )}
        {!minimized && (
        <div className="p-3 h-[360px] overflow-y-auto space-y-2">
          {messages.map((m) => (
            <div key={m.id} className="text-white/80 text-sm">
              <span className="text-white/50 mr-2">{(m.wallet_address || 'guest').slice(0,6)}…{(m.wallet_address || 'guest').slice(-4)}</span>
              <span>{m.content}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        )}
        {!minimized && (
        <form onSubmit={sendMessage} className="p-3 border-t border-purple-500/20 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message"
            className="flex-1 px-3 py-2 rounded-md bg-[#1a001a] border border-purple-500/30 text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
          />
          <button type="submit" className="px-3 py-2 rounded-md bg-gradient-to-r from-red-magic to-blue-magic text-white text-sm">Send</button>
        </form>
        )}
      </div>
  );
  return createPortal(node, document.body);
}


