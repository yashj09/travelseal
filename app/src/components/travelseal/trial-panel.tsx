import { useState } from "react"
import { CHAIN_ID, demoRecord, identityFromMnemonic, makeCard, newMnemonic, newTransferId, openRecord, sealRecord, termsOf } from "@travelseal/core"
import { verifyRecipientCard } from "@qorechain/qoreseal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { errorLine, fusd, toBaseUnits, useSession } from "@/lib/session"
import { FlowError } from "./flow-error"

export function TrialPanel() {
  const { run, busy } = useSession()
  const [amount, setAmount] = useState("1")
  const [changed, setChanged] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const units = toBaseUnits(amount)
  const observed = units && changed ? (BigInt(units) * 8n / 10n).toString() : units

  async function simulate() {
    if (!units || !observed || observed === "0") return
    setResult("")
    setError("")
    try {
      await run("trial transfer", async (flows) => {
        const [sender, receiver] = await Promise.all([
          identityFromMnemonic("vasp-mumbai", newMnemonic()),
          identityFromMnemonic("vasp-singapore", newMnemonic()),
        ])
        const recipient = verifyRecipientCard({ card: makeCard(receiver), chainId: CHAIN_ID, address: receiver.account.cosmos, pqPublicKey: receiver.account.pqc.publicKey, mlkemPublicKey: receiver.seal.mlkemPublicKey })
        const record = demoRecord({ transferId: newTransferId(), originatorAddress: sender.account.cosmos, beneficiaryAddress: receiver.account.cosmos, amount: units })
        const sealed = sealRecord(record, [recipient])
        flows.log({ label: "Record sealed", detail: `${fusd(units)} fUSD bound to the sample record`, lane: "local" })
        const opened = openRecord(sealed, receiver.seal, { ...termsOf(record), amount: observed })
        const message = opened.ok
          ? `Record opened. The simulated deposit matches the sealed amount of ${fusd(units)} fUSD.`
          : `Record stayed sealed (${opened.reason}). The record specifies ${fusd(units)} fUSD and the simulated deposit is ${fusd(observed)} fUSD.`
        flows.log({ label: "Receiver check", detail: message, lane: "local" })
        setResult(message)
      })
    } catch (e) {
      setError(errorLine(e))
    }
  }

  return <Card>
    <CardHeader><CardTitle>Try a sealed transfer</CardTitle>
      <CardDescription>Use temporary browser keys to send a fictional record from Mumbai to Singapore. The deposit is simulated and no funds move.</CardDescription></CardHeader>
    <CardContent className="grid gap-5">
      <Field><FieldLabel htmlFor="trial-amount">Transfer amount (fUSD)</FieldLabel>
        <Input id="trial-amount" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value); setResult("") }} />
      </Field>
      <label className="flex items-center gap-3"><input type="checkbox" checked={changed} onChange={e => { setChanged(e.target.checked); setResult("") }} />Simulate a deposit that is 20% smaller</label>
      {(!units || observed === "0") && <p>Enter a positive amount with up to six decimals that yields a nonzero deposit.</p>}
      <Button className="justify-self-start" disabled={!!busy || !units || observed === "0"} onClick={simulate}>{busy === "trial transfer" ? "Checking record…" : "Seal and check transfer"}</Button>
      <p role="status" className={result ? "rounded-xl bg-secondary p-4" : "sr-only"}>{result}</p>
      <FlowError title="Trial transfer failed" error={error} />
    </CardContent>
  </Card>
}
