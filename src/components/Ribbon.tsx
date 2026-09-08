export default function Ribbon({ className, stroke = 'currentColor' }: { className?: string; stroke?: string }) {
  return (
    <svg
      className={className}
      viewBox="-0.5 -0.5 246 42"
      preserveAspectRatio="none"
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 0H220.021C223.683 0 227.014 2.12 228.565 5.435L245 41H0V10C0 4.477 4.477 0 10 0Z"
        fill="currentColor"
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}
