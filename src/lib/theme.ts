import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
/** Also read by the inline script in index.html, which sets the theme before the first paint. */
const KEY = 'paytience.theme'

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

const system = (): Theme => (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

/** The visitor's theme: their saved choice, or the system setting until they make one. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => stored() ?? system())

  // Until a choice is saved, keep up with the system setting. A change made while the tab is
  // in the background may not be reported, so the tab also checks when it comes back into view.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const follow = () => { if (!stored()) setTheme(system()) }
    mq.addEventListener('change', follow)
    document.addEventListener('visibilitychange', follow)
    return () => {
      mq.removeEventListener('change', follow)
      document.removeEventListener('visibilitychange', follow)
    }
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* storage unavailable: the choice lasts for this visit */
    }
    setTheme(next)
  }

  return [theme, toggle]
}
