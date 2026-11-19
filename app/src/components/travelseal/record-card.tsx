import type { TravelRecord } from "@travelseal/core"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { fusd } from "@/lib/session"

function Party({ title, p }: { title: string; p: TravelRecord["originator"] }) {
  const c = p.customer
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-xs text-muted-foreground">{title}</span>
      <span className="font-medium">
        {c.name.secondaryIdentifier} {c.name.primaryIdentifier}
      </span>
      <span className="text-muted-foreground">
        {c.geographicAddress.townName}, {c.geographicAddress.country}
        {c.nationalIdentification ? ` · ${c.nationalIdentification.type.toLowerCase().replace("_", " ")} ${c.nationalIdentification.identifier}` : ""}
      </span>
      <span className="text-muted-foreground">{p.vasp.legalName}</span>
    </div>
  )
}

/** The decrypted IVMS101 subset. Only the beneficiary exchange and the quarter's auditor can ever see this. */
export function RecordCard({ record, opener }: { record: TravelRecord; opener: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Opened travel-rule record</CardTitle>
        <CardDescription>
          Decrypted in this browser by {opener}. All identity data is fictional.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Party title="Originator" p={record.originator} />
          <Party title="Beneficiary" p={record.beneficiary} />
        </div>
        <Separator />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary" className="font-mono">{fusd(record.transfer.amount)} fUSD</Badge>
          <Badge variant="outline" className="font-mono">transfer {record.transferId.slice(0, 10)}…</Badge>
          <span className="text-muted-foreground">sent {new Date(record.sentAt).toUTCString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
