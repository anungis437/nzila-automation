"use client";

import { EnvironmentBadge } from "./environment-badge";

type EnvironmentName = "LOCAL" | "PREVIEW" | "STAGING" | "PRODUCTION";

interface EnvironmentConfig {
  environment: EnvironmentName;
  service: string;
  deployment_region: string;
  observability_namespace: string;
  evidence_namespace: string;
  allow_ai_experimental: boolean;
  allow_debug_logging: boolean;
  protected_environment: boolean;
}

interface DeploymentArtifact {
  artifact_digest: string;
  sbom_hash: string;
  attestation_ref: string;
  commit_sha: string;
  built_at: string;
  source_workflow: string;
}

interface GovernanceSnapshot {
  environment: EnvironmentName;
  commit: string;
  artifact_digest: string;
  sbom_hash: string;
  policy_engine_status: string;
  change_record_ref: string;
  timestamp: string;
}

interface FeatureFlag {
  name: string;
  enabled: boolean;
  environments: readonly EnvironmentName[];
}

interface EnvironmentCardProps {
  environment: EnvironmentName;
  config: EnvironmentConfig;
  latestArtifact: DeploymentArtifact | null;
  latestSnapshot: GovernanceSnapshot | null;
  activeFlags: FeatureFlag[];
}

export function EnvironmentCard({
  environment,
  config,
  latestArtifact,
  latestSnapshot,
  activeFlags,
}: EnvironmentCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{environment}</h3>
        <EnvironmentBadge environment={environment} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Region</p>
          <p className="font-medium">{config.deployment_region}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Protected</p>
          <p className="font-medium">{config.protected_environment ? "Yes" : "No"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Debug Logging</p>
          <p className="font-medium">{config.allow_debug_logging ? "Enabled" : "Disabled"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">AI Experimental</p>
          <p className="font-medium">{config.allow_ai_experimental ? "Allowed" : "Blocked"}</p>
        </div>
      </div>

      {latestArtifact && (
        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-sm font-medium text-foreground">Latest Artifact</p>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Commit: <code className="font-mono">{latestArtifact.commit_sha.slice(0, 7)}</code></p>
            <p>Digest: <code className="font-mono">{latestArtifact.artifact_digest.slice(0, 12)}…</code></p>
            <p>Built: {new Date(latestArtifact.built_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {latestSnapshot && (
        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-sm font-medium text-foreground">Governance</p>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Policy: <span className="font-medium text-emerald-600">{latestSnapshot.policy_engine_status}</span></p>
            <p>Snapshot: {new Date(latestSnapshot.timestamp).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {activeFlags.length > 0 && (
        <div className="border-t border-border pt-3 space-y-1">
          <p className="text-sm font-medium text-foreground">Feature Flags</p>
          <div className="flex flex-wrap gap-1">
            {activeFlags.map((flag) => (
              <span
                key={flag.name}
                className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400"
              >
                {flag.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
