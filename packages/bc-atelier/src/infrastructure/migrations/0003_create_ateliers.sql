CREATE TABLE IF NOT EXISTS ateliers (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  street text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  city text NOT NULL,
  country text NOT NULL DEFAULT 'FR',
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ateliers_status_idx ON ateliers (status);

CREATE INDEX IF NOT EXISTS ateliers_coordinates_idx ON ateliers (latitude, longitude);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  atelier_id uuid NOT NULL REFERENCES ateliers (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'MEMBER',
  status text NOT NULL DEFAULT 'ACTIVE',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, atelier_id)
);

CREATE INDEX IF NOT EXISTS memberships_atelier_idx ON memberships (atelier_id);

CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY,
  atelier_id uuid NOT NULL REFERENCES ateliers (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  kind text NOT NULL,
  requires_certification boolean NOT NULL DEFAULT true,
  slot_duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'AVAILABLE',
  nfc_tag_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS machines_atelier_idx ON machines (atelier_id);

CREATE INDEX IF NOT EXISTS machines_kind_idx ON machines (kind);
