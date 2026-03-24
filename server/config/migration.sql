-- Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Wounds table
CREATE TABLE wounds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body_location TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'healed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wound entries table (each image upload + analysis = one entry)
CREATE TABLE wound_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wound_id UUID REFERENCES wounds(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  analysis JSONB DEFAULT '{}'::jsonb,
  treatment JSONB DEFAULT '{}'::jsonb,
  progress JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_wounds_user_id ON wounds(user_id);
CREATE INDEX idx_wound_entries_wound_id ON wound_entries(wound_id);

-- Enable Row Level Security (optional, since we handle auth in Express)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wounds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wound_entries ENABLE ROW LEVEL SECURITY;
