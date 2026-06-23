import { useState } from 'react'
import { submitLead } from '../api/widgetApi'
import { useChatStore } from '../store/chatStore'

interface Props {
  apiBase: string
  dark?: boolean
  brandColor?: string
}

export default function LeadCaptureForm({ apiBase, dark = false, brandColor }: Props) {
  const { sessionToken, setShowLeadForm, config } = useChatStore()
  const color = config?.brand_color || brandColor || '#6366f1'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 9px',
    borderRadius: 7,
    border: `1px solid ${dark ? '#3f3f46' : '#d1d5db'}`,
    fontSize: 13,
    marginBottom: 8,
    boxSizing: 'border-box',
    background: dark ? '#1c1c1f' : '#fff',
    color: dark ? '#f4f4f5' : '#1e293b',
    outline: 'none',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionToken || !name.trim() || !email.trim()) return
    setLoading(true)
    try {
      await submitLead(sessionToken, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: '',
        page_url: window.location.href,
      }, apiBase)
      setSubmitted(true)
    } catch {
      // stays open so user can retry
    } finally {
      setLoading(false)
    }
  }

  const wrapStyle: React.CSSProperties = {
    margin: '0 12px 10px',
    padding: '12px 14px',
    background: dark ? '#1e1e2e' : '#f8fafc',
    borderRadius: 10,
    border: `1px solid ${dark ? '#3f3f46' : '#e2e8f0'}`,
    fontSize: 13,
  }

  if (submitted) {
    return (
      <div style={{ ...wrapStyle, textAlign: 'center', color: '#4ade80' }}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>✓</div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Thanks! We'll be in touch soon.</div>
        <button
          onClick={() => setShowLeadForm(false)}
          style={{ background: 'none', border: 'none', color: dark ? '#71717a' : '#9ca3af', fontSize: 12, cursor: 'pointer', marginTop: 4 }}
        >Dismiss</button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={wrapStyle}>
      <div style={{ fontWeight: 600, color: dark ? '#f4f4f5' : '#1e293b', marginBottom: 10 }}>
        Leave your contact details
      </div>
      <label style={{ display: 'block', fontSize: 11.5, color: dark ? '#a1a1aa' : '#6b7280', marginBottom: 3, fontWeight: 500 }}>Name *</label>
      <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
      <label style={{ display: 'block', fontSize: 11.5, color: dark ? '#a1a1aa' : '#6b7280', marginBottom: 3, fontWeight: 500 }}>Email *</label>
      <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
      <label style={{ display: 'block', fontSize: 11.5, color: dark ? '#a1a1aa' : '#6b7280', marginBottom: 3, fontWeight: 500 }}>Phone</label>
      <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={() => setShowLeadForm(false)}
          style={{
            flex: 1, padding: '7px', borderRadius: 7, border: `1px solid ${dark ? '#3f3f46' : '#d1d5db'}`,
            background: 'transparent', color: dark ? '#a1a1aa' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}
        >Cancel</button>
        <button
          type="submit"
          disabled={loading || !name.trim() || !email.trim()}
          style={{
            flex: 2, padding: '7px', borderRadius: 7, border: 'none',
            background: color, color: '#fff',
            cursor: loading || !name.trim() || !email.trim() ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
            opacity: loading ? 0.7 : 1,
          }}
        >{loading ? 'Sending…' : 'Send'}</button>
      </div>
    </form>
  )
}
