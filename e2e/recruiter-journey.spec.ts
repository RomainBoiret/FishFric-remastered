import { expect, test } from "@playwright/test";
import { loginAsDemo, resetDemoReef } from "./helpers";

/**
 * Recruiter smoke (not a full money-path suite).
 * Covers: demo login, transfer, P2P accept, that bills/deposit routes render,
 * and demo reset. Full signed-cheque cycle lives in `signed-cheque.spec.ts`.
 */
test("recruiter smoke: demo login, transfer, P2P, surfaces, reset", async ({
  page,
  request,
}) => {
  await resetDemoReef(request);
  await loginAsDemo(page);

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
  await expect(
    page.getByRole("link", { name: /Checking account.*2,450\.00/i }),
  ).toBeVisible({ timeout: 20_000 });
});
