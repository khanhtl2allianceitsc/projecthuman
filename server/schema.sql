-- ProjectHuman schema
-- Run once to create all tables

CREATE TABLE IF NOT EXISTS members (
  id           VARCHAR(50)  PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  role         VARCHAR(100) DEFAULT '',
  color        VARCHAR(20)  DEFAULT '#6366f1',
  avatar       VARCHAR(20)  DEFAULT '',
  man_month    BIGINT       DEFAULT 0,
  avatar_url   VARCHAR(500) DEFAULT '',
  portrait_url VARCHAR(500) DEFAULT '',
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id                 VARCHAR(50)  PRIMARY KEY,
  name               VARCHAR(255) NOT NULL,
  description        TEXT         DEFAULT '',
  status             VARCHAR(50)  DEFAULT 'planning',
  priority           VARCHAR(50)  DEFAULT 'medium',
  color              VARCHAR(20)  DEFAULT '#6366f1',
  start_date         DATE,
  end_date           DATE,
  progress           INT          DEFAULT 0,
  budget             BIGINT       DEFAULT 0,
  spent              BIGINT       DEFAULT 0,
  tags               TEXT[]       DEFAULT '{}',
  need_lead          BOOLEAN      DEFAULT FALSE,
  volunteer_deadline TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id   VARCHAR(50)  NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id    VARCHAR(50)  NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
  project_role VARCHAR(100) DEFAULT '',
  PRIMARY KEY (project_id, member_id)
);

-- Global version tracker for stale-write detection
CREATE TABLE IF NOT EXISTS meta (
  key        VARCHAR(50) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO meta (key, value)
  VALUES ('updated_at', EXTRACT(EPOCH FROM NOW())::TEXT)
  ON CONFLICT (key) DO NOTHING;

-- Write audit log (replaces file snapshots)
CREATE TABLE IF NOT EXISTS write_log (
  id         SERIAL       PRIMARY KEY,
  event      VARCHAR(50),
  ip         VARCHAR(60),
  detail     TEXT,
  snapshot   JSONB,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_write_log_created ON write_log (created_at DESC);
