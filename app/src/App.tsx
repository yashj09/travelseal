import { FileLockIcon, InboxIcon, ScaleIcon, SendIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrandMark } from "@/components/travelseal/brand"
import { Inspector } from "@/components/travelseal/inspector"
import { NetworkBadge } from "@/components/travelseal/network-badge"
import { InboxPanel } from "@/components/travelseal/inbox-panel"
import { SendPanel } from "@/components/travelseal/send-panel"
import { useSession } from "@/lib/session"

const TABS = [
  { id: "send", label: "Send", icon: SendIcon, who: "Mumbai exchange" },
  { id: "inbox", label: "Inbox", icon: InboxIcon, who: "Singapore exchange" },
  { id: "audit", label: "Auditor", icon: ScaleIcon, who: "Quarter auditor" },
  { id: "qday", label: "Q-Day", icon: FileLockIcon, who: "Simulation" },
] as const

function Placeholder({ title }: { title: string }) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Coming in the next commit.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function App() {
  const { mode } = useSession()
  return (
    <div className="mx-auto flex min-h-svh max-w-7xl flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandMark className="size-8" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">TravelSeal</span>
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
          <AlertDescription>This public page holds no keys. It reads the real records, transfers and answers from qorechain-diana. Run the repo locally to send, receive and audit with the demo accounts.</AlertDescription>
        </Alert>
      )}

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_min(42%,560px)]">
        <Tabs defaultValue="send" className="min-w-0">
          <TabsList variant="line">
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                <t.icon />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => (
            <TabsContent key={t.id} value={t.id} className="pt-4">
              {t.id === "send" ? <SendPanel /> : t.id === "inbox" ? <InboxPanel /> : <Placeholder title={`${t.label} · ${t.who}`} />}
            </TabsContent>
          ))}
        </Tabs>
        <div className="lg:sticky lg:top-8 lg:h-[calc(100svh-4rem)]">
          <Inspector />
        </div>
      </div>
    </div>
  )
}

export default App
