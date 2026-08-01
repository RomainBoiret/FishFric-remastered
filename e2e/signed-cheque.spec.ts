import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { loginAsDemo, resetDemoReef } from "./helpers";

/**
 * Flagship E2E: issue a signed SVG, deposit once, reject a second cash of the same file.
 */
test("signed cheque can only be deposited once", async ({ page, request }) => {
  test.setTimeout(90_000);
  await resetDemoReef(request);
  await loginAsDemo(page);

  await page.getByRole("link", { name: "Deposit a cheque" }).click();
  await expect(page.getByRole("heading", { name: "Deposit a cheque" })).toBeVisible();

  const amount = "25.00";
  await page.getByLabel("Amount (CAD)").fill(amount);

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Issue & download signed cheque/i })
    .click();
  const download = await downloadPromise;
  const fileName = download.suggestedFilename();
  expect(fileName).toMatch(/^fishfric-cheque-25\.00/i);

  const downloadPath = path.join(
    test.info().outputDir,
    fileName || "issued-cheque.svg",
  );
  await download.saveAs(downloadPath);
  const svgText = fs.readFileSync(downloadPath, "utf8");
  expect(svgText).toContain("data-ff-sig=");
  expect(svgText).toContain("data-ff-cheque-id=");

  await expect(
    page.getByText(/Signed cheque matches the form - ready to submit/i),
  ).toBeVisible();

  await page.getByRole("button", { name: "Submit deposit" }).click();
  await expect(page.getByText(/Bank review in progress/i)).toBeVisible();
  // Stay on this page until credit runs (~1.8s review delay). Navigating early
  // clears the client timer and the deposit stays PENDING.
  await expect(
    page.locator(".ff-toast-success").filter({ hasText: /Deposit credited · \$25\.00/i }),
  ).toBeVisible({ timeout: 20_000 });

  await page.goto("/app");
  await expect(
    page.getByRole("link", { name: /Checking account.*2,475\.00/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Deposit a cheque" }).click();
  await page.getByLabel("Amount (CAD)").fill(amount);
  await page.getByRole("radio", { name: /Upload a photo/i }).check();
  await page.getByLabel("Cheque photo").setInputFiles(downloadPath);

  await expect(page.getByText(/Cheque face detected: \$25\.00/i)).toBeVisible();

  await page.getByRole("button", { name: "Submit deposit" }).click();
  await expect(
    page.getByText(/This cheque was already cashed/i).first(),
  ).toBeVisible();

  await page.goto("/app");
  await expect(
    page.getByRole("link", { name: /Checking account.*2,475\.00/i }),
  ).toBeVisible();
});
