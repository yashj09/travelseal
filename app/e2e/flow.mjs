import { chromium } from "playwright"

/**
 * Drives a full live round trip through the UI: Send 0.5 fUSD as Mumbai, then Open and answer as Singapore.
 * Writes on chain with the demo keys. Usage: node e2e/flow.mjs [url] [screenshot dir] [same|less]
 */
const [url = "http://127.0.0.1:5179/", dir = "/tmp", landing = "same"] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
await page.goto(url)
await page.getByText("Live demo keys").waitFor({ timeout: 30000 })

await page.getByLabel("Amount in the record (fUSD)").fill("0.5")
if (landing === "less") await page.getByText("20% less (tampered)", { exact: true }).click()
await page.getByRole("button", { name: "Seal, post and send" }).click()
await page.getByText(/^Sent/).waitFor({ timeout: 240000 })
await page.screenshot({ path: `${dir}/flow-1-sent.png`, fullPage: true })
console.log("sent:", (await page.getByText(/Transfer .* byte envelope/).textContent())?.trim())

await page.getByRole("tab", { name: "Inbox" }).click()
await page.getByRole("button", { name: "Open and answer" }).first().waitFor({ timeout: 60000 })
await page.getByRole("button", { name: "Open and answer" }).first().click()
// The inspector's busy badge names the running flow; it disappears only once the answer is on chain.
await page.locator("section.dark").getByText("receive and answer").waitFor({ state: "visible", timeout: 10000 })
await page.locator("section.dark").getByText("receive and answer").waitFor({ state: "hidden", timeout: 240000 })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${dir}/flow-2-answered.png`, fullPage: true })
console.log("steps in inspector:", await page.locator("section.dark [data-slot=item]").count())
console.log("errors:", errors.length ? errors : "none")
await browser.close()
