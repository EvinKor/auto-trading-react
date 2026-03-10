import { useEffect, useRef, useState } from 'react'
import './App.css'
import { fetchSignals } from './api'
import { registerPush } from './push'

function App() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pushStatus, setPushStatus] = useState('idle')
  const [lastReset, setLastReset] = useState(null)
  const [pinnedTickers, setPinnedTickers] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem('pinnedTickers') || '[]')
    } catch {
      return []
    }
  })
  const previousRef = useRef({})

  useEffect(() => {
    load()
    const id = setInterval(load, 300000) // 5 minutes
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pinnedTickers', JSON.stringify(pinnedTickers))
    }
  }, [pinnedTickers])

  async function load() {
    try {
      setLoading(true)
      const data = await fetchSignals()
      const prev = previousRef.current
      const changed = data.filter((s) => prev[s.ticker] && prev[s.ticker] !== s.signal)
      if (changed.length && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(
          'Signal changed',
          { body: changed.map((c) => `${c.ticker}: ${prev[c.ticker]}->${c.signal}`).join(', ') },
        )
      }
      previousRef.current = Object.fromEntries(data.map((s) => [s.ticker, s.signal]))
      setSignals(data)
      setLastReset(new Date())
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load signals')
    } finally {
      setLoading(false)
    }
  }

  function togglePin(ticker) {
    setPinnedTickers((prev) =>
      prev.includes(ticker) ? prev.filter((t) => t !== ticker) : [...prev, ticker],
    )
  }

  const pinnedSignals = signals.filter((s) => pinnedTickers.includes(s.ticker))
  const otherSignals = signals.filter((s) => !pinnedTickers.includes(s.ticker))

  async function handleEnablePush() {
    try {
      setPushStatus('pending')
      await registerPush()
      setPushStatus('enabled')
    } catch (err) {
      setPushStatus('error')
      setError(err.message || 'Push registration failed')
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Bursa ML</p>
          <h1>Bursa Signals</h1>
          <p className="lede">
            Live model signals with Web Push alerts. iPhone users: add to Home Screen (iOS 16.4+) before enabling push.
          </p>
          <div className="actions">
            <button className="primary" onClick={load} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh signals'}
            </button>
            <button className="ghost" onClick={handleEnablePush} disabled={pushStatus === 'enabled'}>
              {pushStatus === 'enabled' ? 'Push enabled' : 'Enable Push'}
            </button>
            <a className="ghost" href="/test-notification">
              Open test notification page
            </a>
          </div>
        </div>
      </header>

      {error && <div className="callout error">{error}</div>}

      {pinnedSignals.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Pinned</h2>
            <span className="muted">{pinnedSignals.length} pinned tickers</span>
          </div>
          <div className="pinned-grid">
            {pinnedSignals.map((s) => (
              <article key={s.ticker} className="pinned-card">
                <div className="pinned-top">
                  <div>
                    <p className="eyebrow">{s.ticker}</p>
                    <h3>{s.name || '—'}</h3>
                  </div>
                  <button className="pin-btn active" onClick={() => togglePin(s.ticker)} aria-label="Unpin">
                    ★
                  </button>
                </div>
                <div className="pinned-meta">
                  <span className={`pill ${s.signal?.toLowerCase() || ''}`}>{s.signal || '—'}</span>
                  <span className="muted">Prob 7d: {s.prob_up_7d != null ? `${(s.prob_up_7d * 100).toFixed(1)}%` : '—'}</span>
                  <span className="muted">Last close: {s.close != null ? s.close.toFixed(2) : '—'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Current signals</h2>
          <span className="muted">
            {signals.length} tickers{lastReset ? ` · reset ${lastReset.toLocaleString()}` : ''}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pin</th>
                <th>Ticker</th>
                <th>Name</th>
                <th>Signal</th>
                <th>Prob. 7d</th>
                <th>Last Close</th>
              </tr>
            </thead>
            <tbody>
              {[...pinnedSignals, ...otherSignals].map((s) => (
                <tr key={s.ticker}>
                  <td>
                    <button
                      className={`pin-btn ${pinnedTickers.includes(s.ticker) ? 'active' : ''}`}
                      onClick={() => togglePin(s.ticker)}
                      aria-label={pinnedTickers.includes(s.ticker) ? 'Unpin' : 'Pin'}
                    >
                      ★
                    </button>
                  </td>
                  <td>{s.ticker}</td>
                  <td className="muted">{s.name || '—'}</td>
                  <td>
                    <span className={`pill ${s.signal?.toLowerCase() || ''}`}>{s.signal}</span>
                  </td>
                  <td>{s.prob_up_7d != null ? `${(s.prob_up_7d * 100).toFixed(1)}%` : '—'}</td>
                  <td>{s.close != null ? s.close.toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!signals.length && !loading && <p className="muted">No signals yet.</p>}
        </div>
      </section>

      <section className="panel subtle">
        <h3>How push works</h3>
        <ul>
          <li>Allow notifications in the browser.</li>
          <li>We store an anonymous Web Push subscription on your device.</li>
          <li>Scheduler polls <code>/run</code> every 5–10 minutes and pushes only when a ticker&apos;s signal changes.</li>
        </ul>
      </section>
    </main>
  )
}

export default App
