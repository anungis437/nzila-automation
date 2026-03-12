import { test, expect } from "@playwright/test";

test.describe("Control Plane — Smoke Tests", () => {
  test("root redirects to /overview", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/overview/);
  });

  test("overview page renders platform health card", async ({ page }) => {
    await page.goto("/overview");
    await expect(page.getByText("Platform Health")).toBeVisible();
  });

  test("governance page renders status section", async ({ page }) => {
    await page.goto("/governance");
    await expect(page.getByText("Governance")).toBeVisible();
  });

  test("anomalies page renders anomaly cards", async ({ page }) => {
    await page.goto("/anomalies");
    await expect(page.getByText("Anomalies")).toBeVisible();
  });

  test("procurement page renders pack details", async ({ page }) => {
    await page.goto("/procurement");
    await expect(page.getByText("Pack ID")).toBeVisible();
  });

  test("sidebar navigation works across all routes", async ({ page }) => {
    const routes = [
      { name: "Overview", url: "/overview" },
      { name: "Governance", url: "/governance" },
      { name: "Intelligence", url: "/intelligence" },
      { name: "Anomalies", url: "/anomalies" },
      { name: "Agents", url: "/agents" },
      { name: "Modules", url: "/modules" },
      { name: "Procurement", url: "/procurement" },
    ];

    await page.goto("/overview");

    for (const route of routes) {
      await page.getByRole("link", { name: route.name }).click();
      await expect(page).toHaveURL(new RegExp(route.url));
    }
  });

  test("API routes return valid JSON", async ({ request }) => {
    const endpoints = [
      "/api/control-plane/governance/status",
      "/api/control-plane/governance/timeline",
      "/api/control-plane/intelligence/summary",
      "/api/control-plane/intelligence/signals",
      "/api/control-plane/anomalies",
      "/api/control-plane/agents/recommendations",
      "/api/control-plane/modules",
      "/api/control-plane/procurement/latest",
      "/api/control-plane/procurement/public-key",
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.ok()).toBe(true);
      const json = await response.json();
      expect(json.ok).toBe(true);
    }
  });
});
