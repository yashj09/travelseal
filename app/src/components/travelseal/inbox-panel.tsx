import { useCallback, useEffect, useState } from "react"
import { MailOpenIcon, RefreshCwIcon } from "lucide-react"
import { observeTransfer, type TravelRecord, type TransferTerms } from "@travelseal/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { fusd, shortHash, useSession } from "@/lib/session"
import { RecordCard } from "./record-card"

const SINGAPORE = "qor1ketaxqdhxccmt92gx8dygqpp0m88csna4mgfws"
const REASONS = ["", "record does not open for this transfer", "no record posted", "not a recipient", "screening"]

interface Deposit {
  hash: string
  terms: TransferTerms
  answer: { decision: "pending" | "accepted" | "rejected"; reason: number }
}

/** The beneficiary exchange: TravelSeal deposits read from the chain, and the record each one carries. */
export function InboxPanel() {
  const { mode, chain, flows, run, busy, version } = useSession()
  const [deposits, setDeposits] = useState<Deposit[]>()
  const [opened, setOpened] = useState<{ record: TravelRecord; hash: string }>()

  const load = useCallback(async () => {
    const txs = await chain.searchTxs(`transfer.recipient='${SINGAPORE}'`, 30)
    const found = txs.map((t) => observeTransfer(t as never, SINGAPORE)).flatMap((o) => (o.ok ? [o] : []))
    setDeposits(await Promise.all(found.map(async (o) => ({ hash: o.hash, terms: o.terms, answer: await flows.readAnswer(o.terms.transferId) }))))
  }, [chain, flows])

  useEffect(() => {
    load().catch(() => setDeposits([]))
  }, [load, version])

  const receive = (d: Deposit) =>
    run("receive and answer", async (f) => {
      if (mode.kind !== "live") return
      const { outcome } = await f.receiveAndAnswer(mode.ids["vasp-singapore"]!, d.hash)
      if (outcome.decision === "accepted") setOpened({ record: outcome.record, hash: d.hash })
    }).catch(() => undefined)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Singapore exchange inbox</CardTitle>
          <CardDescription>Deposits carrying a TravelSeal transfer id, read from qorechain-diana. Each record is opened against the deposit that actually landed, never against what the sender claims.</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {!deposits ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : deposits.length === 0 ? (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyTitle>No TravelSeal deposits yet</EmptyTitle>
                <EmptyDescription>Send one from the Send tab.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ItemGroup className="gap-2">
              {deposits.map((d) => (
                <Item key={d.hash} variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle className="flex flex-wrap items-center gap-2">
                      <span className="font-mono">{fusd(d.terms.amount)} fUSD</span>
                      {d.answer.decision === "accepted" && <Badge variant="success">accepted on chain</Badge>}
                      {d.answer.decision === "rejected" && <Badge variant="destructive">rejected: {REASONS[d.answer.reason] ?? d.answer.reason}</Badge>}
                      {d.answer.decision === "pending" && <Badge variant="outline">awaiting answer</Badge>}
                    </ItemTitle>
                    <ItemDescription className="font-mono">
                      transfer {d.terms.transferId.slice(0, 10)}… · deposit {shortHash(d.hash)}
                    </ItemDescription>
                  </ItemContent>
                  {mode.kind === "live" && d.answer.decision === "pending" && (
                    <ItemActions>
                      <Button size="sm" onClick={() => receive(d)} disabled={!!busy}>
                        {busy === "receive and answer" ? <Spinner data-icon="inline-start" /> : <MailOpenIcon data-icon="inline-start" />}
                        Open and answer
                      </Button>
                    </ItemActions>
                  )}
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
      {opened && <RecordCard record={opened.record} opener="the Singapore exchange" />}
    </div>
  )
}
