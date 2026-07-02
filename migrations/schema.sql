-- D1 SQL Schema for Safe Food AI Backend

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  is_onboarded INTEGER NOT NULL DEFAULT 0,
  diet_type TEXT NOT NULL DEFAULT 'Bình thường',
  allergies TEXT, -- JSON Array
  diseases TEXT,  -- JSON Array
  health_goals TEXT, -- JSON Array
  push_enabled INTEGER NOT NULL DEFAULT 1,
  email_enabled INTEGER NOT NULL DEFAULT 1,
  fcm_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_user INTEGER NOT NULL DEFAULT 1,
  scan_history_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scan_histories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  scan_type TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  rating TEXT NOT NULL,
  score_text TEXT NOT NULL,
  safe_level TEXT NOT NULL,
  ai_result TEXT NOT NULL,
  personal_warnings TEXT, -- JSON Array
  healthy_alternatives TEXT, -- JSON Array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  latest_version TEXT NOT NULL DEFAULT '1.0.4+4',
  store_url TEXT NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default app version
INSERT INTO app_versions (id, latest_version, store_url)
VALUES (1, '1.0.4+4', 'https://play.google.com/store/apps/details?id=com.thachhuynh.safefoodai')
ON CONFLICT(id) DO NOTHING;
