const DEFAULT_API = typeof window !== 'undefined' ? window.location.origin : ''

async function apiFetch(path: string, options: RequestInit = {}, apiBase = ''): Promise<any> {
  const base = apiBase || DEFAULT_API
  const res = await fetch(`${base}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function getWidgetConfig(publicKey: string, apiBase = '') {
  return apiFetch(`/widget/config/${publicKey}`, {}, apiBase)
}

export async function createSession(publicKey: string, domain: string, apiBase = '') {
  return apiFetch('/widget/session', {
    method: 'POST',
    body: JSON.stringify({ public_key: publicKey, domain }),
  }, apiBase)
}

export async function sendMessage(
  sessionToken: string,
  message: string,
  history: Array<{ role: string; content: string }>,
  apiBase = '',
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const base = apiBase || DEFAULT_API
  const res = await fetch(`${base}/api/v1/widget/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_token: sessionToken, message, history }),
  })
  if (!res.ok || !res.body) throw new Error(`Chat error ${res.status}`)
  return res.body.getReader()
}

export async function submitLead(sessionToken: string, data: Record<string, string>, apiBase = '') {
  return apiFetch('/widget/lead', {
    method: 'POST',
    body: JSON.stringify({ session_token: sessionToken, ...data }),
  }, apiBase)
}
