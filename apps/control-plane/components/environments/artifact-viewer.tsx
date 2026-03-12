"use client";

interface DeploymentArtifact {
  artifact_digest: string;
  sbom_hash: string;
  attestation_ref: string;
  commit_sha: string;
  built_at: string;
  source_workflow: string;
}

interface ArtifactViewerProps {
  artifact: DeploymentArtifact;
}

export function ArtifactViewer({ artifact }: ArtifactViewerProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Artifact Details</h3>

      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Digest</dt>
          <dd className="font-mono text-xs break-all">{artifact.artifact_digest}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">SBOM Hash</dt>
          <dd className="font-mono text-xs break-all">{artifact.sbom_hash}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Attestation</dt>
          <dd className="font-mono text-xs break-all">{artifact.attestation_ref}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Commit</dt>
          <dd className="font-mono text-xs">{artifact.commit_sha}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Source Workflow</dt>
          <dd>{artifact.source_workflow}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Built At</dt>
          <dd>{new Date(artifact.built_at).toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  );
}
