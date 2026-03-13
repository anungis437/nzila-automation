import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/loading";
import { SummaryCard } from "@/components/ui/summary-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Boxes, Package, AlertTriangle, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Architecture — Nzila OS Control Plane",
  description:
    "Architecture governance: package ownership, app compliance, and dependency health.",
};

interface ArchSummary {
  packages: {
    total: number;
    withMeta: number;
    deprecated: number;
    categories: Record<string, number>;
    metaCoverage: number;
  };
  apps: {
    items: Array<{
      app: string;
      checks: number;
      passed: number;
      level: string;
    }>;
    fullCompliance: number;
    partialCompliance: number;
    total: number;
  };
  overall: {
    metaCoverage: number;
    appComplianceRate: number;
    deprecatedPackages: number;
  };
}

async function getArchitectureData(): Promise<ArchSummary> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3200";
  const res = await fetch(`${baseUrl}/api/control-plane/architecture`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch architecture data");
  }
  return res.json();
}

async function ArchitectureContent() {
  const data = await getArchitectureData();

  return (
    <>
      {/* Top-level summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Package Meta Coverage"
          icon={<Package className="h-5 w-5" />}
          value={`${data.overall.metaCoverage}%`}
          subtitle={`${data.packages.withMeta}/${data.packages.total} packages`}
        />
        <SummaryCard
          title="App Compliance"
          icon={<CheckCircle className="h-5 w-5" />}
          value={`${data.overall.appComplianceRate}%`}
          subtitle={`${data.apps.fullCompliance}/${data.apps.total} fully compliant`}
        />
        <SummaryCard
          title="Deprecated Packages"
          icon={<AlertTriangle className="h-5 w-5" />}
          value={data.overall.deprecatedPackages}
          subtitle="Pending migration"
        />
        <SummaryCard
          title="Total Packages"
          icon={<Boxes className="h-5 w-5" />}
          value={data.packages.total}
          subtitle={`${Object.keys(data.packages.categories).length} categories`}
        />
      </div>

      {/* Category breakdown */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Package Categories
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Category
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.packages.categories)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <tr key={cat} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{cat}</td>
                    <td className="text-right px-4 py-3">{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* App compliance table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          App Gold Standard Compliance
        </h2>
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  App
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Checks
                </th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                  Level
                </th>
              </tr>
            </thead>
            <tbody>
              {data.apps.items.map((app) => (
                <tr
                  key={app.app}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{app.app}</td>
                  <td className="text-center px-4 py-3">
                    {app.passed}/{app.checks}
                  </td>
                  <td className="text-center px-4 py-3">
                    <StatusBadge
                      status={
                        app.level === "FULL"
                          ? "healthy"
                          : app.level === "PARTIAL"
                          ? "warning"
                          : "critical"
                      }
                      label={app.level}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function ArchitecturePage() {
  return (
    <>
      <PageHeader
        title="Architecture"
        description="Package ownership, dependency health, and app gold standard compliance."
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }
      >
        <ArchitectureContent />
      </Suspense>
    </>
  );
}
