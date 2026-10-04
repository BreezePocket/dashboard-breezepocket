import type { CSSProperties, ReactNode } from 'react'

export type PanelTabs = { items: { id: string; label: string; disabled?: boolean }[]; active: string; onChange: (id: string) => void }
/** A card. `tabs` puts a tab row along its top in place of the title; `label` names that row for screen readers. */
type Props = { title?: string; tabs?: PanelTabs; label?: string; children: ReactNode; className?: string; style?: CSSProperties }

export default function Panel({ title, tabs, label, children, className = '', style }: Props) {
  return (
    <section className={`panel ${className}`} style={style}>
      {tabs ? (
        <div className="panel-tabs" role="tablist" aria-label={label}>
          {tabs.items.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === tabs.active}
              className={`panel-tab ${t.id === tabs.active ? 'is-active' : ''}`}
              disabled={t.disabled}
              onClick={() => tabs.onChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : (
        title && <h2 className="panel-title">{title}</h2>
      )}
      {children}
    </section>
  )
}
