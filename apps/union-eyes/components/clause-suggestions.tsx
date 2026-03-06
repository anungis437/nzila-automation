"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search, Link as LinkIcon, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClauseResult {
  id: string;
  title: string;
  content: string;
  articleNumber: string | null;
  sectionNumber: string | null;
  similarity?: number;
}

interface ClauseSuggestionsProps {
  grievanceId: string;
  description?: string;
  onLink?: (clauseId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClauseSuggestions({
  grievanceId,
  description,
  onLink,
}: ClauseSuggestionsProps) {
  const [clauses, setClauses] = useState<ClauseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(description ?? "");
  const [error, setError] = useState<string | null>(null);

  async function findClauses() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/grievances/${grievanceId}/suggest-clauses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: searchText }),
      });
      const json = await res.json();
      if (json.data) {
        setClauses(json.data);
      } else {
        setError(json.error?.message ?? "Failed to find clauses");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLink(clauseId: string) {
    setLinking(clauseId);
    try {
      const res = await fetch(`/api/grievances/${grievanceId}/suggest-clauses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: searchText, linkClauseId: clauseId }),
      });
      if (res.ok) {
        onLink?.(clauseId);
      }
    } finally {
      setLinking(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BookOpen className="h-4 w-4" /> Contract Clause Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search bar */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Describe the issue or paste grievance text…"
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button
            onClick={findClauses}
            disabled={loading || !searchText.trim()}
            className="flex items-center gap-1 rounded bg-purple-600 px-3 py-2 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
            {loading ? "Searching…" : "Find Clauses"}
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {clauses.length === 0 && !loading && (
          <p className="text-sm text-gray-400">
            Enter grievance details above and click &quot;Find Clauses&quot; to search CBA
            articles by semantic similarity or keyword match.
          </p>
        )}

        {clauses.length > 0 && (
          <ul className="space-y-3">
            {clauses.map((clause) => (
              <li
                key={clause.id}
                className="rounded border p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{clause.title}</p>
                    {(clause.articleNumber || clause.sectionNumber) && (
                      <p className="text-xs text-gray-500">
                        {clause.articleNumber && `Art. ${clause.articleNumber}`}
                        {clause.sectionNumber && ` § ${clause.sectionNumber}`}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-600 line-clamp-3">
                      {clause.content}
                    </p>
                    {clause.similarity !== undefined && (
                      <p className="mt-1 text-xs text-purple-600">
                        Relevance: {(clause.similarity * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleLink(clause.id)}
                    disabled={linking === clause.id}
                    className="ml-3 flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                  >
                    {linking === clause.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <LinkIcon className="h-3 w-3" />
                    )}
                    Link
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
