import { ExternalLinkIcon } from "lucide-react"
import { EXPLORER } from "@travelseal/core"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { shortHash, useSession } from "@/lib/session"

const LANE = { native: "Native · hybrid", evm: "EVM · pqcVerify", local: "In your browser" } as const

/** Every step a flow takes, newest first, each linked to its transaction on the explorer. */
export function Inspector() {
  const { steps, busy } = useSession()
  return (
    <section className="dark flex h-full flex-col gap-4 rounded-2xl border bg-background bg-lattice p-5 text-foreground">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Under the hood</p>
        <h2 className="text-lg font-semibold">What just happened, on chain</h2>
        <p className="text-sm text-muted-foreground">Sealing and opening run in your browser. Every post and answer is authorised by an ML-DSA-87 signature the ledger checks with QoreChain's pqcVerify precompile.</p>
      </header>
      {busy && (
        <Badge variant="outline" className="font-mono">
          <Spinner data-icon="inline-start" />
          {busy}
        </Badge>
      )}
      {steps.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No steps yet</EmptyTitle>
            <EmptyDescription>Run a flow and each step shows up here with its transaction.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup className="min-h-0 flex-1 gap-2 overflow-y-auto">
          {steps.map((s, i) => (
            <Item key={`${s.at.getTime()}-${i}`} variant="outline" size="sm" className="bg-card/70">
              <ItemContent>
                <ItemTitle className="flex flex-wrap items-center gap-2">
                  {s.label}
                  <Badge variant={s.label === "error" ? "destructive" : s.lane === "evm" ? "success" : "secondary"} className="font-mono">
                    {LANE[s.lane]}
                  </Badge>
                </ItemTitle>
                <ItemDescription>{s.detail}</ItemDescription>
              </ItemContent>
              {s.hash && (
                <ItemActions>
                  <Button variant="ghost" size="sm" className="font-mono" render={<a href={`${EXPLORER}/tx/${s.hash}`} target="_blank" rel="noreferrer" />} nativeButton={false}>
                    {shortHash(s.hash)}
                    <ExternalLinkIcon data-icon="inline-end" />
                  </Button>
                </ItemActions>
              )}
            </Item>
          ))}
        </ItemGroup>
      )}
    </section>
  )
}
