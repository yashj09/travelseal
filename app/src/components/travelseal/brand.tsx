/** The TravelSeal mark: a seal ring of lattice dots around a closed envelope point. */
export function BrandMark(props: React.SVGProps<SVGSVGElement>) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return <circle key={i} cx={16 + Math.cos(a) * 11} cy={16 + Math.sin(a) * 11} r={1.6} />
  })
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden {...props}>
      {dots}
      <path d="M10 12.5h12v8H10z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m10 12.5 6 4.5 6-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
