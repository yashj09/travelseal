import { useEffect, useState } from "react"
import { FileLockIcon, InboxIcon, ScaleIcon, SendIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditorPanel } from "@/components/travelseal/auditor-panel"
import { BrandMark } from "@/components/travelseal/brand"
import { InboxPanel } from "@/components/travelseal/inbox-panel"
import { Inspector } from "@/components/travelseal/inspector"
import { NetworkBadge } from "@/components/travelseal/network-badge"
import { QdayPanel } from "@/components/travelseal/qday-panel"
import { SendPanel } from "@/components/travelseal/send-panel"
import { useSession } from "@/lib/session"

const TABS = [
  { id: "send", label: "Send", icon: SendIcon, panel: SendPanel },
  { id: "inbox", label: "Inbox", icon: InboxIcon, panel: InboxPanel },
  { id: "audit", label: "Auditor", icon: ScaleIcon, panel: AuditorPanel },
  { id: "qday", label: "Q-Day", icon: FileLockIcon, panel: QdayPanel },
] as const

export function App() {
  const { mode } = useSession()
  const [tab, setTab] = useState<string>()
  // Without keys there is nothing to send, so the public page opens on what it can show.
  useEffect(() => {
    if (mode.kind !== "loading") setTab((t) => t ?? (mode.kind === "live" ? "send" : "inbox"))
  }, [mode.kind])

  return (
    <div className="mx-auto flex min-h-svh max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark className="size-8" />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">TravelSeal</h1>
            <span className="text-sm text-muted-foreground">
              Travel-rule records that stay sealed <em className="font-serif text-base">after Q-Day</em>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={mode.kind === "live" ? "success" : "secondary"}>{mode.kind === "live" ? "Live demo keys" : mode.kind === "replay" ? "Replay mode" : "Loading"}</Badge>
          <NetworkBadge />
        </div>
      </header>

      {mode.kind === "replay" && (
        <Alert>
          <AlertTitle>Replay mode</AlertTitle>
          <AlertDescription>This public page holds no keys. It reads the real deposits, records and answers from qorechain-diana, and runs the Q-Day simulation with fresh keys in your browser. Run the repo locally to send, receive and audit with the demo accounts.</AlertDescription>
        </Alert>
      )}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_min(42%,560px)]">
        {!tab ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-72" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="min-w-0">
            <TabsList variant="line">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  <t.icon />
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((t) => (
              // Kept mounted so a flow that finishes while another tab is open still shows its result.
              <TabsContent key={t.id} value={t.id} keepMounted className="pt-4">
                <t.panel />
              </TabsContent>
            ))}
          </Tabs>
        )}
        <div className="lg:sticky lg:top-8 lg:h-[calc(100svh-4rem)]">
          <Inspector />
        </div>
      </div>
    </div>
  )
}

export default App
