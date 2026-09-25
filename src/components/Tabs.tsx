import Ribbon from './Ribbon'

type Props<T extends string> = {
  items: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  /** Long labels: on a narrow screen the tabs share the width and wrap instead of scrolling off it. */
  fit?: boolean
}

export default function Tabs<T extends string>({ items, active, onChange, fit = false }: Props<T>) {
  return (
    <div className={`tabs ${fit ? 'tabs-fit' : ''}`} role="tablist">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={t.id === active}
          className={`tab ${t.id === active ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <Ribbon className="tab-bg" stroke="#000" />
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  )
}
