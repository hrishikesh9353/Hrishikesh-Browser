import { useState } from 'react'
import mark from '../../../build/icon.svg'
import wordmark from './assets/hrishikesh-wordmark.png'
import './assets/standalone.css'

const defaultShortcuts = [
  { name: 'Google', url: 'https://www.google.com/' },
  { name: 'YouTube', url: 'https://www.youtube.com/' },
  { name: 'Gmail', url: 'https://mail.google.com/' }
]

function StandaloneHome() {
  const [query, setQuery] = useState('')
  const [shortcuts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('hrx-standalone-shortcuts') || 'null')
      return Array.isArray(saved) ? saved : defaultShortcuts
    } catch {
      return defaultShortcuts
    }
  })

  const submitSearch = (event) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    const target = /^https?:\/\//i.test(value)
      ? value
      : value.includes('.') && !value.includes(' ')
        ? `https://${value}`
        : `https://www.google.com/search?q=${encodeURIComponent(value)}`
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="standalone-home">
      <header className="standalone-bar">
        <img src={mark} alt="" />
        <span>HRISHIKESH</span>
        <i>GAMING BROWSER</i>
        <b>WEB EDITION</b>
      </header>
      <section className="standalone-content">
        <img className="standalone-wordmark" src={wordmark} alt="Hrishikesh" />
        <p className="standalone-tag">YOUR NEXT TAB. YOUR OWN TERRITORY.</p>
        <form className="standalone-search" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or enter a web address"
            aria-label="Search or enter a web address"
          />
          <button type="submit">GO</button>
        </form>
        <nav className="standalone-shortcuts" aria-label="Shortcuts">
          {shortcuts.map((item) => (
            <a href={item.url} target="_blank" rel="noreferrer" key={item.url}>
              <span>{item.name.slice(0, 1)}</span>
              <b>{item.name}</b>
            </a>
          ))}
        </nav>
        <aside className="standalone-runtime-note">
          <strong>Web and Android preview</strong>
          <span>
            This build opens websites in a separate browser tab. The multi-tab desktop engine and
            Windows system controls are available in the Windows app.
          </span>
        </aside>
      </section>
    </main>
  )
}

export default StandaloneHome
