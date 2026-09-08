import type { CSSProperties, ReactNode } from 'react'
import Ribbon from './Ribbon'

type Props = { title: string; children: ReactNode; className?: string; style?: CSSProperties }

export default function Terminal({ title, children, className = '', style }: Props) {
  return (
    <div className={`term ${className}`} style={style}>
      <div className="term-head">
        <Ribbon className="term-ribbon" />
        <div className="term-strip" />
        <span className="term-dot" />
        <span className="term-title" title={title}>{title}</span>
      </div>
      <div className="term-body">{children}</div>
    </div>
  )
}
