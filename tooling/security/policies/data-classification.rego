# Nzila OS — Data Classification Policy
#
# PII detection and handling rules enforced via OPA.
# Ensures data is handled according to its classification level.

package nzila.data_classification

import rego.v1

# ── Classification levels (from os-core/classification) ──────────────────────

classification_levels := {
  "public":       0,
  "internal":     1,
  "confidential": 2,
  "cui":          3,  # Controlled Unclassified Information (max level)
}

# ── PII field patterns ───────────────────────────────────────────────────────

pii_field_patterns := [
  "email",
  "phone",
  "ssn",
  "social_security",
  "national_id",
  "passport",
  "date_of_birth",
  "dob",
  "address",
  "bank_account",
  "credit_card",
  "card_number",
  "cvv",
  "routing_number",
  "tax_id",
  "medical_record",
  "health_data",
  "biometric",
  "fingerprint",
  "face_id",
  "salary",
  "compensation",
]

# ── PII Detection ────────────────────────────────────────────────────────────

contains_pii if {
  some field in input.fields
  some pattern in pii_field_patterns
  contains(lower(field), pattern)
}

pii_fields contains field if {
  some field in input.fields
  some pattern in pii_field_patterns
  contains(lower(field), pattern)
}

# ── Classification requirements ──────────────────────────────────────────────

# PII data must be classified as at least "confidential"
default minimum_classification := "public"

minimum_classification := "confidential" if {
  contains_pii
}

# Financial data requires CUI classification
minimum_classification := "cui" if {
  some field in input.fields
  some financial_pattern in ["bank_account", "credit_card", "routing_number", "tax_id"]
  contains(lower(field), financial_pattern)
}

# ── Access control by classification ─────────────────────────────────────────

# Check if user's clearance level meets data classification
access_allowed if {
  user_level := classification_levels[input.user_clearance]
  data_level := classification_levels[input.data_classification]
  user_level >= data_level
}

# ── Handling requirements ────────────────────────────────────────────────────

handling_requirements contains "encryption_at_rest" if {
  classification_levels[input.data_classification] >= 2
}

handling_requirements contains "encryption_in_transit" if {
  classification_levels[input.data_classification] >= 1
}

handling_requirements contains "audit_logging" if {
  classification_levels[input.data_classification] >= 1
}

handling_requirements contains "pii_redaction_in_logs" if {
  contains_pii
}

handling_requirements contains "retention_limit_90_days" if {
  classification_levels[input.data_classification] >= 3
}

handling_requirements contains "access_review_quarterly" if {
  classification_levels[input.data_classification] >= 2
}

# ── Decision output ──────────────────────────────────────────────────────────

decision := {
  "contains_pii": contains_pii,
  "pii_fields": pii_fields,
  "minimum_classification": minimum_classification,
  "access_allowed": access_allowed,
  "handling_requirements": handling_requirements,
}
