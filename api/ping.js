// Vercel Scheduled Function: pings Render backend every 10 minutes to keep it warm.
export default async function handler(request, response) {
  const base = process.env.VITE_API_BASE || process.env.API_BASE || ''
  const path = process.env.VITE_RUN_PATH || '/run'
  const url = `${base}${path}`

  if (!base) {
    response.status(500).json({ ok: false, error: 'Missing VITE_API_BASE/API_BASE env' })
    return
  }

  try {
    const res = await fetch(url, { method: 'POST' })
    const text = await res.text()
    response.status(200).json({ ok: res.ok, status: res.status, body: text.slice(0, 200) })
  } catch (err) {
    response.status(500).json({ ok: false, error: err.message })
  }
}
