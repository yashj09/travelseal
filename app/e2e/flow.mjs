import { chromium } from "playwright"

/**
 * Drives a full live round trip through the UI: Send 0.5 fUSD as Mumbai, then verify Singapore’s signed decision.
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
if (landing === "less") await page.getByLabel(/20% smaller/).check()
await page.getByRole("button", { name: "Review transfer" }).click()
await page.getByRole("button", { name: "Confirm testnet transfer" }).click()
const timeline = page.getByRole("list", { name: "Transfer timeline" })
await timeline.getByRole("link", { name: "View deposit" }).waitFor({ timeout: 240000 })
await page.screenshot({ path: `${dir}/flow-1-sent.png`, fullPage: true })
await timeline.getByText(landing === "less" ? /Exchange rejected/ : /Exchange accepted/).waitFor({ timeout: 240000 })
await page.screenshot({ path: `${dir}/flow-2-answered.png`, fullPage: true })
console.log("timeline:", await timeline.innerText())
console.log("errors:", errors.length ? errors : "none")
await browser.close()
