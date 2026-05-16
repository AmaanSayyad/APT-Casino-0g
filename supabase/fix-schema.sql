-- APT-Casino — reset Supabase tables to match the app (LiveChat + Live page)
-- Run in: Supabase Dashboard → SQL Editor → project gtcmjxfqjtnshexujgmq

-- Remove incompatible chat schema (wrong columns / FKs)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;

-- Live chat (matches src/components/LiveChat.js)
CREATE TABLE public.chat_messages (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL DEFAULT 'guest',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON public.chat_messages (created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_anon" ON public.chat_messages;
CREATE POLICY "chat_messages_select_anon"
  ON public.chat_messages FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "chat_messages_insert_anon" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_anon"
  ON public.chat_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Live streams (matches src/app/live/page.js) — keep if already exists
CREATE TABLE IF NOT EXISTS public.streams (
  id BIGSERIAL PRIMARY KEY,
  playback_id TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streams_select_anon" ON public.streams;
CREATE POLICY "streams_select_anon"
  ON public.streams FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "streams_insert_anon" ON public.streams;
CREATE POLICY "streams_insert_anon"
  ON public.streams FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Realtime for live chat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;
