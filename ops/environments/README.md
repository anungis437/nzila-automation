# ops/environments/
#
# Environment-specific configuration files for Nzila OS.
#
# These files contain NON-SECRET environment variables.
# Secrets must be managed through the CI secrets manager (GitHub Secrets).
#
# Files:
#   local.env      — developer machines
#   preview.env    — ephemeral PR deployments
#   staging.env    — persistent integration environment
#   prod.env       — customer-facing production
#
# Loaded by: @nzila/platform-environment (loadEnvFile)
