import type { CSSProperties, ReactNode } from 'react'
import Ribbon from './Ribbon'

type TermTabs = { items: { id: string; label: string }[]; active: string; onChange: (id: string) => void }
/** `tabs` replaces the single title ribbon with one ribbon per tab. */
type Props = { title: string; children: ReactNode; className?: string; style?: CSSProperties; tabs?: TermTabs }

export default function Terminal({ title, children, className = '', style, tabs }: Props) {
  return (
    <div className={`term ${className}`} style={style}>
      <div className="term-head">
        {tabs ? (
          <div className="term-tabs" role="tablist" aria-label={title}>
            {tabs.items.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tabs.active}
                className={`term-tab ${t.id === tabs.active ? 'is-active' : ''}`}
                onClick={() => tabs.onChange(t.id)}
              >
                <Ribbon className="term-tab-bg" />
                <i className="term-tab-dot" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <Ribbon className="term-ribbon" />
        )}
        <div className="term-strip" />
        {!tabs && <span className="term-dot" />}
        {!tabs && <span className="term-title" title={title}>{title}</span>}
      </div>
      <div className="term-body">{children}</div>
    </div>
  )
}
