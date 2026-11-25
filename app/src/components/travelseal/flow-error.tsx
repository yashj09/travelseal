import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/** Shown next to the action that failed, so a failure is visible without looking at the inspector. */
export function FlowError({ title, error }: { title: string; error?: string }) {
  if (!error) return null
  return (
    <Alert variant="destructive" role="alert">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{error} The step-by-step log is in the "Under the hood" panel.</AlertDescription>
    </Alert>
  )
}
