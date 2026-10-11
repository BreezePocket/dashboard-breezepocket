/** PAYtience "P" mark: a green P with a seedling growing through it. */
export function Mark({ className }: { className?: string }) {
  return <img className={className} src="/icons/logo-mark.png" alt="" aria-hidden="true" />
}

/** Mark + "PAYtience.app" wordmark. `size` is the mark height in px. */
export function Logo({ size = 40, stacked = false, light = false }: { size?: number; stacked?: boolean; light?: boolean }) {
  return (
    <span className={`logo ${stacked ? 'logo-stacked' : ''} ${light ? 'logo-light' : ''}`} style={{ ['--logo-size' as string]: `${size}px` }}>
      <Mark className="logo-mark" />
      <span className="logo-word"><b>PAY</b><span>tience.app</span></span>
    </span>
  )
}
