import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"

/** Live block height of qorechain-diana, read through the same-origin REST proxy. */
export function NetworkBadge() {
  const { chain } = useSession()
  const [height, setHeight] = useState<string>()
  useEffect(() => {
    let alive = true
    const tick = async () => {
      const b = await chain.get<{ block: { header: { height: string } } }>("/cosmos/base/tendermint/v1beta1/blocks/latest").catch(() => undefined)
      if (alive && b) setHeight(b.block.header.height)
    }
    tick()
    const t = setInterval(tick, 5000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [chain])
  return (
    <Badge variant="outline" className="font-mono">
      <span className={cn("size-1.5 rounded-full", height ? "animate-pulse bg-success" : "bg-muted-foreground")} />
      qorechain-diana {height ? `#${Number(height).toLocaleString()}` : ""}
    </Badge>
  )
}
