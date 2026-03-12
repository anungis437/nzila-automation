"use client";

type EnvironmentName = "LOCAL" | "PREVIEW" | "STAGING" | "PRODUCTION";

interface DeploymentArtifact {
  artifact_digest: string;
  sbom_hash: string;
  attestation_ref: string;
  commit_sha: string;
  built_at: string;
  source_workflow: string;
}

interface DeploymentHistoryProps {
  artifacts: DeploymentArtifact[];
  environment: EnvironmentName;
}

export function DeploymentHistory({ artifacts, environment }: DeploymentHistoryProps) {
  if (artifacts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          No deployment history for {environment}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Deployment History — {environment}
        </h3>
      </div>
      <div className="divide-y divide-border">
        {artifacts.map((artifact, i) => (
          <div key={i} className="p-4 flex items-center justify-between text-sm">
            <div className="space-y-0.5">
              <p className="font-medium text-foreground">
                <code className="font-mono text-xs">{artifact.commit_sha.slice(0, 7)}</code>
              </p>
              <p className="text-xs text-muted-foreground">{artifact.source_workflow}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{new Date(artifact.built_at).toLocaleString()}</p>
              <p className="font-mono">{artifact.artifact_digest.slice(0, 12)}…</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
