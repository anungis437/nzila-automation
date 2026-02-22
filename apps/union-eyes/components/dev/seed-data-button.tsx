/**
 * Seed Data Button - Development Helper
 * 
 * Seeds the CLC organizational hierarchy (CLC + 13 federations + 12 national affiliates).
 * Calls /api/admin/seed-test-data — idempotent, safe to press multiple times.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOrganizationId } from "@/lib/hooks/use-organization";
import { Loader2, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SeedDataButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const organizationId = useOrganizationId();

  const handleSeedData = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/seed-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(organizationId && { 'x-organization-id': organizationId }),
        },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, message: data.error || "Failed to seed data" });
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : "Error seeding data" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleSeedData}
        disabled={loading}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Seeding CLC hierarchy...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            Seed CLC Hierarchy
          </>
        )}
      </Button>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <AlertDescription>
            {result.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

