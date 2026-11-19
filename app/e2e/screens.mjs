import { chromium } from "playwright"

/** Auditor and Q-Day screens. Live mode (vite dev) opens records; replay mode (production build) must show only the public trail. */
const [url = "http://127.0.0.1:5179/", dir = "/tmp"] = process.argv.slice(2)
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
await page.goto(url)
const modeText = await page.getByText(/Live demo keys|Replay mode/).first().textContent({ timeout: 30000 })
const live = modeText.includes("Live")
console.log("mode:", modeText)

await page.getByRole("tab", { name: "Auditor" }).click()
await page.getByRole("button", { name: live ? /Open Q4 records/ : /Show the Q4 trail/ }).click()
await page.locator("table tbody tr").first().waitFor({ timeout: 180000 })
console.log("audit rows:", await page.locator("table tbody tr").count(), live ? `opened ${await page.getByText("opened", { exact: true }).count()}, flagged ${await page.getByText(/flagged/).count()}` : "")
await page.screenshot({ path: `${dir}/${live ? "live" : "replay"}-auditor.png`, fullPage: true })

await page.getByRole("tab", { name: "Q-Day" }).click()
await page.getByRole("button", { name: /Harvest both copies/ }).click()
await page.getByText("What Eve reads from the RSA copy").waitFor({ timeout: 180000 })
console.log("q-day:", (await page.getByText(/still sealed/).allTextContents()).join(" | "))
await page.screenshot({ path: `${dir}/${live ? "live" : "replay"}-qday.png`, fullPage: true })

if (!live) {
  await page.getByRole("tab", { name: "Send" }).click()
  console.log("send in replay:", await page.getByText("Sending needs the demo keys").isVisible())
  const keys = await page.request.get(new URL("/__dev/keys", url).toString())
  console.log("dev keys endpoint in production build:", keys.status(), (await keys.text()).includes("vasp") ? "LEAKS KEYS" : "no keys")
}
console.log("page errors:", errors.length ? errors : "none")
await browser.close()
