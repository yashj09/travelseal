import { useState } from "react"
import { SendIcon } from "lucide-react"
import type { PostedRecord } from "@travelseal/core"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { fusd, toBaseUnits, useSession } from "@/lib/session"

type Landing = "same" | "less"
type Quarter = "q4" | "q3"

/** The originating exchange: seal the record to the receiver and the quarter's auditor, post it, then send the value. */
export function SendPanel() {
  const { mode, run, busy } = useSession()
  const [amount, setAmount] = useState("1")
  const [quarter, setQuarter] = useState<Quarter>("q4")
  const [landing, setLanding] = useState<Landing>("same")
  const [result, setResult] = useState<{ posted: PostedRecord; depositTx: string; sent: string }>()

  if (mode.kind !== "live") {
    return (
      <Alert>
        <AlertTitle>Sending needs the demo keys</AlertTitle>
        <AlertDescription>Run the repo locally (pnpm --filter @travelseal/app dev) to seal, post and send as the Mumbai exchange. The Inbox and Auditor tabs show what has already happened on chain.</AlertDescription>
      </Alert>
    )
  }
  const ids = mode.ids
  const units = toBaseUnits(amount)
  const sent = units && landing === "less" ? ((BigInt(units) * 8n) / 10n).toString() : units

  const submit = () =>
    run("send transfer", async (flows) => {
      const sender = ids["vasp-mumbai"]!, receiver = ids["vasp-singapore"]!, auditor = ids[quarter === "q3" ? "auditor-q3" : "auditor-q4"]
      if (!auditor) throw new Error(`auditor-${quarter}'s key has been destroyed`)
      const posted = await flows.postRecord({ sender, receiver, auditor, amount: units!, period: quarter === "q3" ? 20263 : 20264 })
      const depositTx = await flows.sendTransfer(sender, receiver.account.cosmos, posted.transferId, sent!)
      setResult({ posted, depositTx, sent: sent! })
    }).catch(() => undefined)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Send fUSD with its travel-rule record</CardTitle>
          <CardDescription>
            As the Mumbai exchange, paying a customer of the Singapore exchange. The record is sealed in this browser to Singapore's registered ML-KEM-1024 key and the quarter's auditor, bound to this exact transfer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={!units || undefined}>
              <FieldLabel htmlFor="amount">Amount in the record (fUSD)</FieldLabel>
              <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!units || undefined} className="font-mono" />
              <FieldDescription>Fictional customers: Meera Kulkarni (Mumbai) pays Wei Ling Tan (Singapore).</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Auditor</FieldLabel>
              <ToggleGroup value={[quarter]} onValueChange={(v) => v[0] && setQuarter(v[0] as Quarter)} variant="outline">
                <ToggleGroupItem value="q4">Q4 2026 (current)</ToggleGroupItem>
                <ToggleGroupItem value="q3">Q3 2026</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>Each quarter has its own auditor key, so an auditor only ever opens its own quarter.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>What actually lands on chain</FieldLabel>
              <ToggleGroup value={[landing]} onValueChange={(v) => v[0] && setLanding(v[0] as Landing)} variant="outline">
                <ToggleGroupItem value="same">The amount in the record</ToggleGroupItem>
                <ToggleGroupItem value="less">20% less (tampered)</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>A tampered transfer doesn't match the record, so the receiver can't open it and rejects it on chain.</FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-4">
          <span className="font-mono text-sm text-muted-foreground">{sent ? `${fusd(sent)} fUSD will land` : "Enter an amount"}</span>
          <Button onClick={submit} disabled={!units || !!busy}>
            {busy === "send transfer" ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
            Seal, post and send
          </Button>
        </CardFooter>
      </Card>
      {result && (
        <Alert>
          <AlertTitle className="flex flex-wrap items-center gap-2">
            Sent <Badge variant="success">record posted</Badge> <Badge variant="secondary" className="font-mono">{fusd(result.sent)} fUSD landed</Badge>
          </AlertTitle>
          <AlertDescription>
            Transfer <span className="font-mono">{result.posted.transferId.slice(0, 12)}…</span>, {result.posted.envelope.length} byte envelope. Open the Inbox tab to receive it as Singapore.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
