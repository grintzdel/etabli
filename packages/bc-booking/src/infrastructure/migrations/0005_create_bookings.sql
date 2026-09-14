CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY,
  machine_id uuid NOT NULL REFERENCES machines (id) ON DELETE CASCADE,
  atelier_id uuid NOT NULL REFERENCES ateliers (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'CONFIRMED',
  checked_in_at timestamptz,
  checked_in_via text,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_ends_after_it_starts CHECK (end_at > start_at),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    machine_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('CONFIRMED', 'CHECKED_IN'))
);

CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings (user_id, start_at DESC);

CREATE INDEX IF NOT EXISTS bookings_machine_idx ON bookings (machine_id, start_at);
