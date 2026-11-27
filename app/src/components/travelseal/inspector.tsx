import { ActivityIcon, ExternalLinkIcon } from "lucide-react"
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
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 text-foreground">
      <header className="flex flex-col gap-1">
        <ActivityIcon className="mb-2 size-6 text-primary" />
        <h2 className="text-lg font-semibold">Session activity</h2>
        <p className="text-sm text-muted-foreground">Browser operations and explorer receipts appear here as you use the wallet.</p>
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
            <EmptyTitle>No activity yet</EmptyTitle>
            <EmptyDescription>Try a transfer or run the Q-Day simulation.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup className="min-h-0 flex-1 gap-2 overflow-y-auto">
          {steps.map((s, i) => (
            <Item key={`${s.at.getTime()}-${i}`} variant="outline" size="sm" className="bg-card/70">
              <ItemContent>
                <ItemTitle className="flex flex-wrap items-center gap-2">
                  {s.label}
                  {s.label === "error" ? (
                    <Badge variant="destructive">{s.flow} failed</Badge>
                  ) : (
                    <Badge variant={s.lane === "evm" ? "success" : "secondary"} className="font-mono">
                      {LANE[s.lane]}
                    </Badge>
                  )}
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
