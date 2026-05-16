-- Game history tables for GameHistoryService (requires DATABASE_URL)
-- Run in Supabase → SQL Editor

CREATE TABLE IF NOT EXISTS public.game_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vrf_request_id UUID,
  user_address TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('MINES','PLINKO','ROULETTE','WHEEL')),
  game_config JSONB NOT NULL,
  result_data JSONB NOT NULL,
  bet_amount NUMERIC,
  payout_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vrf_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT UNIQUE,
  transaction_hash TEXT,
  sequence_number TEXT,
  etherscan_url TEXT,
  network TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_results_user ON public.game_results (user_address, created_at DESC);
