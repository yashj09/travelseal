import { useState } from "react"
import { ScaleIcon } from "lucide-react"
import { evmToQor, type AuditEntry, type LedgerRecord, type PostedEvent } from "@travelseal/core"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { errorLine, fusd, useSession } from "@/lib/session"
import { FlowError } from "./flow-error"

type Quarter = "q4" | "q3"
const PERIOD = { q4: 20264, q3: 20263 } as const

const FLAG: Record<string, string> = {
  DECRYPTION_FAILED: "doesn't match its transfer",
  TERMS_MISMATCH: "doesn't match its transfer",
  NOT_A_RECIPIENT: "not sealed to this auditor",
  MALFORMED_ENVELOPE: "malformed envelope",
  MALFORMED_RECORD: "sealed data is not a record",
}

function Status({ e }: { e: AuditEntry }) {
  if (e.status === "opened") return <Badge variant="success">opened</Badge>
  if (e.status === "flagged") return <Badge variant="destructive">flagged: {FLAG[e.reason] ?? e.reason}</Badge>
  return <Badge variant="outline">no transfer landed</Badge>
}

/** A quarter's auditor: opens its own quarter only, each record against the transfer that actually landed. */
export function AuditorPanel() {
  const { mode, run, busy } = useSession()
  const [quarter, setQuarter] = useState<Quarter>("q4")
  const [entries, setEntries] = useState<AuditEntry[]>()
  const [trail, setTrail] = useState<(PostedEvent & { record: LedgerRecord })[]>()
  const [error, setError] = useState<string>()
  const live = mode.kind === "live"
  const auditor = live ? mode.ids[quarter === "q3" ? "auditor-q3" : "auditor-q4"] : undefined

  const go = () => {
    setError(undefined)
    run(`audit ${quarter}`, async (flows) => {
      if (auditor) return setEntries(await flows.auditQuarter(auditor, PERIOD[quarter]))
      const events = (await flows.scanPosted()).filter((e) => e.period === PERIOD[quarter])
      setTrail(await Promise.all(events.map(async (e) => ({ ...e, record: await flows.readRecord(e.originator, e.transferId) }))))
    }).catch((e) => setError(errorLine(e)))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quarter audit</CardTitle>
        <CardDescription>
          Every record is also sealed to that quarter's auditor key. The auditor reconciles each record against the transfer that landed on chain, and a record that lies about its transfer doesn't open.
        </CardDescription>
        <CardAction>
          <ToggleGroup value={[quarter]} onValueChange={(v) => v[0] && (setQuarter(v[0] as Quarter), setEntries(undefined), setTrail(undefined))} variant="outline" size="sm" disabled={!!busy} aria-label="Quarter">
            <ToggleGroupItem value="q4">Q4 2026</ToggleGroupItem>
            <ToggleGroupItem value="q3">Q3 2026</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {live && !auditor && (
          <Alert variant="destructive">
            <AlertTitle>auditor-{quarter}'s key was destroyed</AlertTitle>
            <AlertDescription>Its retention period ended. The auditor's copy of every {quarter.toUpperCase()} record can no longer be opened, and unlike an RSA-wrapped copy, a quantum computer doesn't change that. The receiving exchange keeps its own access.</AlertDescription>
          </Alert>
        )}
        {!live && (
          <Alert>
            <AlertTitle>Public trail only</AlertTitle>
            <AlertDescription>Without the auditor's key this page can show what anyone can see on chain: which records exist, for which quarter, between which accounts, and how they were answered. Never their contents.</AlertDescription>
          </Alert>
        )}
        <Button onClick={go} disabled={!!busy || (live && !auditor)} className="self-start">
          {busy?.startsWith("audit") ? <Spinner data-icon="inline-start" /> : <ScaleIcon data-icon="inline-start" />}
          {auditor ? `Open ${quarter.toUpperCase()} records as auditor-${quarter}` : `Show the ${quarter.toUpperCase()} trail`}
        </Button>
        <FlowError title="The audit didn't finish" error={error} />
        {entries && (entries.length === 0 ? (
          <Empty className="border border-dashed"><EmptyHeader><EmptyTitle>No records filed under {quarter.toUpperCase()}</EmptyTitle><EmptyDescription>Send one with this quarter selected.</EmptyDescription></EmptyHeader></Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Transfer</TableHead><TableHead>Result</TableHead><TableHead>Amount</TableHead><TableHead>Parties (fictional)</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={`${e.event.originator}-${e.event.transferId}`}>
                  <TableCell className="font-mono">{e.event.transferId.slice(0, 10)}…</TableCell>
                  <TableCell><Status e={e} /></TableCell>
                  <TableCell className="font-mono">{e.status === "opened" ? `${fusd(e.record.transfer.amount)} fUSD` : "sealed"}</TableCell>
                  <TableCell>{e.status === "opened" ? `${e.record.originator.customer.name.secondaryIdentifier} ${e.record.originator.customer.name.primaryIdentifier} → ${e.record.beneficiary.customer.name.secondaryIdentifier} ${e.record.beneficiary.customer.name.primaryIdentifier}` : "sealed"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ))}
        {trail && (
          <Table>
            <TableHeader>
              <TableRow><TableHead>Transfer</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Envelope</TableHead><TableHead>Answer</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {trail.map((e) => (
                <TableRow key={`${e.originator}-${e.transferId}`}>
                  <TableCell className="font-mono">{e.transferId.slice(0, 10)}…</TableCell>
                  <TableCell className="font-mono">{evmToQor(e.originator).slice(0, 12)}…</TableCell>
                  <TableCell className="font-mono">{evmToQor(e.beneficiary).slice(0, 12)}…</TableCell>
                  <TableCell className="font-mono">{e.envelope.length} B sealed</TableCell>
                  <TableCell><Badge variant={e.record.decision === "accepted" ? "success" : e.record.decision === "rejected" ? "destructive" : "outline"}>{e.record.decision}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
