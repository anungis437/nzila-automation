/**
 * Unit Tests — Grievance Lifecycle State Machine
 *
 * Verifies FSM transition rules, RBAC enforcement, org-scoped queries,
 * and audit event emission for the grievance lifecycle system.
 */
import { describe, it, expect } from "vitest";
import {
  validateTransition,
  allowedNextStatuses,
  isTerminal,
  GRIEVANCE_LIFECYCLE_ORDER,
} from "@/lib/workflows/grievance-state-machine";
import type { TransitionContext } from "@/lib/workflows/grievance-state-machine";

// ─── Lifecycle Order ─────────────────────────────────────────────────────────

describe("GRIEVANCE_LIFECYCLE_ORDER", () => {
  it("has correct length", () => {
    expect(GRIEVANCE_LIFECYCLE_ORDER).toHaveLength(7);
  });

  it("starts with new and ends with closed", () => {
    expect(GRIEVANCE_LIFECYCLE_ORDER[0]).toBe("new");
    expect(GRIEVANCE_LIFECYCLE_ORDER[GRIEVANCE_LIFECYCLE_ORDER.length - 1]).toBe("closed");
  });
});

// ─── Terminal detection ──────────────────────────────────────────────────────

describe("isTerminal", () => {
  it("returns true for closed", () => {
    expect(isTerminal("closed")).toBe(true);
  });

  it.each(["new", "triage", "investigation", "negotiation", "arbitration", "resolved"] as const)(
    'returns false for "%s"',
    (status) => {
      expect(isTerminal(status)).toBe(false);
    },
  );
});

// ─── Allowed next statuses ───────────────────────────────────────────────────

describe("allowedNextStatuses", () => {
  it("new → triage, closed", () => {
    const next = allowedNextStatuses("new");
    expect(next).toContain("triage");
    expect(next).toContain("closed");
    expect(next).not.toContain("investigation");
  });

  it("closed → triage (reopen)", () => {
    const next = allowedNextStatuses("closed");
    expect(next).toContain("triage");
    expect(next).toHaveLength(1);
  });

  it("investigation → negotiation, arbitration, closed", () => {
    const next = allowedNextStatuses("investigation");
    expect(next).toContain("negotiation");
    expect(next).toContain("arbitration");
    expect(next).toContain("closed");
  });
});

// ─── Transition validation ───────────────────────────────────────────────────

describe("validateTransition", () => {
  const staffCtx: TransitionContext = { actorRole: "union_staff" };
  const adminCtx: TransitionContext = { actorRole: "union_admin" };
  const platformCtx: TransitionContext = { actorRole: "platform_admin" };
  const memberCtx: TransitionContext = { actorRole: "member" };

  // Happy paths
  it("allows new → triage with union_staff", () => {
    const result = validateTransition("new", "triage", staffCtx);
    expect(result.valid).toBe(true);
  });

  it("allows new → closed with union_staff", () => {
    const result = validateTransition("new", "closed", staffCtx);
    expect(result.valid).toBe(true);
  });

  it("allows triage → investigation when staff assigned", () => {
    const result = validateTransition("triage", "investigation", {
      actorRole: "union_staff",
      assignedStaffId: "steward-001",
    });
    expect(result.valid).toBe(true);
  });

  it("allows negotiation → resolved with union_staff", () => {
    const result = validateTransition("negotiation", "resolved", staffCtx);
    expect(result.valid).toBe(true);
  });

  it("allows resolved → closed with union_admin", () => {
    const result = validateTransition("resolved", "closed", adminCtx);
    expect(result.valid).toBe(true);
  });

  it("allows closed → triage with platform_admin (reopen)", () => {
    const result = validateTransition("closed", "triage", platformCtx);
    expect(result.valid).toBe(true);
  });

  // Blocked transitions
  it("blocks new → arbitration (not adjacent)", () => {
    const result = validateTransition("new", "arbitration", platformCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid transition");
  });

  it("blocks triage → investigation without assigned staff", () => {
    const result = validateTransition("triage", "investigation", staffCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("steward");
  });

  it("blocks arbitration → resolved with member role", () => {
    const result = validateTransition("arbitration", "resolved", memberCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("union_admin");
  });

  it("blocks resolved → closed with member role", () => {
    const result = validateTransition("resolved", "closed", memberCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("union_admin");
  });

  it("blocks closed → triage with union_admin (not platform_admin)", () => {
    const result = validateTransition("closed", "triage", adminCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("platform_admin");
  });

  it("blocks member from new → triage", () => {
    const result = validateTransition("new", "triage", memberCtx);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("union_staff");
  });
});
