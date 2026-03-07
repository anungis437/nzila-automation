// ============================================================================
// REPRESENTATION PROTOCOL — TYPES
// ============================================================================
// Per-union configuration for who can file, manage, and represent grievances.
//
// Domain insight (from CAPE / CUPE stakeholder feedback):
//   - CAPE: Stewards are floor-level only. Labor Relations Officers handle
//     all grievance filing and representation.
//   - CUPE:  National Representatives bring forward grievances. Stewards
//     liaise with management but don't represent.
//   - Other unions: Stewards handle full representation end-to-end.
//
// The protocol is stored as a JSON value in `org_configurations` with
// category='grievance' and key='representation_protocol'.
// ============================================================================

/**
 * Who the primary grievance representative is within a union.
 *
 * - steward:       Stewards file and manage grievances (traditional model)
 * - lro:           Labor Relations Officer handles all representation (e.g. CAPE)
 * - national_rep:  National Representative files grievances (e.g. CUPE)
 * - officer:       Union Officer handles cases directly
 */
export type RepresentativeType = "steward" | "lro" | "national_rep" | "officer";

/**
 * What a steward is allowed to do in the grievance lifecycle.
 * Controls UI affordances and API authorization.
 */
export interface StewardPermissions {
  /** Steward can formally file new grievances */
  canFileGrievance: boolean;
  /** Steward can appear as primary representative in hearings/meetings */
  canRepresent: boolean;
  /** Steward can be auto-assigned to cases by the assignment engine */
  canBeAssigned: boolean;
  /** Steward can communicate with the employer on behalf of the union */
  canContactEmployer: boolean;
  /** Steward can escalate cases to the next step without officer approval */
  canEscalate: boolean;
}

/**
 * Full representation protocol for a union organization.
 * One protocol per org, stored in `org_configurations`.
 */
export interface RepresentationProtocol {
  /** Schema version for forward-compatible migrations */
  version: 1;

  /** Who is the primary representative for grievances */
  primaryRepresentative: RepresentativeType;

  /** What stewards are allowed to do (even if not primary representative) */
  stewardPermissions: StewardPermissions;

  /** Display label for the primary representative role (org-customizable) */
  representativeLabel: string;

  /** Display label for steward role (org-customizable) */
  stewardLabel: string;

  /** Minimum role level required to file a grievance (maps to ROLE_HIERARCHY) */
  minimumFilingRole: string;

  /** Minimum role level required to be assigned as primary representative */
  minimumRepresentationRole: string;

  /** Optional notes about the union's protocol (internal documentation) */
  notes?: string;
}

// ============================================================================
// PRESETS — Named protocol configurations for known unions
// ============================================================================

/**
 * Traditional model: stewards handle everything.
 * Default for unions without a custom protocol.
 */
export const PROTOCOL_STEWARD_LED: RepresentationProtocol = {
  version: 1,
  primaryRepresentative: "steward",
  stewardPermissions: {
    canFileGrievance: true,
    canRepresent: true,
    canBeAssigned: true,
    canContactEmployer: true,
    canEscalate: true,
  },
  representativeLabel: "Steward",
  stewardLabel: "Steward",
  minimumFilingRole: "steward",
  minimumRepresentationRole: "steward",
};

/**
 * CAPE model: Labor Relations Officers handle representation.
 * Stewards are floor contacts only — they cannot file or represent.
 */
export const PROTOCOL_LRO_LED: RepresentationProtocol = {
  version: 1,
  primaryRepresentative: "lro",
  stewardPermissions: {
    canFileGrievance: false,
    canRepresent: false,
    canBeAssigned: false,
    canContactEmployer: false,
    canEscalate: false,
  },
  representativeLabel: "Labour Relations Officer",
  stewardLabel: "Steward",
  minimumFilingRole: "officer",
  minimumRepresentationRole: "officer",
  notes: "CAPE model — stewards are workplace contacts only, LROs handle all representation.",
};

/**
 * CUPE model: National Representatives file and manage cases.
 * Stewards liaise with management but don't formally represent.
 */
export const PROTOCOL_NATIONAL_REP_LED: RepresentationProtocol = {
  version: 1,
  primaryRepresentative: "national_rep",
  stewardPermissions: {
    canFileGrievance: false,
    canRepresent: false,
    canBeAssigned: false,
    canContactEmployer: true, // Can talk to management informally
    canEscalate: false,
  },
  representativeLabel: "National Representative",
  stewardLabel: "Steward",
  minimumFilingRole: "national_officer",
  minimumRepresentationRole: "national_officer",
  notes: "CUPE model — national representatives handle all grievances, stewards liaise only.",
};

/**
 * Officer-led model: union officers handle cases directly.
 * Stewards assist but don't lead.
 */
export const PROTOCOL_OFFICER_LED: RepresentationProtocol = {
  version: 1,
  primaryRepresentative: "officer",
  stewardPermissions: {
    canFileGrievance: false,
    canRepresent: false,
    canBeAssigned: true, // Can be assigned as secondary
    canContactEmployer: true,
    canEscalate: false,
  },
  representativeLabel: "Union Officer",
  stewardLabel: "Steward",
  minimumFilingRole: "officer",
  minimumRepresentationRole: "officer",
};

/** All available presets keyed by representative type */
export const PROTOCOL_PRESETS: Record<RepresentativeType, RepresentationProtocol> = {
  steward: PROTOCOL_STEWARD_LED,
  lro: PROTOCOL_LRO_LED,
  national_rep: PROTOCOL_NATIONAL_REP_LED,
  officer: PROTOCOL_OFFICER_LED,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Returns true if the given protocol allows stewards to file grievances.
 */
export function canStewardFile(protocol: RepresentationProtocol): boolean {
  return protocol.stewardPermissions.canFileGrievance;
}

/**
 * Returns true if the given protocol allows stewards to represent in hearings.
 */
export function canStewardRepresent(protocol: RepresentationProtocol): boolean {
  return protocol.stewardPermissions.canRepresent;
}

/**
 * Resolve a human-readable label for the primary assignee action.
 * e.g. "Assign Labour Relations Officer" or "Assign Steward"
 */
export function getAssignActionLabel(protocol: RepresentationProtocol): string {
  return `Assign ${protocol.representativeLabel}`;
}

/**
 * Resolve the description for the assignment action based on protocol.
 */
export function getAssignActionDescription(protocol: RepresentationProtocol): string {
  const actor = protocol.representativeLabel.toLowerCase();
  return `A ${actor} has not been assigned to this case yet.`;
}

/**
 * Returns the assignment engine role string that maps to the protocol's
 * primary representative. This bridges the protocol to the DB assignment_role.
 */
export function getPrimaryAssignmentRole(
  protocol: RepresentationProtocol
): string {
  switch (protocol.primaryRepresentative) {
    case "steward":
      return "steward";
    case "lro":
      return "labor_relations_officer";
    case "national_rep":
      return "national_representative";
    case "officer":
      return "primary_officer";
  }
}
