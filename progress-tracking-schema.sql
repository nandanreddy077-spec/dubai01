-- Progress Photos Table
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  analysis JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('great', 'good', 'okay', 'bad')),
  sleep_hours DECIMAL(3, 1) NOT NULL,
  water_intake INTEGER NOT NULL,
  stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 5),
  skin_feeling TEXT,
  notes TEXT,
  products_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Insights Table
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  consistency_score INTEGER NOT NULL CHECK (consistency_score >= 0 AND consistency_score <= 100),
  photo_streak JSONB NOT NULL,
  journal_streak JSONB NOT NULL,
  wins TEXT[] NOT NULL,
  patterns JSONB NOT NULL,
  product_report JSONB NOT NULL,
  recommendations TEXT[] NOT NULL,
  transformation_analysis JSONB,
  generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_progress_photos_user_id ON progress_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_photos_date ON progress_photos(date);
CREATE INDEX IF NOT EXISTS idx_progress_photos_timestamp ON progress_photos(timestamp);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_timestamp ON journal_entries(timestamp);

CREATE INDEX IF NOT EXISTS idx_daily_insights_user_id ON daily_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON daily_insights(date);

-- RLS Policies
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;

-- Progress Photos Policies
CREATE POLICY "Users can view their own progress photos"
  ON progress_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress photos"
  ON progress_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress photos"
  ON progress_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress photos"
  ON progress_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Journal Entries Policies
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Daily Insights Policies
CREATE POLICY "Users can view their own daily insights"
  ON daily_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily insights"
  ON daily_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily insights"
  ON daily_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily insights"
  ON daily_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_progress_photos_updated_at
  BEFORE UPDATE ON progress_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_insights_updated_at
  BEFORE UPDATE ON daily_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
