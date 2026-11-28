import { useState } from "react"
import {
  openRecord,
  type Identity,
  type TransferTerms,
  type TravelRecord,
} from "@travelseal/core"
import { Button } from "@/components/ui/button"
import { fusd } from "@/lib/session"

export type Parties = {
  sender: Identity
  receiver: Identity
  auditor: Identity
}
const roles = {
  sender: "Public",
  receiver: "Receiving exchange",
  auditor: "Quarterly auditor",
} as const
type Viewer = keyof typeof roles

function Fields({ record }: { record: TravelRecord }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {[record.originator, record.beneficiary].map((party) => {
        const person = party.customer
        return (
          <div key={party.account}>
            <dt className="font-medium">
              {person.name.secondaryIdentifier} {person.name.primaryIdentifier}
            </dt>
            <dd>
              {party.vasp.legalName} · {party.account}
            </dd>
            <dd>
              {person.geographicAddress.townName},{" "}
              {person.geographicAddress.country}
            </dd>
            {person.dateOfBirth && <dd>Born {person.dateOfBirth}</dd>}
            {person.nationalIdentification && (
              <dd>
                {person.nationalIdentification.type}{" "}
                {person.nationalIdentification.identifier} (
                {person.nationalIdentification.country})
              </dd>
            )}
          </div>
        )
      })}
    </dl>
  )
}

export function PrivacyPreview({
  record,
  parties,
  terms,
  envelope,
  quarter,
}: {
  record: TravelRecord
  parties: Parties
  terms: TransferTerms
  envelope?: Uint8Array
  quarter: string
}) {
  const [viewer, setViewer] = useState<Viewer>("sender")
  // The sender's key is deliberately outside the envelope's recipient set, representing a public observer.
  const opened = envelope && openRecord(envelope, parties[viewer].seal, terms)
  return (
    <section
      className="grid gap-3 rounded-xl border p-4"
      aria-label="Privacy preview"
    >
      <h3 className="font-semibold">Who can see my data?</h3>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(roles) as Viewer[]).map((key) => (
          <Button
            type="button"
            size="sm"
            key={key}
            aria-pressed={viewer === key}
            variant={viewer === key ? "default" : "outline"}
            onClick={() => setViewer(key)}
          >
            {roles[key]}
          </Button>
        ))}
      </div>
      <p>
        {viewer === "sender"
          ? "Public transfer metadata"
          : viewer === "auditor"
            ? quarter.toUpperCase() + " auditor access"
            : "Singapore exchange access"}{" "}
        · {fusd(terms.amount)} fUSD
      </p>
      <details className="break-all text-muted-foreground">
        <summary>Transfer ID and public addresses</summary>
        <p>Transfer ID: {terms.transferId}</p>
        <p>From: {terms.originator}</p>
        <p>To: {terms.beneficiary}</p>
      </details>
      {opened ? (
        opened.ok ? (
          <>
            <strong>Envelope opened</strong>
            <Fields record={opened.record} />
          </>
        ) : (
          <p>
            Envelope stayed sealed.{" "}
            {viewer === "sender"
              ? "An unrelated key cannot read the identity fields."
              : "The key and observed deposit must both match."}{" "}
            <code>{opened.reason}</code>
          </p>
        )
      ) : viewer === "sender" ? (
        <p>Customer identity fields are encrypted.</p>
      ) : (
        <>
          <p>
            Fictional identity fields to be shared when the deposit matches:
          </p>
          <Fields record={record} />
        </>
      )}
    </section>
  )
}
