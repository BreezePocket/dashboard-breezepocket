import { useEffect, useRef, useState } from 'react'
import { Chevron } from './Icons'

/** `icons` shows several overlapping logos, for an option that stands for many (e.g. "All Chains"). */
export type DropdownOption = { id: string; label: string; icon?: string; icons?: string[] }

type Props = {
  options: DropdownOption[]
  value: string
  onChange: (id: string) => void
  label: string
  /** Shown on the chip before the current option, not in the menu (e.g. "Group By: "). */
  prefix?: string
}

/** Chip-styled select used for the asset, type, collateral and expiry pickers. */
export default function Dropdown({ options, value, onChange, label, prefix = '' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find((o) => o.id === value)
  const fixed = options.length < 2

  return (
    <div className="chip-wrap" ref={ref}>
      <button
        type="button"
        className="chip"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={fixed}
        onClick={() => setOpen((v) => !v)}
      >
        {current?.icons && <span className="chip-stack">{current.icons.map((i) => <img key={i} src={i} alt="" />)}</span>}
        {current?.icon && <img src={current.icon} alt="" />}
        <span>{prefix}{current?.label ?? value}</span>
        {!fixed && <Chevron />}
      </button>
      {open && (
        <ul className="chip-menu" role="listbox" aria-label={label}>
          {options.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                role="option"
                aria-selected={o.id === value}
                className={o.id === value ? 'on' : ''}
                onClick={() => { onChange(o.id); setOpen(false) }}
              >
                {o.icons && <span className="chip-stack">{o.icons.map((i) => <img key={i} src={i} alt="" />)}</span>}
                {o.icon && <img src={o.icon} alt="" />}
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
