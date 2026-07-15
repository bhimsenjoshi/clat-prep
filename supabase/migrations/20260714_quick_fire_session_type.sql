-- Add session_type column to quiz_sessions
-- Values: 'practice' (default, passage-grouped questions), 'quick_fire' (standalone questions, no passages)
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'practice';
