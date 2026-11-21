import { execFileSync } from "node:child_process"
import { mkdirSync, readdirSync, renameSync } from "node:fs"
import { join } from "node:path"
import { chromium } from "playwright"

/**
 * Records a silent walkthrough of the live app for the demo video, one scene after another, with pauses where the
 * voiceover talks. Writes on chain with the demo keys. Usage: node e2e/record.mjs <out dir> [url]
 * Scenes: send + accept, send tampered + reject, Q4 audit, simulated Q-Day. Output: walkthrough.webm (+ .mp4 if ffmpeg exists).
 */
const [out = "/tmp/travelseal-video", url = "http://127.0.0.1:5179/"] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const size = { width: 1440, height: 900 }
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: size, recordVideo: { dir: out, size }, deviceScaleFactor: 1 })
const page = await context.newPage()
const pause = (ms) => page.waitForTimeout(ms)
const mark = (s) => console.log(`${new Date().toISOString().slice(11, 19)} ${s}`)

await page.goto(url)
await page.getByText("Live demo keys").waitFor({ timeout: 30000 })
mark("intro")
await pause(4000)

async function sendAndAnswer(amount, tampered) {
  await page.getByRole("tab", { name: "Send" }).click()
  await page.getByLabel("Amount in the record (fUSD)").fill(amount)
  await page.getByText(tampered ? "20% less (tampered)" : "The amount in the record", { exact: true }).click()
  await pause(2500)
  mark(`send ${tampered ? "tampered" : "honest"}`)
  await page.getByRole("button", { name: "Seal, post and send" }).click()
  await page.getByText(/^Sent/).waitFor({ timeout: 240000 })
  await pause(3000)
  await page.getByRole("tab", { name: "Inbox" }).click()
  await page.getByRole("button", { name: "Open and answer" }).first().waitFor({ timeout: 60000 })
  await pause(2000)
  mark(`answer ${tampered ? "tampered" : "honest"}`)
  await page.getByRole("button", { name: "Open and answer" }).first().click()
  // The inspector's busy badge names the running flow; it disappears only once the answer is on chain.
  await page.locator("section.dark").getByText("receive and answer").waitFor({ state: "visible", timeout: 10000 })
  await page.locator("section.dark").getByText("receive and answer").waitFor({ state: "hidden", timeout: 240000 })
  await pause(tampered ? 6000 : 5000)
}

await sendAndAnswer("1", false)
await sendAndAnswer("1", true)

await page.getByRole("tab", { name: "Auditor" }).click()
await pause(1500)
mark("audit q4")
await page.getByRole("button", { name: /Open Q4 records/ }).click()
await page.locator("table tbody tr").first().waitFor({ timeout: 180000 })
await pause(6000)

await page.getByRole("tab", { name: "Q-Day" }).click()
await pause(2500)
mark("q-day")
await page.getByRole("button", { name: /Harvest both copies/ }).click()
await page.getByText("What Eve reads from the RSA copy").waitFor({ timeout: 180000 })
await pause(3000)
await page.mouse.wheel(0, 600)
await pause(6000)
mark("end")

await context.close()
await browser.close()
const webm = readdirSync(out).filter((f) => f.endsWith(".webm")).map((f) => join(out, f))[0]
const final = join(out, "walkthrough.webm")
renameSync(webm, final)
try {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", final, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", join(out, "walkthrough.mp4")])
  console.log("wrote", join(out, "walkthrough.mp4"))
} catch {
  console.log("wrote", final, "(no ffmpeg for mp4)")
}
