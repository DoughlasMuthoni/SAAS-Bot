import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspaceId } from '../hooks/useWorkspaceId'
import { useRole } from '../hooks/useRole'

type Tab = 'general' | 'appearance' | 'domains' | 'install'

interface Bot {
  id: string
  name: string
  public_key: string
  brand_color: string
  welcome_message: string
  fallback_email: string
  fallback_phone: string
  fallback_whatsapp: string
  model_name: string
  is_active: boolean
  position: string
  theme: string
  domains: Domain[]
}

interface Domain {
  id: string
  domain: string
}

const TAB_LABELS: Record<Tab, string> = {
  general: 'General',
  appearance: 'Appearance',
  domains: 'Domains',
  install: 'Install',
}

export default function BotSettingsPage() {
  const { botId } = useParams<{ botId: string }>()
  const workspaceId = useWorkspaceId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { canEdit, isAdmin } = useRole()
  const [tab, setTab] = useState<Tab>('general')
  const [form, setForm] = useState<Partial<Bot>>({})
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [domainError, setDomainError] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: bot, isLoading } = useQuery<Bot>({
    queryKey: ['bot', botId],
    queryFn: () => api.get(`/bots/${botId}?workspace_id=${workspaceId}`).then((r) => r.data),
    enabled: !!botId && !!workspaceId,
  })

  useEffect(() => {
    if (bot) setForm(bot)
  }, [bot])

  const updateBot = useMutation({
    mutationFn: (data: Partial<Bot>) =>
      api.put(`/bots/${botId}?workspace_id=${workspaceId}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      setSaved(true)
      setSaveError('')
      setTimeout(() => setSaved(false), 2500)
    },
    onError: () => setSaveError('Failed to save. Please try again.'),
  })

  const addDomain = useMutation({
    mutationFn: () =>
      api.post(`/bots/${botId}/domains?workspace_id=${workspaceId}`, { domain: newDomain }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      setNewDomain('')
      setDomainError('')
    },
    onError: () => setDomainError('Failed to add domain. Check the format.'),
  })

  const removeDomain = useMutation({
    mutationFn: (domainId: string) =>
      api.delete(`/bots/${botId}/domains/${domainId}?workspace_id=${workspaceId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot', botId] }),
  })

  const copyEmbed = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <div className="cb-spinner" />
    </div>
  )
  if (!bot) return <div className="alert alert-danger">Bot not found.</div>

  const apiOrigin = window.location.origin.replace('3000', '8000').replace('3001', '8000')
  const embedCode = `<script src="${apiOrigin}/static/widget.js" data-bot="${bot.public_key}"></script>`

  const previewColor = form.brand_color ?? bot.brand_color
  const previewDark = (form.theme ?? bot.theme) === 'dark'

  const SaveBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
      <button
        className="btn btn-primary"
        onClick={() => updateBot.mutate(form)}
        disabled={updateBot.isPending}
        style={{ minWidth: 120 }}
      >
        {updateBot.isPending ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="spinner-border spinner-border-sm" />
            Saving…
          </span>
        ) : 'Save Changes'}
      </button>
      {saved && (
        <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Saved!
        </span>
      )}
      {saveError && <span style={{ color: '#dc2626', fontSize: 13 }}>{saveError}</span>}
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/bots')}
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Bots
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${bot.brand_color}88, ${bot.brand_color})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>🤖</div>
          <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{bot.name}</h4>
          <span className={`badge ${bot.is_active ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 11 }}>
            {bot.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Read-only notice for viewers */}
      {!canEdit && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8,
          padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#92400e',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          You have view-only access. Contact an admin to make changes.
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <li key={t} className="nav-item">
            <button className={`nav-link ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </button>
          </li>
        ))}
      </ul>

      {/* General */}
      {tab === 'general' && (
        <div className="card p-4" style={{ maxWidth: 600 }}>
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Bot Name</label>
            <input className="form-control" value={form.name ?? ''} disabled={!canEdit} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Welcome Message</label>
            <textarea className="form-control" rows={3} value={form.welcome_message ?? ''} disabled={!canEdit} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} />
            <div className="form-text">Shown when a visitor first opens the chat.</div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-medium" style={{ fontSize: 13 }}>Fallback Email</label>
            <input className="form-control" type="email" value={form.fallback_email ?? ''} disabled={!canEdit} onChange={(e) => setForm({ ...form, fallback_email: e.target.value })} placeholder="support@example.com" />
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-medium" style={{ fontSize: 13 }}>Fallback Phone</label>
              <input className="form-control" value={form.fallback_phone ?? ''} disabled={!canEdit} onChange={(e) => setForm({ ...form, fallback_phone: e.target.value })} placeholder="+1 555 000 0000" />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-medium" style={{ fontSize: 13 }}>Fallback WhatsApp</label>
              <input className="form-control" value={form.fallback_whatsapp ?? ''} disabled={!canEdit} onChange={(e) => setForm({ ...form, fallback_whatsapp: e.target.value })} placeholder="+1 555 000 0000" />
            </div>
          </div>
          {canEdit && <SaveBar />}
        </div>
      )}

      {/* Appearance */}
      {tab === 'appearance' && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Controls */}
          <div className="card p-4" style={{ flex: '1 1 300px', minWidth: 280, maxWidth: 440 }}>
            <div className="mb-4">
              <label className="form-label fw-medium" style={{ fontSize: 13 }}>Brand Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  className="form-control form-control-color"
                  style={{ width: 48, height: 38, padding: 3, borderRadius: 8, cursor: 'pointer' }}
                  value={form.brand_color ?? '#6366f1'}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                />
                <input
                  type="text"
                  className="form-control"
                  style={{ maxWidth: 110, fontFamily: 'monospace', fontSize: 13 }}
                  value={form.brand_color ?? '#6366f1'}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                />
              </div>
              {/* Presets */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {['#4f46e5','#0891b2','#7c3aed','#059669','#dc2626','#d97706','#0f172a','#1d4ed8'].map(c => (
                  <button
                    key={c}
                    title={c}
                    disabled={!canEdit}
                    onClick={() => setForm({ ...form, brand_color: c })}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', background: c,
                      border: form.brand_color === c ? '3px solid #fff' : '2px solid transparent',
                      boxShadow: form.brand_color === c ? `0 0 0 2px ${c}` : '0 1px 3px rgba(0,0,0,.2)',
                      cursor: 'pointer', padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium" style={{ fontSize: 13 }}>Position</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ v: 'bottom-right', label: 'Bottom Right' }, { v: 'bottom-left', label: 'Bottom Left' }].map(o => (
                  <label key={o.v} style={{
                    flex: 1, border: `2px solid ${(form.position ?? 'bottom-right') === o.v ? previewColor : '#e2e8f0'}`,
                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500,
                    background: (form.position ?? 'bottom-right') === o.v ? `${previewColor}10` : '#fff',
                    transition: 'all .15s',
                  }}>
                    <input
                      type="radio"
                      style={{ display: 'none' }}
                      checked={(form.position ?? 'bottom-right') === o.v}
                      disabled={!canEdit}
                      onChange={() => setForm({ ...form, position: o.v })}
                    />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={(form.position ?? 'bottom-right') === o.v ? previewColor : '#9ca3af'} strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="18" height="18" rx="3"/>
                      <circle cx={o.v === 'bottom-right' ? 17 : 7} cy="17" r="2.5" fill={(form.position ?? 'bottom-right') === o.v ? previewColor : '#9ca3af'} stroke="none"/>
                    </svg>
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-medium" style={{ fontSize: 13 }}>Theme</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ v: 'light', label: 'Light', icon: '☀️' }, { v: 'dark', label: 'Dark', icon: '🌙' }].map(o => (
                  <label key={o.v} style={{
                    flex: 1, border: `2px solid ${(form.theme ?? 'light') === o.v ? previewColor : '#e2e8f0'}`,
                    borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500,
                    background: (form.theme ?? 'light') === o.v ? `${previewColor}10` : '#fff',
                    transition: 'all .15s',
                  }}>
                    <input type="radio" style={{ display: 'none' }} checked={(form.theme ?? 'light') === o.v} disabled={!canEdit} onChange={() => setForm({ ...form, theme: o.v })} />
                    <span>{o.icon}</span>
                    {o.label}
                  </label>
                ))}
              </div>
            </div>

            {canEdit && <SaveBar />}
          </div>

          {/* Live Preview */}
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
              Live Preview
            </div>
            <WidgetPreview
              name={form.name ?? bot.name}
              color={previewColor}
              welcomeMessage={form.welcome_message ?? bot.welcome_message}
              dark={previewDark}
            />
          </div>
        </div>
      )}

      {/* Domains */}
      {tab === 'domains' && (
        <div style={{ maxWidth: 580 }}>
          <div className="card p-4">
            <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Allowed Domains</h6>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Only requests from these domains can use this bot. Use <code>*.example.com</code> for subdomains. Leave empty to allow all (not recommended for production).
            </p>

            {bot.domains.length === 0 ? (
              <div className="alert alert-warning d-flex align-items-center gap-2 py-2" style={{ fontSize: 13 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                No domains configured — widget will be blocked on all external sites.
              </div>
            ) : (
              <ul style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {bot.domains.map((d) => (
                  <li key={d.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px',
                  }}>
                    <code style={{ fontSize: 13 }}>{d.domain}</code>
                    {isAdmin && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ fontSize: 12 }}
                        onClick={() => removeDomain.mutate(d.id)}
                      >Remove</button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {isAdmin ? (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && newDomain.trim() && addDomain.mutate()}
                  />
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => addDomain.mutate()}
                    disabled={!newDomain.trim() || addDomain.isPending}
                  >Add</button>
                </div>
                {domainError && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>{domainError}</div>}
              </>
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Only admins and owners can add or remove domains.</p>
            )}
          </div>
        </div>
      )}

      {/* Install */}
      {tab === 'install' && (
        <div style={{ maxWidth: 680 }}>
          <div className="card p-4 mb-3">
            <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Embed Code</h6>
            <p className="text-muted" style={{ fontSize: 13, marginBottom: 14 }}>
              Paste this snippet just before the <code>&lt;/body&gt;</code> tag on every page where you want the chatbot to appear.
            </p>
            <div style={{
              background: '#0f172a', borderRadius: 10, padding: '14px 16px', marginBottom: 12,
              position: 'relative',
            }}>
              <pre style={{ color: '#4ade80', margin: 0, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {embedCode}
              </pre>
            </div>
            <button
              className={`btn ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}
              onClick={() => copyEmbed(embedCode)}
            >
              {copied ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy to Clipboard</>
              )}
            </button>
          </div>

          <div className="card p-4">
            <h6 style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Bot Public Key</h6>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ flex: 1, background: '#f1f5f9', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                {bot.public_key}
              </code>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigator.clipboard.writeText(bot.public_key)}
              >Copy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WidgetPreview({ name, color, welcomeMessage, dark }: { name: string; color: string; welcomeMessage: string; dark: boolean }) {
  const msgBg = dark ? '#27272a' : '#f1f5f9'
  const msgText = dark ? '#f4f4f5' : '#1e293b'
  const panelBg = dark ? '#18181b' : '#fff'
  const inputBg = dark ? '#1c1c1f' : '#fff'
  const inputBorder = dark ? '#3f3f46' : '#e2e8f0'
  const areaBg = dark ? '#0f0f12' : '#fafafa'
  const areaBorder = dark ? '#3f3f46' : '#e2e8f0'

  return (
    <div style={{
      width: 300,
      background: panelBg,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,.18)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${color}dd, ${color})`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{name || 'My Bot'}</div>
          <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: '12px 12px 6px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
        <div style={{ fontSize: 11.5, color: dark ? '#71717a' : '#94a3b8', textAlign: 'center', marginBottom: 4 }}>
          {welcomeMessage || 'Hi! How can I help you?'}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>🤖</div>
          <div style={{ background: msgBg, color: msgText, padding: '7px 10px', borderRadius: '10px 10px 10px 2px', fontSize: 11.5, lineHeight: 1.45, maxWidth: '80%' }}>
            Hi there! How can I help you today?
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: color, color: '#fff', padding: '7px 10px', borderRadius: '10px 10px 2px 10px', fontSize: 11.5, lineHeight: 1.45, maxWidth: '80%' }}>
            What are your opening hours?
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${areaBorder}`, background: areaBg, display: 'flex', gap: 6 }}>
        <div style={{ flex: 1, border: `1.5px solid ${inputBorder}`, borderRadius: 8, padding: '6px 9px', fontSize: 11.5, color: dark ? '#52525b' : '#94a3b8', background: inputBg }}>
          Type a message…
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
