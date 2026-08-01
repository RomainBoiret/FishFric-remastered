import { expect, test, type APIRequestContext } from "@playwright/test";

const RESET_SECRET =
  process.env.CRON_SECRET ??
  process.env.DEMO_RESET_SECRET ??
  "ci-test-secret";

async function resetDemoReef(request: APIRequestContext) {
  const response = await request.post("/api/demo/reset", {
    headers: { Authorization: `Bearer ${RESET_SECRET}` },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

/**
 * One serial recruiter smoke path against the seeded demo reef.
 * Starts with API reset so retries / local re-runs stay deterministic.
 */
test("recruiter demo journey", async ({ page, request }) => {
  await resetDemoReef(request);

  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).first().click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.getByRole("heading", { name: /Hello, Aqua/i })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Checking account.*2,450\.00/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset demo reef" })).toBeVisible();

  await page.getByRole("link", { name: "Between accounts" }).click();
  await expect(page.getByRole("heading", { name: "Between accounts" })).toBeVisible();
  await page.getByLabel("Amount (CAD)").fill("10.00");
  await page.getByRole("button", { name: "Transfer" }).click();
  await expect(page.locator(".ff-toast-success")).toContainText(
    "Transfer completed.",
  );

  await page.goto("/app");
  await page.getByRole("link", { name: "Send to a friend" }).click();
  await expect(page.getByRole("heading", { name: "Bottle drop" })).toBeVisible();

  const acceptForm = page.getByRole("form", {
    name: /Accept transfer from Nemo Friend/i,
  });
  await expect(acceptForm).toBeVisible();
  await acceptForm.getByLabel("Answer").fill("shark");
  await acceptForm.getByRole("button", { name: "Accept" }).click();
  // RSC revalidate can drop the toast; assert the claim cleared the inbox instead.
  await expect(page.getByText("No bottles washing ashore right now.")).toBeVisible();
  await expect(page.getByLabel("From")).toContainText("$2,480.00");

  await page.goto("/app");
  await page.getByRole("link", { name: "Pay bills" }).click();
  await expect(page.getByRole("heading", { name: "Pay a bill" })).toBeVisible();

  await page.goto("/app");
  await page.getByRole("link", { name: "Deposit a cheque" }).click();
  await expect(page.getByRole("heading", { name: "Deposit a cheque" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Issue & download signed cheque/i }),
  ).toBeVisible();

  await page.goto("/app");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset demo reef" }).click();
  // Prefer balance restore over toast — RSC revalidate can drop client toasts.
  await expect(
    page.getByRole("link", { name: /Checking account.*2,450\.00/i }),
  ).toBeVisible({ timeout: 20_000 });
});
