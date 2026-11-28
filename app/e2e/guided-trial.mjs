import assert from "node:assert/strict"
import { chromium } from "playwright"

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await page.goto(process.argv[2] ?? "https://travelseal.vercel.app/demo")
  await page.getByText("Replay mode", { exact: true }).waitFor()
  const button = (name) => page.getByRole("button", { name, exact: true })
  await page.getByLabel(/20% smaller/).check()
  await button("Review transfer").click()
  const privacy = page.getByRole("region", { name: "Privacy preview" })
  await privacy.getByText("Customer identity fields are encrypted.").waitFor()
  await button("Quarterly auditor").click()
  await privacy.getByText("Born 1990-01-01").waitFor()
  await button("Confirm simulation").click()
  const timeline = page.getByRole("list", { name: "Transfer timeline" })
  await timeline.getByText(/Exchange rejected/).waitFor()
  await privacy.getByText("DECRYPTION_FAILED").waitFor()
  await button("Retry with matching amounts").click()
  await timeline.getByText(/Exchange accepted/).waitFor()
  for (const role of ["Quarterly auditor", "Receiving exchange"]) {
    await button(role).click()
    await privacy.getByText("Envelope opened").waitFor()
    await privacy.getByText("Born 1990-01-01").waitFor()
  }
  await button("Public").click()
  await privacy.getByText("NOT_A_RECIPIENT").waitFor()
  assert.equal(await privacy.getByText("Born 1990-01-01").count(), 0)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  console.log("Public review, rejection, recovery, three role checks and mobile width passed.")
} finally {
  await browser.close()
}
