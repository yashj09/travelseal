import { useState } from "react"
import { ActivityIcon, ArrowUpRightIcon, AtomIcon, InboxIcon, LockKeyholeIcon, ScaleIcon, SendIcon } from "lucide-react"
import { EXPLORER } from "@travelseal/core"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditorPanel } from "@/components/travelseal/auditor-panel"
import { BrandMark } from "@/components/travelseal/brand"
import { InboxPanel } from "@/components/travelseal/inbox-panel"
import { Inspector } from "@/components/travelseal/inspector"
import { NetworkBadge } from "@/components/travelseal/network-badge"
import { QdayPanel } from "@/components/travelseal/qday-panel"
import { SendPanel } from "@/components/travelseal/send-panel"
import { shortHash, useSession } from "@/lib/session"
import "./wallet.css"

const TABS = [
  { id: "send", label: "Send", icon: SendIcon, panel: SendPanel },
  { id: "inbox", label: "Inbox", icon: InboxIcon, panel: InboxPanel },
  { id: "audit", label: "Auditor", icon: ScaleIcon, panel: AuditorPanel },
  { id: "qday", label: "Q-Day", icon: AtomIcon, panel: QdayPanel },
] as const

export function App() {
  const { mode, ledger } = useSession()
  const [tab, setTab] = useState("send")
  return (
    <div className="wallet-shell">
      <header className="wallet-header">
        <a className="wallet-brand" href="/welcome/index.html"><BrandMark />TravelSeal</a>
        <span className="wallet-mode">{mode.kind === "live" ? "Live demo keys" : mode.kind === "replay" ? "Replay mode" : "Connecting"}</span>
      </header>
      <main className="wallet-main">
        <section className="wallet-overview" aria-label="Transfer corridor and network">
          <div className="corridor">
            <div className="contours" aria-hidden="true">{Array.from({length: 18}, (_, i) => <i key={i} style={{transform: `rotate(${i * 5}deg) scale(${1 - i * .032})`}} />)}</div>
            <span className="wallet-caption"><LockKeyholeIcon size={16} /> Sealed transfer corridor</span>
            <h1>Mumbai <span aria-label="to">→</span> Singapore</h1>
            <p>fUSD <span> / </span> ML-KEM-1024</p>
          </div>
          <div className="wallet-network">
            <span className="wallet-caption"><ActivityIcon size={16} /> Network</span>
            <strong>QoreChain testnet</strong>
            <NetworkBadge />
            <a href={`${EXPLORER}/address/${ledger}`} target="_blank" rel="noreferrer">Ledger <code>{shortHash(ledger)}</code><ArrowUpRightIcon size={15}/></a>
          </div>
        </section>
        <div className="wallet-workspace">
          {mode.kind === "loading" ? <Skeleton className="h-72" /> : (
            <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="min-w-0">
              <TabsList aria-label="Wallet actions" className="wallet-actions">
                {TABS.map(({id,label,icon: Icon}) => <TabsTrigger key={id} value={id}><Icon />{label}</TabsTrigger>)}
              </TabsList>
              {TABS.map(({id,panel: Panel}) => <TabsContent key={id} value={id} keepMounted><Panel /></TabsContent>)}
            </Tabs>
          )}
          <aside className="wallet-activity"><Inspector /></aside>
        </div>
      </main>
    </div>
  )
}
export default App
