/** BreezePocket wave mark: two stacked leaf-shaped waves with a blue-to-cyan gradient. */
export function Mark({ className, id = 'bp-grad' }: { className?: string; id?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1A5CFF" />
          <stop offset="1" stopColor="#1FE5FF" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <path d="M4 34C30 10 55 0 72 4c12 3 20 2 26-2-6 18-22 28-42 24-20-4-36 0-52 8z" />
        <path d="M0 58c26-24 50-32 66-28 10 2 18 0 24-4-4 16-20 28-40 24-18-4-34 0-50 8z" />
      </g>
    </svg>
  )
}

/** Mark + "BreezePocket" wordmark. `size` is the mark height in px. */
export function Logo({ size = 40, stacked = false, light = false }: { size?: number; stacked?: boolean; light?: boolean }) {
  return (
    <span className={`logo ${stacked ? 'logo-stacked' : ''} ${light ? 'logo-light' : ''}`} style={{ ['--logo-size' as string]: `${size}px` }}>
      <Mark className="logo-mark" id={stacked ? 'bp-grad-s' : 'bp-grad'} />
      <span className="logo-word"><b>Breeze</b><span>Pocket</span></span>
    </span>
  )
}
