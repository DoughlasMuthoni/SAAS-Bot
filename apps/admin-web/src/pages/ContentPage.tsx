import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

interface Page {
  slug: string
  title: string
  content: string
  updated_by: string | null
  updated_at: string
}

const PAGES = [
  { slug: 'privacy', label: 'Privacy Policy', icon: '🔒' },
  { slug: 'terms', label: 'Terms of Service', icon: '📄' },
  { slug: 'security', label: 'Security', icon: '🛡️' },
]

export default function ContentPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeSlug, setActiveSlug] = useState('privacy')
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (user && !user.is_superadmin) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  if (!user || !user.is_superadmin) return null

  const { data: page, isLoading } = useQuery<Page>({
    queryKey: ['admin-page', activeSlug],
    queryFn: () => api.get(`/admin/pages/${activeSlug}`).then(r => r.data),
    staleTime: 0,
  })

  useEffect(() => {
    if (page) {
      setEditContent(page.content)
      setEditTitle(page.title)
      setDirty(false)
      setSaveError('')
      setSaveSuccess(false)
    }
  }, [page])

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/admin/pages/${activeSlug}`, { title: editTitle, content: editContent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-page', activeSlug] })
      setDirty(false)
      setSaveError('')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (e: any) => {
      setSaveError(e?.response?.data?.detail || 'Failed to save. Please try again.')
    },
  })

  const handleContentChange = (val: string) => {
    setEditContent(val)
    setDirty(true)
    setSaveSuccess(false)
  }

  const handleTitleChange = (val: string) => {
    setEditTitle(val)
    setDirty(true)
    setSaveSuccess(false)
  }

  const switchTab = (slug: string) => {
    setActiveSlug(slug)
    setPreview(false)
    setSaveError('')
    setSaveSuccess(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="cb-page-header">
        <div>
          <h4 style={{ margin: 0 }}>Content Pages</h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Edit the Privacy Policy, Terms of Service, and Security pages shown on your platform
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className={`btn btn-sm ${preview ? 'btn-secondary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 8, fontSize: 13 }}
            onClick={() => setPreview(!preview)}
          >
            {preview ? '✏️ Edit' : '👁️ Preview'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ borderRadius: 9, fontWeight: 600, fontSize: 13.5 }}
            disabled={!dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner-border spinner-border-sm" />
                Saving…
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <ul className="nav nav-tabs mb-4">
        {PAGES.map(p => (
          <li key={p.slug} className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeSlug === p.slug ? 'active' : ''}`}
              style={{ fontSize: 13 }}
              onClick={() => switchTab(p.slug)}
            >
              {p.icon} {p.label}
            </button>
          </li>
        ))}
      </ul>

      {isLoading ? (
        <div className="cb-spinner" />
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>

          {/* Status bar */}
          <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {dirty && (
                <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Unsaved changes
                </span>
              )}
              {saveSuccess && (
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Saved successfully
                </span>
              )}
            </div>
            {page?.updated_by && (
              <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                Last edited by {page.updated_by} · {new Date(page.updated_at).toLocaleString()}
              </span>
            )}
          </div>

          <div style={{ padding: '1.5rem' }}>
            {saveError && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {saveError}
              </div>
            )}

            {/* Title field */}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Page Title</label>
              <input
                className="form-control"
                style={{ borderRadius: 9, maxWidth: 480 }}
                value={editTitle}
                onChange={e => handleTitleChange(e.target.value)}
                disabled={preview}
              />
            </div>

            {/* Content editor / preview */}
            {preview ? (
              <div>
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Preview</label>
                <div
                  style={{
                    border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.5rem 2rem',
                    minHeight: 400, background: '#fff', lineHeight: 1.75,
                    fontFamily: 'inherit', fontSize: 14.5, color: '#374151',
                  }}
                  dangerouslySetInnerHTML={{ __html: editContent }}
                />
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label fw-semibold mb-0" style={{ fontSize: 13 }}>HTML Content</label>
                  <span style={{ fontSize: 11.5, color: '#94a3b8' }}>You can use HTML tags for formatting</span>
                </div>
                <textarea
                  className="form-control"
                  style={{ borderRadius: 10, minHeight: 480, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6, resize: 'vertical' }}
                  value={editContent}
                  onChange={e => handleContentChange(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
