-- Migration 0004: Audit Events Immutability Enforcement (REM-11)
--
-- Adds PostgreSQL-level triggers that prevent any UPDATE or DELETE on the
-- audit_events table. Combined with the application-layer SHA-256 hash chain,
-- this ensures audit records cannot be quietly altered even by a DBA with a
-- direct database connection.
--
-- Defense-in-depth rationale:
--   * Application layer: computeEntryHash() + verifyEntityAuditChain() detect
--     any post-insert mutation by hash mismatch.
--   * DB layer (this migration): triggers raise an exception at the DB engine,
--     preventing the mutation from being committed in the first place.
--
-- Enterprise compliance note (SOC 2 Type II, ISO 27001):
--   This migration provides the "DB-level immutability" proof required when
--   auditors ask: "Can your DBAs silently delete audit records?" The answer is
--   now unambiguously NO — any attempt raises a DB exception.

--> statement-breakpoint

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION
    'audit_events rows are immutable: % operation is not permitted. '
    'Audit records may only be inserted, never modified or deleted. '
    'Contact compliance@nzila.co if this is a legitimate data-correction need.',
    TG_OP;
END;
$$;

--> statement-breakpoint

CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE ON "audit_events"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_mutation();

--> statement-breakpoint

CREATE TRIGGER audit_events_no_delete
  BEFORE DELETE ON "audit_events"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_mutation();
