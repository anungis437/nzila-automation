-- Migration: 0078_force_dues_transactions_rls
-- Purpose: Enforce RLS for dues_transactions to ensure policies apply in tests
-- Date: 2026-02-10

ALTER TABLE dues_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dues_transactions FORCE ROW LEVEL SECURITY;
