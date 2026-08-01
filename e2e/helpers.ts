import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const RESET_SECRET =
  process.env.CRON_SECRET ??
  process.env.DEMO_RESET_SECRET ??
  "ci-test-secret";

export async function resetDemoReef(request: APIRequestContext) {
  const response = await request.post("/api/demo/reset", {
    headers: { Authorization: `Bearer ${RESET_SECRET}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

export async function loginAsDemo(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).first().click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.getByRole("heading", { name: /Hello, Aqua/i })).toBeVisible();
}
