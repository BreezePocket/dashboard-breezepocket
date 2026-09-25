/** PAYtience "P" mark: four interlocking blue shapes, lighter toward the top right. */
export function Mark({ className, id = 'pt-mark' }: { className?: string; id?: string }) {
  return (
    <svg className={className} viewBox="0 0 452 516" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="0.35">
          <stop offset="0" stopColor="#0A57FF" />
          <stop offset="1" stopColor="#00A3FF" />
        </linearGradient>
        <linearGradient id={`${id}-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A78FF" />
          <stop offset="1" stopColor="#0766FF" />
        </linearGradient>
        <linearGradient id={`${id}-bowl`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#005EFF" />
          <stop offset="1" stopColor="#0045F7" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id}-bowl)`} d="M185 228A50 50 0 0 1 235 178H293V19A159 159 0 0 1 293 337H200Q185 337 185 352Z" />
      <path fill={`url(#${id}-mid)`} d="M140 178H185V337H0A140 159 0 0 1 140 178Z" />
      <path fill="#0548FF" d="M0 337H185A185 179 0 0 1 18 515Q0 515 0 497Z" />
      <path fill={`url(#${id}-top)`} d="M28 0H293A130 89 0 0 1 293 178H140A132 178 0 0 1 8.8 20Q8 0 28 0Z" />
    </svg>
  )
}

/** Mark + "PAYtience" wordmark. `size` is the mark height in px. */
export function Logo({ size = 40, stacked = false, light = false }: { size?: number; stacked?: boolean; light?: boolean }) {
  return (
    <span className={`logo ${stacked ? 'logo-stacked' : ''} ${light ? 'logo-light' : ''}`} style={{ ['--logo-size' as string]: `${size}px` }}>
      <Mark className="logo-mark" id={stacked ? 'pt-mark-s' : 'pt-mark'} />
      <span className="logo-word"><b>PAY</b><span>tience</span></span>
    </span>
  )
}
