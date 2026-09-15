CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'system',
  default_atelier_id uuid REFERENCES ateliers (id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_theme_is_known CHECK (theme IN ('dark', 'light', 'system'))
);
