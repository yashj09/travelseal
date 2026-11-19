import { useState } from "react"
import { AtomIcon } from "lucide-react"
import {
  CHAIN_ID, decodeRecord, demoRecord, encodeRecord, evmToQor, findTransfer, generateRsaKeyPair, identityFromMnemonic, makeCard,
  newMnemonic, newTransferId, openClassic, openRecord, sealClassic, sealRecord, termsOf, type TravelRecord,
} from "@travelseal/core"
import { verifyRecipientCard, type SealKeyPair } from "@qorechain/qoreseal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useSession } from "@/lib/session"
import { RecordCard } from "./record-card"

interface Result {
  classicBytes: number
  sealedBytes: number
  eveClassic: TravelRecord
  eveTravelSeal: string
  ownerStillOpens: boolean
  onChain?: { transferId: string; eve: string }
}

/** Eve kept copies of both envelopes. A future quantum computer breaks RSA and X25519 for her, not ML-KEM. */
const eveKeys = (real: SealKeyPair): SealKeyPair => ({ ...real, mlkemSecretKey: crypto.getRandomValues(new Uint8Array(real.mlkemSecretKey.length)) })

export function QdayPanel() {
  const { mode, run, busy, chain } = useSession()
  const [result, setResult] = useState<Result>()

  const simulate = () =>
    run("simulate Q-Day", async (flows) => {
      const log = (label: string, detail: string) => flows.log({ label, detail, lane: "local" })
      const [mumbai, singapore] = await Promise.all([identityFromMnemonic("vasp-mumbai", newMnemonic()), identityFromMnemonic("vasp-singapore", newMnemonic())])
      const record = demoRecord({ transferId: newTransferId(), originatorAddress: mumbai.account.cosmos, beneficiaryAddress: singapore.account.cosmos })
      const rsa = await generateRsaKeyPair()
      const classic = await sealClassic(encodeRecord(record), rsa.publicKey)
      const recipient = verifyRecipientCard({ card: makeCard(singapore), chainId: CHAIN_ID, address: singapore.account.cosmos, pqPublicKey: singapore.account.pqc.publicKey, mlkemPublicKey: singapore.seal.mlkemPublicKey })
      const sealed = sealRecord(record, [recipient])
      log("harvest", "Eve copies both envelopes in transit or from storage, today")
      const eveClassic = decodeRecord(await openClassic(classic, rsa.privateKey))
      log("Q-Day: RSA", "with the RSA private key Shor's algorithm would yield, the RSA-OAEP copy opens")
      const t = openRecord(sealed, eveKeys(singapore.seal), termsOf(record))
      log("Q-Day: TravelSeal", `with the X25519 secret but no ML-KEM-1024 secret: ${t.ok ? "OPENED" : t.reason}`)
      const r: Result = { classicBytes: JSON.stringify(classic).length, sealedBytes: sealed.length, eveClassic, eveTravelSeal: t.ok ? "opened" : t.reason, ownerStillOpens: openRecord(sealed, singapore.seal, termsOf(record)).ok }

      if (mode.kind === "live") {
        const latest = (await flows.scanPosted(undefined, true))[0]
        const receiver = mode.ids["vasp-singapore"]
        if (latest && receiver) {
          const landed = await findTransfer(chain, evmToQor(latest.beneficiary), latest.transferId)
          if (landed?.ok) {
            const o = openRecord(latest.envelope, eveKeys(receiver.seal), landed.terms)
            r.onChain = { transferId: latest.transferId, eve: o.ok ? "opened" : o.reason }
            log("Q-Day: on-chain envelope", `latest real envelope ${latest.transferId.slice(0, 8)}… with Singapore's X25519 secret: ${o.ok ? "OPENED" : o.reason}`)
          }
        }
      }
      setResult(r)
    }).catch(() => undefined)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Simulate Q-Day</CardTitle>
          <CardDescription>
            Travel-rule records are kept for 5 to 7 years. TRISA's reference implementation wraps each record's key with RSA-OAEP and relies on deleting the key later, which does nothing against a copy someone harvested today. This runs in your browser with fresh keys; Eve is given what a quantum computer would break.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={simulate} disabled={!!busy} className="self-start">
            {busy === "simulate Q-Day" ? <Spinner data-icon="inline-start" /> : <AtomIcon data-icon="inline-start" />}
            Harvest both copies, then break RSA and X25519
          </Button>
          {result && (
            <ItemGroup className="gap-2">
              <Item variant="outline">
                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">RSA-OAEP-SHA512 envelope (TRISA style) <Badge variant="destructive">opened by Eve</Badge></ItemTitle>
                  <ItemDescription>{result.classicBytes} bytes. AES-256-GCM payload, HMAC-SHA256, key and secret wrapped with RSA.</ItemDescription>
                </ItemContent>
              </Item>
              <Item variant="outline">
                <ItemContent>
                  <ItemTitle className="flex flex-wrap items-center gap-2">TravelSeal envelope <Badge variant="success">still sealed: {result.eveTravelSeal}</Badge></ItemTitle>
                  <ItemDescription>{result.sealedBytes} bytes. Hybrid ML-KEM-1024 + X25519: breaking X25519 isn't enough. The real receiver {result.ownerStillOpens ? "still opens it" : "could not open it"}.</ItemDescription>
                </ItemContent>
              </Item>
              {result.onChain && (
                <Item variant="outline">
                  <ItemContent>
                    <ItemTitle className="flex flex-wrap items-center gap-2">Latest real envelope on qorechain-diana <Badge variant="success">still sealed: {result.onChain.eve}</Badge></ItemTitle>
                    <ItemDescription className="font-mono">transfer {result.onChain.transferId.slice(0, 12)}…, attacked with Singapore's real X25519 secret</ItemDescription>
                  </ItemContent>
                </Item>
              )}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
      {result && (
        <>
          <Alert variant="destructive">
            <AlertTitle>What Eve reads from the RSA copy</AlertTitle>
            <AlertDescription>Everything below came out of the classical envelope. The TravelSeal copy of the same record gave her nothing.</AlertDescription>
          </Alert>
          <RecordCard record={result.eveClassic} opener="Eve, after a simulated Q-Day" />
        </>
      )}
    </div>
  )
}
