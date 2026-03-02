-- Migration 0006: Idempotency Cache
--
-- Adds the `idempotency_cache` table for multi-instance Postgres-backed
-- idempotency enforcement. Replaces the in-memory cache in production
-- so all app instances share a single source of truth.
--
-- Entries expire after 24h (enforced by `expires_at` + cleanup query).
-- The unique index on `cache_key` prevents concurrent inserts for the
-- same idempotency key via ON CONFLICT handling.

CREATE TABLE IF NOT EXISTS "idempotency_cache" (
  "id"            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "cache_key"     varchar(768) NOT NULL,
  "payload_hash"  varchar(128) NOT NULL,
  "status"        integer      NOT NULL,
  "body"          text         NOT NULL,
  "headers"       jsonb        NOT NULL DEFAULT '{}',
  "created_at"    timestamptz  NOT NULL DEFAULT now(),
  "expires_at"    timestamptz  NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_cache_key_idx"
  ON "idempotency_cache" ("cache_key");

CREATE INDEX IF NOT EXISTS "idempotency_cache_expires_idx"
  ON "idempotency_cache" ("expires_at");
