"use client";

import { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

interface QueryResult {
  answer: string;
  confidence: number;
  evidenceRefs: { source: string; type: string; summary: string }[];
  humanReviewRequired: boolean;
}

/**
 * Client-side intelligence query box.
 * Submits natural-language questions to the intelligence query API.
 */
export function IntelligenceQueryBox() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/control-plane/intelligence/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        setError("Query failed. Please try again.");
        return;
      }

      const data = await res.json();
      if (data.ok) {
        setResult(data.data);
      } else {
        setError(data.error ?? "Unknown error");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Search className="h-4 w-4" />
        Intelligence Query
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Why did grievances increase last month?"
          className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Querying…" : "Ask"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-md bg-muted p-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                Confidence: {(result.confidence * 100).toFixed(0)}%
              </p>
              {result.humanReviewRequired && (
                <StatusBadge status="degraded" label="Human review required" />
              )}
            </div>
            <p className="text-sm text-foreground">{result.answer}</p>
          </div>

          {result.evidenceRefs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Evidence References
              </p>
              <div className="space-y-1">
                {result.evidenceRefs.map((ref, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground flex items-center gap-2"
                  >
                    <span className="bg-muted px-1.5 py-0.5 rounded">{ref.type}</span>
                    <span>{ref.source}</span>
                    <span className="text-foreground">{ref.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
