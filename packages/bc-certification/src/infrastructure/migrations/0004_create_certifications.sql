CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES machines (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING',
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid REFERENCES users (id) ON DELETE SET NULL,
  UNIQUE (user_id, machine_id)
);

CREATE INDEX IF NOT EXISTS certifications_machine_idx ON certifications (machine_id);

CREATE INDEX IF NOT EXISTS certifications_status_idx ON certifications (status);
