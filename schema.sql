-- WIN FTTH Mapping/Planner v5
CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Admin',
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT DEFAULT '',
  team TEXT DEFAULT '',
  area TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Offline',
  gps TEXT DEFAULT 'Not connected',
  gps_lat DOUBLE PRECISION,
  gps_lng DOUBLE PRECISION,
  gps_accuracy DOUBLE PRECISION,
  last_update TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  site TEXT NOT NULL,
  node TEXT DEFAULT '',
  tech TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS clients (
  account TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  port TEXT DEFAULT 'Unassigned',
  plan TEXT NOT NULL DEFAULT 'Fiber 100',
  status TEXT NOT NULL DEFAULT 'Pending',
  phone TEXT DEFAULT '',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  label TEXT NOT NULL,
  core_type TEXT DEFAULT '4 Core (Blue, Orange, Green, Brown)',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  route_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS faults (
  id BIGSERIAL PRIMARY KEY,
  olt TEXT NOT NULL,
  distance_km NUMERIC(10,3) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  nearest_node TEXT DEFAULT '',
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS qr_activations (
  id BIGSERIAL PRIMARY KEY,
  nap_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Activated',
  activated_by TEXT DEFAULT '',
  activated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS activities (
  id BIGSERIAL PRIMARY KEY,
  time_label TEXT NOT NULL,
  actor TEXT NOT NULL,
  activity TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
