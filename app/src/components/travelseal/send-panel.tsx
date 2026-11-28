import { useState } from "react"
import { verifyRecipientCard } from "@qorechain/qoreseal"
import {
  CHAIN_ID,
  EXPLORER,
  TxFailed,
  demoRecord,
  findTransfers,
  identityFromMnemonic,
  makeCard,
  newMnemonic,
  newTransferId,
  observeTransfer,
  openRecord,
  sealRecord,
  termsOf,
  type Identity,
  type TransferTerms,
  type TravelRecord,
} from "@travelseal/core"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { errorLine, fusd, toBaseUnits, useSession } from "@/lib/session"
import { FlowError } from "./flow-error"
import { PrivacyPreview, type Parties } from "./privacy-preview"

interface Draft {
  record: TravelRecord
  parties: Parties
  quarter: string
  deposit: string
}
interface Progress {
  envelope?: Uint8Array
  postHash?: string
  depositHash?: string
  observed?: TransferTerms
  decision?: "accepted" | "rejected"
  answerHash?: string
  failedDeposit?: boolean
}

function recipient(id: Identity) {
  return verifyRecipientCard({
    card: makeCard(id),
    chainId: CHAIN_ID,
    address: id.account.cosmos,
    pqPublicKey: id.account.pqc.publicKey,
    mlkemPublicKey: id.seal.mlkemPublicKey,
  })
}

export function SendPanel() {
  const { mode, busy, run, chain } = useSession()
  const live = mode.kind === "live"
  const [amount, setAmount] = useState("1")
  const [quarter, setQuarter] = useState<"q3" | "q4">("q4")
  const [smaller, setSmaller] = useState(false)
  const [draft, setDraft] = useState<Draft>()
  const [progress, setProgress] = useState<Progress>()
  const [error, setError] = useState("")
  const [copyStatus, setCopyStatus] = useState("")
  const units = toBaseUnits(amount)
  const deposit =
    units && smaller ? ((BigInt(units) * 8n) / 10n).toString() : units
  const update = (part: Partial<Progress>) =>
    setProgress((p) => ({ ...p, ...part }))

  function reset() {
    setDraft(undefined)
    setProgress(undefined)
    setCopyStatus("")
    setError("")
  }

  async function review() {
    if (!units || !deposit || deposit === "0") return
    setError("")
    try {
      await run("prepare review", async () => {
        const auditorRole = quarter === "q3" ? "auditor-q3" : "auditor-q4"
        const roles = ["vasp-mumbai", "vasp-singapore", auditorRole] as const
        const [sender, receiver, auditor] = await Promise.all(
          roles.map((role) =>
            mode.kind === "live"
              ? mode.ids[role]
              : identityFromMnemonic(role, newMnemonic())
          )
        )
        if (!sender || !receiver || !auditor)
          throw new Error(
            "An exchange or auditor key is unavailable for this quarter."
          )
        const record = demoRecord({
          transferId: newTransferId(),
          originatorAddress: sender.account.cosmos,
          beneficiaryAddress: receiver.account.cosmos,
          amount: units,
        })
        setDraft({
          parties: { sender, receiver, auditor },
          record,
          quarter,
          deposit,
        })
      })
    } catch (e) {
      setError(errorLine(e))
    }
  }

  async function track(d: Draft, previous?: Progress) {
    setError("")
    setCopyStatus("")
    setProgress(previous ?? {})
    const {
      record,
      parties: { sender, receiver, auditor },
    } = d
    try {
      await run(
        live ? "send and track" : "simulate transfer",
        async (flows) => {
          if (!live) {
            const envelope = sealRecord(record, [
              recipient(receiver),
              recipient(auditor),
            ])
            const observed = { ...termsOf(record), amount: d.deposit }
            const opened = openRecord(envelope, receiver.seal, observed)
            setProgress({
              envelope,
              observed,
              decision: opened.ok ? "accepted" : "rejected",
            })
            flows.log({
              lane: "local",
              label: "Simulated receiver decision",
              detail: opened.ok
                ? "Singapore opened the bound record."
                : "The observed deposit did not unlock the record.",
            })
            return
          }
          if (!previous) {
            const posted = await flows.postRecord({
              sender,
              receiver,
              auditor,
              amount: record.transfer.amount,
              period: d.quarter === "q3" ? 20263 : 20264,
              record,
            })
            update({ envelope: posted.envelope, postHash: posted.postTx })
          }
          let hash = previous?.depositHash
          if (previous && !hash) {
            const found = await findTransfers(
              chain,
              receiver.account.cosmos,
              record.transferId,
              sender.account.cosmos
            )
            hash = found[0]?.hash
            if (!hash && !previous.failedDeposit)
              throw new Error(
                "Deposit not yet confirmed. Check again before taking further action."
              )
          }
          if (!hash) {
            update({ failedDeposit: false })
            try {
              hash = await flows.sendTransfer(
                sender,
                receiver.account.cosmos,
                record.transferId,
                d.deposit
              )
            } catch (e) {
              update({ failedDeposit: e instanceof TxFailed && e.code > 0 })
              throw e
            }
          }
          update({ depositHash: hash })
          const landed = observeTransfer(
            await chain.waitForTx(hash),
            receiver.account.cosmos
          )
          if (
            !landed.ok ||
            landed.terms.transferId !== record.transferId ||
            landed.terms.originator !== sender.account.cosmos
          )
            throw new Error(
              "Could not match this deposit to the reviewed transfer."
            )
          update({ observed: landed.terms })
          const { outcome, answerTx } = await flows.receiveAndAnswer(
            receiver,
            hash
          )
          const decision =
            outcome.decision === "alreadyAnswered"
              ? outcome.answer
              : outcome.decision
          if (decision !== "accepted" && decision !== "rejected")
            throw new Error(
              "The exchange has not recorded a decision for this deposit."
            )
          update({ decision, answerHash: answerTx })
        }
      )
    } catch (e) {
      setError(errorLine(e))
    }
  }

  const observed = progress?.observed
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {progress
            ? "Track transfer"
            : draft
              ? "Review transfer"
              : "Send fUSD"}
        </CardTitle>
        <CardDescription>
          {live
            ? "QoreChain testnet · The local demo acts as both exchanges."
            : "Browser simulation · Temporary keys, fictional identities and no movement of funds."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {!draft ? (
          <>
            <Field>
              <FieldLabel htmlFor="amount">
                Amount in the record (fUSD)
              </FieldLabel>
              <Input
                id="amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!!busy}
              />
            </Field>
            <label>
              Auditor quarter{" "}
              <select
                className="rounded border bg-card p-2"
                value={quarter}
                disabled={!!busy}
                onChange={(e) => setQuarter(e.target.value as typeof quarter)}
              >
                <option value="q4">Q4 2026</option>
                <option value="q3">Q3 2026</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={smaller}
                disabled={!!busy}
                onChange={(e) => setSmaller(e.target.checked)}
              />{" "}
              Test a deposit that is 20% smaller
            </label>
            {(!units || deposit === "0") && (
              <p>
                Enter a positive amount with up to six decimal places that
                yields a nonzero deposit.
              </p>
            )}
            <Button
              disabled={!!busy || !units || deposit === "0"}
              onClick={review}
            >
              Review transfer
            </Button>
          </>
        ) : (
          <>
            <p>
              <strong>{fusd(draft.record.transfer.amount)} fUSD</strong> ·
              Mumbai to Singapore · Wei Ling Tan
            </p>
            {!progress && (
              <p>
                Deposit to {live ? "send" : "simulate"}: {fusd(draft.deposit)}{" "}
                fUSD. Singapore will check the record against the deposit.
              </p>
            )}
            {progress && (
              <ol
                aria-label="Transfer timeline"
                aria-live="polite"
                className="grid gap-2 rounded-xl border p-4"
              >
                <li>
                  1. Record{" "}
                  {progress.envelope ? "sealed" : "awaiting confirmation"}{" "}
                  {progress.postHash && (
                    <a
                      className="underline"
                      href={`${EXPLORER}/tx/${progress.postHash}`}
                    >
                      View post
                    </a>
                  )}
                </li>
                <li>
                  2. Deposit{" "}
                  {observed
                    ? `observed · ${fusd(observed.amount)} fUSD`
                    : "awaiting confirmation"}{" "}
                  {progress.depositHash && (
                    <a
                      className="underline"
                      href={`${EXPLORER}/tx/${progress.depositHash}`}
                    >
                      View deposit
                    </a>
                  )}
                </li>
                <li>
                  3. Exchange {progress.decision ?? "decision pending"}{" "}
                  {progress.answerHash && (
                    <a
                      className="underline"
                      href={`${EXPLORER}/tx/${progress.answerHash}`}
                    >
                      View signed decision
                    </a>
                  )}
                </li>
              </ol>
            )}
            {progress?.decision === "rejected" && observed && (
              <div role="status">
                The record specifies {fusd(draft.record.transfer.amount)} fUSD.
                The deposit was {fusd(observed.amount)} fUSD.{" "}
                {observed.amount !== draft.record.transfer.amount
                  ? "The amounts differ, so Singapore could not open the record."
                  : "Singapore rejected the record."}{" "}
                {live && "The deposit remains on chain."}
              </div>
            )}
            <PrivacyPreview
              record={draft.record}
              parties={draft.parties}
              quarter={draft.quarter}
              terms={observed ?? termsOf(draft.record)}
              envelope={observed ? progress?.envelope : undefined}
            />
            <div className="flex flex-wrap gap-2">
              {!progress && (
                <>
                  <Button variant="outline" disabled={!!busy} onClick={reset}>
                    Edit transfer
                  </Button>
                  <Button disabled={!!busy} onClick={() => track(draft)}>
                    {live ? "Confirm testnet transfer" : "Confirm simulation"}
                  </Button>
                </>
              )}
              {progress?.decision === "rejected" && !live && (
                <Button
                  disabled={!!busy}
                  onClick={() => {
                    const next = {
                      ...draft,
                      record: {
                        ...draft.record,
                        transferId: newTransferId(),
                        sentAt: new Date().toISOString(),
                      },
                      deposit: draft.record.transfer.amount,
                    }
                    setDraft(next)
                    setSmaller(false)
                    void track(next)
                  }}
                >
                  Retry with matching amounts
                </Button>
              )}
              {live && progress && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        draft.record.transferId
                      )
                      setCopyStatus("Reference copied")
                    } catch {
                      setCopyStatus(draft.record.transferId)
                    }
                  }}
                >
                  Copy reference
                </Button>
              )}
              {copyStatus && (
                <span className="break-all" role="status">
                  {copyStatus}
                </span>
              )}
              {error && progress?.postHash && !progress.decision && (
                <Button
                  disabled={!!busy}
                  onClick={() => track(draft, progress)}
                >
                  {progress.failedDeposit
                    ? "Retry failed deposit"
                    : "Recheck transfer"}
                </Button>
              )}
              {progress &&
                !busy &&
                (progress.decision || !progress.postHash) && (
                  <Button variant="outline" onClick={reset}>
                    New transfer
                  </Button>
                )}
            </div>
          </>
        )}
        <FlowError title="Transfer needs attention" error={error} />
      </CardContent>
    </Card>
  )
}
