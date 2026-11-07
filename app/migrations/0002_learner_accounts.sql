-- Preserve all existing wallet sessions and course_progress records.
CREATE TABLE learners (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL
);
CREATE TABLE learner_sessions (
  token_hash TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX learner_sessions_expiry ON learner_sessions(expires_at);
CREATE TABLE learner_wallets (
  wallet TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id),
  linked_at INTEGER NOT NULL
);
CREATE INDEX learner_wallets_learner ON learner_wallets(learner_id);
CREATE TABLE learner_progress (
  learner_id TEXT NOT NULL REFERENCES learners(id),
  course_version INTEGER NOT NULL,
  progress TEXT NOT NULL,
  revision INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (learner_id, course_version)
);
CREATE TABLE email_challenges (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE INDEX email_challenges_expiry ON email_challenges(expires_at);
CREATE TABLE progress_transfers (
  code_hash TEXT PRIMARY KEY,
  course_version INTEGER NOT NULL,
  progress TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX progress_transfers_expiry ON progress_transfers(expires_at);
ALTER TABLE auth_challenges ADD COLUMN learner_id TEXT REFERENCES learners(id);
