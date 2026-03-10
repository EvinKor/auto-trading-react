const API = import.meta.env.VITE_API_BASE || '';
const RUN_PATH = import.meta.env.VITE_RUN_PATH || '/run_csv?skip_fetch=true';
const TICKERS = import.meta.env.VITE_TICKERS || '5183.KL,6033.KL';

async function call(path) {
  const url = `${API}${path}`;
  const isCsv = path.includes('run_csv');
  const res = await fetch(url, {
    method: 'POST',
    headers: isCsv ? { 'Content-Type': 'text/csv' } : undefined,
    body: isCsv ? TICKERS : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const isNoData = text.includes('No signals generated');
    throw Object.assign(new Error(`API error ${res.status}: ${text}`), { isNoData });
  }
  return JSON.parse(text).signals || [];
}

export async function fetchSignals() {
  const primary = RUN_PATH;
  const alt = primary.includes('skip_fetch=true')
    ? primary.replace('?skip_fetch=true', '')
    : `${primary}${primary.includes('?') ? '&' : '?'}skip_fetch=true`;

  try {
    return await call(primary);
  } catch (e) {
    if (e.isNoData) {
      try {
        return await call(alt);
      } catch {
        return [];
      }
    }
    throw e;
  }
}
