import { useEffect, useRef, useState } from 'react'
import './App.css'
import { fetchSignals } from './api'
import { registerPush } from './push'

function App() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pushStatus, setPushStatus] = useState('idle')
  const previousRef = useRef({})

  useEffect(() => {
    load()
    const id = setInterval(load, 300000) // 5 minutes
    return () => clearInterval(id)
  }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await fetchSignals()
      const prev = previousRef.current
      const changed = data.filter((s) => prev[s.ticker] && prev[s.ticker] !== s.signal)
      if (changed.length && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(
          'Signal changed',
          { body: changed.map((c) => `${c.ticker}: ${prev[c.ticker]}→${c.signal}`).join(', ') },
        )
      }
      previousRef.current = Object.fromEntries(data.map((s) => [s.ticker, s.signal]))
      setSignals(data)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load signals')
    } finally {
      setLoading(false)
    }
  }

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
              {loading ? 'Refreshing…' : 'Refresh signals'}
            </button>
            <button className="ghost" onClick={handleEnablePush} disabled={pushStatus === 'enabled'}>
              {pushStatus === 'enabled' ? 'Push enabled' : 'Enable Push'}
            </button>
          </div>
        </div>
      </header>

      {error && <div className="callout error">{error}</div>}

      <section className="panel">
        <div className="panel-head">
          <h2>Current signals</h2>
          <span className="muted">{signals.length} tickers</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Name</th>
                <th>Signal</th>
                <th>Prob. 7d</th>
                <th>Last Close</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => (
                <tr key={s.ticker}>
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
