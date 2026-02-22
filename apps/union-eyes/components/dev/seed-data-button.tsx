/**
 * Seed Data Button - Development Helper
 * 
 * Temporary button to populate test data for dashboard testing
 * Add this to your dashboard page temporarily to seed data
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
    if (!organizationId) {
      setResult({ success: false, message: "No organization selected" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/seed-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ success: true, message: data.message });
        // Refresh page after 2 seconds to show new data
        setTimeout(() => window.location.reload(), 2000);
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
        disabled={loading || !organizationId}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Test Data...
          </>
        ) : (
          <>
            <Database className="mr-2 h-4 w-4" />
            Seed Test Data
          </>
        )}
      </Button>

      {!organizationId && (
        <Alert>
          <AlertDescription>
            Please select an organization first
          </AlertDescription>
        </Alert>
      )}

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

