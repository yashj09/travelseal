import { chromium } from "playwright"

/** Loads the running app, reports console errors, and checks the Inbox lists deposits read from chain. Usage: node e2e/smoke.mjs [url] */
const url = process.argv[2] ?? "http://127.0.0.1:5179/"
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
const errors = []
page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
page.on("pageerror", (e) => errors.push(String(e)))
await page.goto(url)
await page.getByText(/Live demo keys|Replay mode/).first().waitFor({ timeout: 30000 })
console.log("mode:", await page.getByText(/Live demo keys|Replay mode/).first().textContent())
await page.getByRole("tab", { name: "Inbox" }).click()
await page.getByText(/fUSD/).first().waitFor({ timeout: 45000 })
console.log("inbox rows:", await page.getByText(/accepted on chain|rejected:|awaiting answer/).count())
await page.screenshot({ path: process.argv[3] ?? "/tmp/travelseal-smoke.png", fullPage: true })
console.log("console errors:", errors.length ? errors : "none")
await browser.close()
