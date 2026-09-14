CREATE TABLE IF NOT EXISTS domain_events (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS domain_events_name_occurred_at_idx ON domain_events (name, occurred_at DESC);
