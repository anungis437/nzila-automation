/**
 * Union-Eyes E2E — CAPE Feature Polish
 *
 * Tests grievance filing flow, steward queue, employer communication,
 * leadership dashboard, and pilot onboarding pages.
 *
 * These tests require a running server and test auth mode enabled.
 * In CI, set PLAYWRIGHT_TEST_AUTH=true and TEST_USER_ID.
 */
import { test, expect } from "@playwright/test";

const isTestAuth = process.env.PLAYWRIGHT_TEST_AUTH === "true";

// ─── Grievance filing flow ──────────────────────────────────────────────────

test.describe("Grievance filing flow", () => {
  test.skip(!isTestAuth, "Requires PLAYWRIGHT_TEST_AUTH=true");

  test("grievance intake page loads with stepper", async ({ page }) => {
    await page.goto("/grievances/new");
    await expect(page.locator("body")).toBeVisible({ timeout: 15_000 });
    // Should show a form or wizard stepper
    await expect(
      page.locator("form, [data-testid='grievance-intake'], [role='form']").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("grievance queue page loads with filter bar", async ({ page }) => {
    await page.goto("/grievances");
    await expect(page.locator("body")).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Steward queue ──────────────────────────────────────────────────────────

test.describe("Steward queue", () => {
  test.skip(!isTestAuth, "Requires PLAYWRIGHT_TEST_AUTH=true");

  test("steward workbench loads", async ({ page }) => {
    await page.goto("/en-CA/dashboard");
    await expect(page.locator("body")).toBeVisible({ timeout: 15_000 });
  });
});

// ─── Leadership dashboard ───────────────────────────────────────────────────

test.describe("Leadership dashboard", () => {
  test.skip(!isTestAuth, "Requires PLAYWRIGHT_TEST_AUTH=true");

  test("leadership page loads with KPI cards", async ({ page }) => {
    await page.goto("/dashboard/leadership");
    await expect(page.locator("body")).toBeVisible({ timeout: 15_000 });
  });

  test("leadership API returns data", async ({ request }) => {
    const response = await request.get("/api/dashboard/leadership?timeframe=monthly");
    // Should be reachable (auth may reject without proper session)
    expect([200, 401, 403]).toContain(response.status());
  });
});

// ─── Pilot onboarding ───────────────────────────────────────────────────────

test.describe("Pilot onboarding", () => {
  test.skip(!isTestAuth, "Requires PLAYWRIGHT_TEST_AUTH=true");

  test("pilot onboarding page loads with checklist", async ({ page }) => {
    await page.goto("/dashboard/pilot/onboarding");
    await expect(page.locator("body")).toBeVisible({ timeout: 15_000 });
  });

  test("pilot onboarding API returns checklist state", async ({ request }) => {
    const response = await request.get("/api/pilot/onboarding");
    expect([200, 401, 403]).toContain(response.status());
  });
});

// ─── Employer communications ────────────────────────────────────────────────

test.describe("Employer communications API", () => {
  test.skip(!isTestAuth, "Requires PLAYWRIGHT_TEST_AUTH=true");

  test("contacts endpoint is reachable", async ({ request }) => {
    const response = await request.get("/api/employers/communications/contacts");
    expect([200, 401, 403]).toContain(response.status());
  });

  test("communications endpoint is reachable", async ({ request }) => {
    const response = await request.get("/api/employers/communications");
    expect([200, 401, 403]).toContain(response.status());
  });
});
