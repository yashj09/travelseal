import { useCallback, useEffect, useState } from "react"
import { EyeIcon, MailOpenIcon, RefreshCwIcon } from "lucide-react"
import { FUSD_DENOM, observeTransfer, openRecord, qorToEvm, type LedgerRecord, type TravelRecord, type TransferTerms } from "@travelseal/core"
import type { Address } from "viem"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { errorLine, fusd, shortHash, useSession } from "@/lib/session"
import { FlowError } from "./flow-error"
import { RecordCard } from "./record-card"

const SINGAPORE = "qor1ketaxqdhxccmt92gx8dygqpp0m88csna4mgfws"
const REASONS = ["", "record does not open for this transfer", "no record posted", "not a recipient", "screening"]
const FLOW = "receive and answer"

interface Deposit {
  hash: string
  terms: TransferTerms
  record: LedgerRecord
}

const amountLabel = (t: TransferTerms) => (t.denom === FUSD_DENOM ? `${fusd(t.amount)} fUSD` : `${fusd(t.amount)} ${t.denom === "uqor" ? "QOR" : t.denom}`)

/** The beneficiary exchange: TravelSeal deposits read from the chain, and the record each one's sender posted. */
export function InboxPanel() {
  const { mode, chain, flows, run, busy, version } = useSession()
  const [deposits, setDeposits] = useState<Deposit[]>()
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [error, setError] = useState<string>()
  const [working, setWorking] = useState<string>()
  const [opened, setOpened] = useState<{ record: TravelRecord; hash: string }>()
  // Deposits whose sender posted no record here (dust with a copied memo, or records on an earlier ledger) are noise by default.
  const [showUnrecorded, setShowUnrecorded] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const txs = await chain.searchTxs(`transfer.recipient='${SINGAPORE}'`, 30)
      const found = txs.map((t) => observeTransfer(t as never, SINGAPORE)).flatMap((o) => (o.ok ? [o] : []))
      setDeposits(await Promise.all(found.map(async (o) => ({ hash: o.hash, terms: o.terms, record: await flows.readRecord(qorToEvm(o.terms.originator) as Address, o.terms.transferId) }))))
      setLoadError(undefined)
    } catch (e) {
      setLoadError(errorLine(e))
    } finally {
      setLoading(false)
    }
  }, [chain, flows])

  useEffect(() => {
    load()
  }, [load, version])

  const receive = async (d: Deposit) => {
    if (mode.kind !== "live") return
    setError(undefined)
    setWorking(d.hash)
    try {
      const { outcome } = await run(FLOW, (f) => f.receiveAndAnswer(mode.ids["vasp-singapore"]!, d.hash))
      if (outcome.decision === "accepted") setOpened({ record: outcome.record, hash: d.hash })
    } catch (e) {
      setError(errorLine(e))
    } finally {
      setWorking(undefined)
    }
  }

  /** Re-open an already accepted record locally. Nothing is sent; the envelope comes from the ledger's event. */
  const view = async (d: Deposit) => {
    if (mode.kind !== "live") return
    setError(undefined)
    setWorking(d.hash)
    try {
      const event = (await flows.scanPosted({ transferId: d.terms.transferId, originator: qorToEvm(d.terms.originator) as Address }, true))[0]
      const r = event && openRecord(event.envelope, mode.ids["vasp-singapore"]!.seal, d.terms)
      if (!r?.ok) throw new Error("This record could not be re-opened from the ledger.")
      setOpened({ record: r.record, hash: d.hash })
    } catch (e) {
      setError(errorLine(e))
    } finally {
      setWorking(undefined)
    }
  }

  const unrecorded = deposits?.filter((d) => !d.record.exists).length ?? 0
  const visible = deposits?.filter((d) => showUnrecorded || d.record.exists)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Singapore exchange inbox</CardTitle>
          <CardDescription>Deposits carrying a TravelSeal transfer id, read from qorechain-diana. Each record is opened against the deposit that actually landed, never against what the sender claims.</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              {loading ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FlowError title="Couldn't read deposits from the chain" error={loadError} />
          {!deposits ? (
            !loadError && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-14" />
                <Skeleton className="h-14" />
              </div>
            )
          ) : visible!.length === 0 && unrecorded === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyTitle>No TravelSeal deposits yet</EmptyTitle>
                <EmptyDescription>{mode.kind === "live" ? "Send one from the Send tab." : "None have been sent to this ledger yet."}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {visible!.map((d) => {
                const state = !d.record.exists ? "noRecord" : d.record.decision
                return (
                  <Item key={d.hash} variant="outline" size="sm">
                    <ItemContent>
                      <ItemTitle className="flex flex-wrap items-center gap-2">
                        <span className="font-mono">{amountLabel(d.terms)}</span>
                        {state === "accepted" && <Badge variant="success">accepted on chain</Badge>}
                        {state === "rejected" && <Badge variant="destructive">rejected: {REASONS[d.record.reason] ?? d.record.reason}</Badge>}
                        {state === "pending" && <Badge variant="outline">awaiting answer</Badge>}
                        {state === "noRecord" && <Badge variant="secondary">no record from this sender</Badge>}
                      </ItemTitle>
                      <ItemDescription className="font-mono">
                        transfer {d.terms.transferId.slice(0, 10)}… · from {d.terms.originator.slice(0, 12)}… · deposit {shortHash(d.hash)}
                      </ItemDescription>
                    </ItemContent>
                    {mode.kind === "live" && (state === "pending" || state === "accepted") && (
                      <ItemActions>
                        {state === "pending" ? (
                          <Button size="sm" onClick={() => receive(d)} disabled={!!busy || !!working}>
                            {working === d.hash ? <Spinner data-icon="inline-start" /> : <MailOpenIcon data-icon="inline-start" />}
                            Open and answer
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => view(d)} disabled={!!working}>
                            {working === d.hash ? <Spinner data-icon="inline-start" /> : <EyeIcon data-icon="inline-start" />}
                            View record
                          </Button>
                        )}
                      </ItemActions>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
          )}
          {unrecorded > 0 && (
            <Field orientation="horizontal">
              <Switch id="unrecorded" checked={showUnrecorded} onCheckedChange={setShowUnrecorded} />
              <FieldLabel htmlFor="unrecorded">Show {unrecorded} deposit{unrecorded === 1 ? "" : "s"} whose sender posted no record on this ledger (left unanswered)</FieldLabel>
            </Field>
          )}
        </CardContent>
      </Card>
      <FlowError title="That didn't work" error={error} />
      {opened && <RecordCard record={opened.record} opener="the Singapore exchange" />}
    </div>
  )
}
