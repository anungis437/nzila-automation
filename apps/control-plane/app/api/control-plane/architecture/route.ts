import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

export const dynamic = "force-dynamic";

function fileExists(p: string): boolean {
  return fs.existsSync(p);
}

function countTestFiles(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let count = 0;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        entry.name !== ".next"
      ) {
        walk(full);
      } else if (entry.isFile() && /\.test\.tsx?$/.test(entry.name)) {
        count++;
      }
    }
  };
  walk(dirPath);
  return count;
}

const TARGET_APPS = [
  "union-eyes",
  "shop-quoter",
  "zonga",
  "cfo",
  "partners",
  "web",
  "console",
];

export async function GET() {
  const root = path.resolve(process.cwd(), "../..");
  const packagesDir = path.join(root, "packages");

  // ── Package stats ─────────────────────────────

  let totalPackages = 0;
  let withMeta = 0;
  let deprecated = 0;
  const categories: Record<string, number> = {};

  if (fs.existsSync(packagesDir)) {
    const dirs = fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() &&
          fs.existsSync(path.join(packagesDir, d.name, "package.json"))
      );

    totalPackages = dirs.length;

    for (const dir of dirs) {
      const metaPath = path.join(packagesDir, dir.name, "package.meta.json");
      if (fs.existsSync(metaPath)) {
        withMeta++;
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        const cat = meta.category || "UNKNOWN";
        categories[cat] = (categories[cat] || 0) + 1;
        if (meta.deprecated) deprecated++;
      }
    }
  }

  // ── App compliance ────────────────────────────

  const apps = TARGET_APPS.map((app) => {
    const appDir = path.join(root, "apps", app);
    if (!fs.existsSync(appDir)) {
      return { app, checks: 0, passed: 0, level: "MISSING" as const };
    }

    let checks = 0;
    let passed = 0;

    const assert = (ok: boolean) => {
      checks++;
      if (ok) passed++;
    };

    assert(
      fileExists(path.join(appDir, "app", "api", "health", "route.ts"))
    );
    assert(
      fileExists(path.join(appDir, "app", "api", "metrics", "route.ts")) ||
        fileExists(path.join(appDir, "app", "api", "analytics", "route.ts"))
    );
    assert(
      fileExists(
        path.join(appDir, "app", "api", "evidence", "export", "route.ts")
      ) || fileExists(path.join(appDir, "lib", "evidence.ts"))
    );
    assert(
      fileExists(path.join(appDir, "lib", "policy-enforcement.ts")) ||
        fileExists(path.join(appDir, "lib", "policyEnforcement.ts")) ||
        fileExists(path.join(appDir, "lib", "services", "policy-engine.ts"))
    );
    assert(fileExists(path.join(appDir, "docs", "DOMAIN_MODEL.md")));
    assert(countTestFiles(appDir) >= 3);

    const pct = checks > 0 ? Math.round((passed / checks) * 100) : 0;
    const level =
      pct === 100 ? "FULL" : pct >= 50 ? "PARTIAL" : "NON_COMPLIANT";

    return { app, checks, passed, level };
  });

  // ── Summary ───────────────────────────────────

  const fullApps = apps.filter((a) => a.level === "FULL").length;
  const partialApps = apps.filter((a) => a.level === "PARTIAL").length;

  return NextResponse.json({
    packages: {
      total: totalPackages,
      withMeta,
      deprecated,
      categories,
      metaCoverage:
        totalPackages > 0
          ? Math.round((withMeta / totalPackages) * 100)
          : 0,
    },
    apps: {
      items: apps,
      fullCompliance: fullApps,
      partialCompliance: partialApps,
      total: apps.length,
    },
    overall: {
      metaCoverage:
        totalPackages > 0
          ? Math.round((withMeta / totalPackages) * 100)
          : 0,
      appComplianceRate:
        apps.length > 0 ? Math.round((fullApps / apps.length) * 100) : 0,
      deprecatedPackages: deprecated,
    },
  });
}
