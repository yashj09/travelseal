import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Chain, ROLES, createFlows, identityFromMnemonic, type Flows, type Identity, type RecipientCard, type Role, type Step,
} from "@travelseal/core"
import type { Address } from "viem"
import deployment from "../../../deployments/diana.json"

const cardFiles = import.meta.glob<RecipientCard>("../../../deployments/cards/*.json", { eager: true, import: "default" })
const cards = new Map(Object.values(cardFiles).map((c) => [c.address, c]))

export type Mode = { kind: "loading" } | { kind: "live"; ids: Partial<Record<Role, Identity>> } | { kind: "replay" }

export interface LoggedStep extends Step {
  at: Date
  flow: string
}

interface Session {
  mode: Mode
  chain: Chain
  flows: Flows
  ledger: Address
  steps: LoggedStep[]
  /** Run one user action; its steps are grouped under `flow` in the inspector. */
  run: <T>(flow: string, fn: (flows: Flows) => Promise<T>) => Promise<T>
  busy: string | null
  /** Bumped after any flow finishes so panels that read chain state refresh. */
  version: number
}

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const chain = useMemo(() => new Chain("/lcd"), [])
  const [mode, setMode] = useState<Mode>({ kind: "loading" })
  const [steps, setSteps] = useState<LoggedStep[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [current, setCurrent] = useState("")
  const [version, setVersion] = useState(0)

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/__dev/keys").catch(() => undefined)
      const type = res?.headers.get("content-type") ?? ""
      if (!res?.ok || !type.includes("json")) return setMode({ kind: "replay" })
      const mnemonics = (await res.json()) as Partial<Record<Role, string>>
      const ids: Partial<Record<Role, Identity>> = {}
      for (const r of ROLES) if (mnemonics[r]) ids[r] = await identityFromMnemonic(r, mnemonics[r]!)
      setMode({ kind: "live", ids })
    })()
  }, [])

  const flowsFor = useCallback(
    (flow: string) =>
      createFlows({
        chain,
        deployment: deployment as { ledger: Address; block: number },
        cardFor: (a) => cards.get(a),
        log: (s) => setSteps((prev) => [{ ...s, at: new Date(), flow }, ...prev]),
      }),
    [chain],
  )
  const flows = useMemo(() => flowsFor(current), [flowsFor, current])

  const run = useCallback(
    async <T,>(flow: string, fn: (f: Flows) => Promise<T>) => {
      setBusy(flow)
      setCurrent(flow)
      try {
        return await fn(flowsFor(flow))
      } catch (e) {
        setSteps((prev) => [{ label: "error", detail: e instanceof Error ? e.message : String(e), lane: "local", at: new Date(), flow }, ...prev])
        throw e
      } finally {
        setBusy(null)
        setVersion((v) => v + 1)
      }
    },
    [flowsFor],
  )

  return (
    <SessionContext.Provider value={{ mode, chain, flows, ledger: deployment.ledger as Address, steps, run, busy, version }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const s = useContext(SessionContext)
  if (!s) throw new Error("useSession outside SessionProvider")
  return s
}

export const fusd = (amount: string | bigint) => (Number(amount) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 6 })
export const shortHash = (h: string) => (h.length > 16 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h)

/** "1.5" fUSD -> "1500000" base units (6 decimals). Returns undefined for anything that is not a positive amount. */
export function toBaseUnits(input: string): string | undefined {
  if (!/^\d+(\.\d{1,6})?$/.test(input.trim())) return undefined
  const [whole, frac = ""] = input.trim().split(".")
  const units = BigInt(whole!) * 1_000_000n + BigInt(frac.padEnd(6, "0"))
  return units > 0n ? units.toString() : undefined
}
