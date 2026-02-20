export default function Logo({ className = '' }) {
  return (
    <span
      className={`font-bold tracking-tight text-neutral-900 ${className}`}
      style={{ fontFamily: 'inherit' }}
    >
      SelfBuilt
    </span>
  )
}
