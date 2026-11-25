import { useState } from "react"
import { RotateCwIcon, SendIcon } from "lucide-react"
import type { PostedRecord } from "@travelseal/core"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { errorLine, fusd, toBaseUnits, useSession } from "@/lib/session"
import { FlowError } from "./flow-error"

type Landing = "same" | "less"
type Quarter = "q4" | "q3"
const FLOW = "send transfer"

/** The originating exchange: seal the record to the receiver and the quarter's auditor, post it, then send the value. */
export function SendPanel() {
  const { mode, run, busy } = useSession()
  const [amount, setAmount] = useState("1")
  const [quarter, setQuarter] = useState<Quarter>("q4")
  const [landing, setLanding] = useState<Landing>("same")
  const [result, setResult] = useState<{ posted: PostedRecord; sent: string }>()
  // A record that is posted but whose transfer failed: the transfer can be retried without posting again.
  const [unsent, setUnsent] = useState<{ posted: PostedRecord; sent: string }>()
  const [error, setError] = useState<string>()

  if (mode.kind !== "live") {
    return (
      <Alert>
        <AlertTitle>Sending needs the demo keys</AlertTitle>
        <AlertDescription>This page holds no keys, so it can't seal or sign. Run the repo locally (pnpm app) to send as the Mumbai exchange. The Inbox and Auditor tabs show what has already happened on chain.</AlertDescription>
      </Alert>
    )
  }
  const ids = mode.ids
  const units = toBaseUnits(amount)
  const sent = units && landing === "less" ? ((BigInt(units) * 8n) / 10n).toString() : units
  const sendable = !!units && !!sent && sent !== "0"

  const transfer = (posted: PostedRecord, toSend: string) =>
    run(FLOW, async (flows) => {
      await flows.sendTransfer(ids["vasp-mumbai"]!, ids["vasp-singapore"]!.account.cosmos, posted.transferId, toSend)
      setUnsent(undefined)
      setResult({ posted, sent: toSend })
    })

  const submit = async () => {
    setError(undefined)
    setResult(undefined)
    setUnsent(undefined)
    let posted: PostedRecord | undefined
    try {
      const auditor = ids[quarter === "q3" ? "auditor-q3" : "auditor-q4"]
      if (!auditor) throw new Error(`auditor-${quarter}'s key has been destroyed, so no new ${quarter.toUpperCase()} records can be sealed to it.`)
      posted = await run(FLOW, (flows) => flows.postRecord({ sender: ids["vasp-mumbai"]!, receiver: ids["vasp-singapore"]!, auditor, amount: units!, period: quarter === "q3" ? 20263 : 20264 }))
      setUnsent({ posted, sent: sent! })
      await transfer(posted, sent!)
    } catch (e) {
      setError(errorLine(e))
    }
  }
  const retry = () => {
    setError(undefined)
    transfer(unsent!.posted, unsent!.sent).catch((e) => setError(errorLine(e)))
  }

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
            <Field data-invalid={!sendable || undefined}>
              <FieldLabel htmlFor="amount">Amount in the record (fUSD)</FieldLabel>
              <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-invalid={!sendable || undefined} className="font-mono" />
              <FieldDescription>{sendable ? "Fictional customers: Meera Kulkarni (Mumbai) pays Wei Ling Tan (Singapore)." : "Enter a positive amount with up to 6 decimals, large enough that something lands."}</FieldDescription>
            </Field>
            <FieldSet>
              <FieldLegend variant="label">Auditor</FieldLegend>
              <ToggleGroup aria-label="Auditor quarter" value={[quarter]} onValueChange={(v) => v[0] && setQuarter(v[0] as Quarter)} variant="outline">
                <ToggleGroupItem value="q4">Q4 2026 (current)</ToggleGroupItem>
                <ToggleGroupItem value="q3">Q3 2026</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>Each quarter has its own auditor key, so an auditor only ever opens its own quarter.</FieldDescription>
            </FieldSet>
            <FieldSet>
              <FieldLegend variant="label">What actually lands on chain</FieldLegend>
              <ToggleGroup aria-label="What actually lands on chain" value={[landing]} onValueChange={(v) => v[0] && setLanding(v[0] as Landing)} variant="outline">
                <ToggleGroupItem value="same">The amount in the record</ToggleGroupItem>
                <ToggleGroupItem value="less">20% less (tampered)</ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>A tampered transfer doesn't match the record, so the receiver can't open it and rejects it on chain.</FieldDescription>
            </FieldSet>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-between gap-4">
          <span className="font-mono text-sm text-muted-foreground">{sendable ? `${fusd(sent!)} fUSD will land` : "Nothing to send yet"}</span>
          <Button onClick={submit} disabled={!sendable || !!busy}>
            {busy === FLOW ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
            Seal, post and send
          </Button>
        </CardFooter>
      </Card>
      <FlowError title="The send didn't finish" error={error} />
      {unsent && !busy && (
        <Alert>
          <AlertTitle>The record is posted, but the transfer hasn't been sent</AlertTitle>
          <AlertDescription>Record <span className="font-mono">{unsent.posted.transferId.slice(0, 12)}…</span> is on the ledger. Retry sends only the {fusd(unsent.sent)} fUSD, without posting again.</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={retry}>
              <RotateCwIcon data-icon="inline-start" />
              Retry transfer
            </Button>
          </AlertAction>
        </Alert>
      )}
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
