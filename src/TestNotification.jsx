import { useState } from 'react'

const API = import.meta.env.VITE_API_BASE || ''

export default function TestNotification() {
  const [title, setTitle] = useState('Test notification')
  const [body, setBody] = useState('Hello from Bursa Signals')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  async function send() {
    try {
      setStatus('sending')
      setError(null)
      const res = await fetch(`${API}/notify/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Backend expects a "changes" array; send empty for manual tests.
        body: JSON.stringify({ title, body, changes: [] }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }
      setStatus('sent')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (e) {
      setStatus('idle')
      setError(e.message)
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>Test Push</h1>
        <p className="lede">
          Send yourself a Web Push to confirm permissions. Make sure you already tapped “Enable Push” on the main page.
        </p>
      </header>

      <section className="panel">
        <div className="form-grid">
          <label>
            <span>Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            <span>Message</span>
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <div className="actions">
            <button className="primary" onClick={send} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send test notification'}
            </button>
            {status === 'sent' && <span className="muted">Sent ✔</span>}
          </div>
          {error && <div className="callout error">{error}</div>}
        </div>
      </section>
    </main>
  )
}
