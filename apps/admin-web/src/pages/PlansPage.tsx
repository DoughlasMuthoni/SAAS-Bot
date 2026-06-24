import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../lib/auth'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price_kes: number
  price_usd: number
  max_bots: number
  max_sources: number
  max_conversations_per_month: number
  max_team_members: number
  max_pages_per_crawl: number
  allow_crawl: boolean
  allow_file_upload: boolean
  allow_custom_branding: boolean
  is_active: boolean
  is_default: boolean
  sort_order: number
  features: string[] | null
  created_at: string
  updated_at: string
}

interface Org {
  id: string
  name: string
  slug: string
  plan: string
  is_suspended: boolean
  user_count: number
  bot_count: number
  created_at: string
}

interface OrgUserDetail {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

interface OrgDetail extends Org {
  suspension_reason: string | null
  suspended_at: string | null
  workspace_count: number
  users: OrgUserDetail[]
}

interface Faq {
  id: string
  question: string
  answer: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const BLANK_PLAN = {
  name: '',
  slug: '',
  description: '',
  price_kes: 0,
  price_usd: 0,
  max_bots: 1,
  max_sources: 5,
  max_conversations_per_month: 500,
  is_active: true,
  is_default: false,
  allow_crawl: false,
  allow_file_upload: true,
  allow_custom_branding: false,
  features: [''],
}

const BLANK_FAQ = { question: '', answer: '', is_active: true }

type Tab = 'plans' | 'organizations' | 'faqs'

function limitLabel(v: number) {
  return v === -1 ? '∞' : v.toLocaleString()
}

function PlanBadge({ slug, plans }: { slug: string; plans: Plan[] }) {
  const p = plans.find(x => x.slug === slug)
  const colors: Record<string, { bg: string; color: string }> = {
    free:       { bg: '#f1f5f9', color: '#64748b' },
    pro:        { bg: '#f0fdf4', color: '#16a34a' },
    enterprise: { bg: '#eff6ff', color: '#1d4ed8' },
  }
  const style = colors[slug] ?? { bg: '#fef9c3', color: '#92400e' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
      background: style.bg, color: style.color,
      textTransform: 'uppercase', letterSpacing: '.04em',
    }}>
      {p?.name ?? slug}
    </span>
  )
}

// ─── Arrow button for reordering ──────────────────────────────────────────────
function ArrowBtn({ dir, disabled, onClick }: { dir: 'up' | 'down'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={dir === 'up' ? 'Move up' : 'Move down'}
      style={{
        background: disabled ? '#f1f5f9' : '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? '#cbd5e1' : '#64748b',
        padding: 0,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {dir === 'up'
          ? <polyline points="18 15 12 9 6 15" />
          : <polyline points="6 9 12 15 18 9" />}
      </svg>
    </button>
  )
}

export default function PlansPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('plans')

  useEffect(() => {
    if (user && !user.is_superadmin) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  if (!user || !user.is_superadmin) return null

  // ── Plan modal state ───────────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [planForm, setPlanForm] = useState(BLANK_PLAN)
  const [planFormError, setPlanFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null)

  // ── FAQ modal state ────────────────────────────────────────────
  const [showFaqModal, setShowFaqModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null)
  const [faqForm, setFaqForm] = useState(BLANK_FAQ)
  const [faqFormError, setFaqFormError] = useState('')
  const [deleteFaqTarget, setDeleteFaqTarget] = useState<Faq | null>(null)

  // ── Org plan change ───────────────────────────────────────────
  const [orgPlanModal, setOrgPlanModal] = useState<Org | null>(null)
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('')

  // ── Org management state ──────────────────────────────────────
  const [orgDetailModal, setOrgDetailModal] = useState<OrgDetail | null>(null)
  const [orgDetailLoading, setOrgDetailLoading] = useState(false)
  const [orgSuspendModal, setOrgSuspendModal] = useState<Org | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [orgDeleteTarget, setOrgDeleteTarget] = useState<Org | null>(null)

  // ── Local plan order (for optimistic reorder UI) ───────────────
  const [localPlans, setLocalPlans] = useState<Plan[]>([])

  // ── Queries ───────────────────────────────────────────────────
  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: () => api.get('/admin/plans').then(r => r.data),
    staleTime: 0,
    refetchOnMount: true,
  })

  useEffect(() => { setLocalPlans(plans) }, [plans])

  const { data: orgs = [], isLoading: orgsLoading } = useQuery<Org[]>({
    queryKey: ['admin-orgs'],
    queryFn: () => api.get('/admin/organizations').then(r => r.data),
    enabled: tab === 'organizations',
  })

  const { data: faqs = [], isLoading: faqsLoading } = useQuery<Faq[]>({
    queryKey: ['admin-faqs'],
    queryFn: () => api.get('/admin/faqs').then(r => r.data),
    enabled: tab === 'faqs',
    staleTime: 0,
    refetchOnMount: true,
  })

  // Local FAQ order for optimistic UI
  const [localFaqs, setLocalFaqs] = useState<Faq[]>([])
  useEffect(() => { setLocalFaqs(faqs) }, [faqs])

  // ── Mutations ─────────────────────────────────────────────────
  const invalidatePlans = () => {
    qc.invalidateQueries({ queryKey: ['admin-plans'] })
    qc.invalidateQueries({ queryKey: ['plans-public'] })
    qc.invalidateQueries({ queryKey: ['usage'] })
  }

  const invalidateFaqs = () => {
    qc.invalidateQueries({ queryKey: ['admin-faqs'] })
  }

  const createPlan = useMutation({
    mutationFn: (data: typeof BLANK_PLAN) => api.post('/admin/plans', {
      ...data,
      features: data.features.filter(f => f.trim()),
    }),
    onSuccess: () => { invalidatePlans(); closePlanModal() },
    onError: (e: any) => setPlanFormError(e?.response?.data?.detail || 'Failed to create plan.'),
  })

  const updatePlan = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof BLANK_PLAN }) =>
      api.put(`/admin/plans/${id}`, { ...data, features: data.features.filter(f => f.trim()) }),
    onSuccess: () => { invalidatePlans(); closePlanModal() },
    onError: (e: any) => setPlanFormError(e?.response?.data?.detail || 'Failed to update plan.'),
  })

  const deletePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/plans/${id}`),
    onSuccess: () => { invalidatePlans(); setDeleteTarget(null) },
    onError: (e: any) => alert(e?.response?.data?.detail || 'Failed to delete plan.'),
  })

  const reorderPlans = useMutation({
    mutationFn: (ids: string[]) => api.put('/admin/plans/reorder', { ids }),
    onSuccess: () => invalidatePlans(),
  })

  const setOrgPlan = useMutation({
    mutationFn: ({ orgId, slug }: { orgId: string; slug: string }) =>
      api.put(`/admin/organizations/${orgId}/plan`, { plan_slug: slug }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orgs'] })
      setOrgPlanModal(null)
    },
    onError: (e: any) => alert(e?.response?.data?.detail || 'Failed to update plan.'),
  })

  const suspendOrg = useMutation({
    mutationFn: ({ orgId, reason }: { orgId: string; reason: string }) =>
      api.put(`/admin/organizations/${orgId}/suspend`, { reason: reason || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orgs'] })
      setOrgSuspendModal(null)
      setSuspendReason('')
    },
    onError: (e: any) => alert(e?.response?.data?.detail || 'Failed to suspend organisation.'),
  })

  const unsuspendOrg = useMutation({
    mutationFn: (orgId: string) => api.put(`/admin/organizations/${orgId}/unsuspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orgs'] }),
    onError: (e: any) => alert(e?.response?.data?.detail || 'Failed to unsuspend organisation.'),
  })

  const deleteOrg = useMutation({
    mutationFn: (orgId: string) => api.delete(`/admin/organizations/${orgId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orgs'] })
      setOrgDeleteTarget(null)
    },
    onError: (e: any) => alert(e?.response?.data?.detail || 'Failed to delete organisation.'),
  })

  const openOrgDetail = async (orgId: string) => {
    setOrgDetailLoading(true)
    setOrgDetailModal(null)
    try {
      const res = await api.get(`/admin/organizations/${orgId}`)
      setOrgDetailModal(res.data)
    } catch {
      alert('Failed to load organisation details.')
    } finally {
      setOrgDetailLoading(false)
    }
  }

  const createFaq = useMutation({
    mutationFn: (data: typeof BLANK_FAQ) => api.post('/admin/faqs', data),
    onSuccess: () => { invalidateFaqs(); closeFaqModal() },
    onError: (e: any) => setFaqFormError(e?.response?.data?.detail || 'Failed to create FAQ.'),
  })

  const updateFaq = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof BLANK_FAQ }) =>
      api.put(`/admin/faqs/${id}`, data),
    onSuccess: () => { invalidateFaqs(); closeFaqModal() },
    onError: (e: any) => setFaqFormError(e?.response?.data?.detail || 'Failed to update FAQ.'),
  })

  const deleteFaqMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/faqs/${id}`),
    onSuccess: () => { invalidateFaqs(); setDeleteFaqTarget(null) },
    onError: (e: any) => alert(e?.response?.data?.detail || 'Failed to delete FAQ.'),
  })

  const reorderFaqs = useMutation({
    mutationFn: (ids: string[]) => api.put('/admin/faqs/reorder', { ids }),
    onSuccess: () => invalidateFaqs(),
  })

  // ── Plan helpers ───────────────────────────────────────────────
  const movePlan = (index: number, dir: -1 | 1) => {
    const next = [...localPlans]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setLocalPlans(next)
    reorderPlans.mutate(next.map(p => p.id))
  }

  const openCreatePlan = () => {
    setEditingPlan(null)
    setPlanForm(BLANK_PLAN)
    setPlanFormError('')
    setShowPlanModal(true)
  }

  const openEditPlan = (p: Plan) => {
    setEditingPlan(p)
    setPlanForm({
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      price_kes: p.price_kes,
      price_usd: p.price_usd,
      max_bots: p.max_bots,
      max_sources: p.max_sources,
      max_conversations_per_month: p.max_conversations_per_month,
      is_active: p.is_active,
      is_default: p.is_default,
      allow_crawl: p.allow_crawl ?? false,
      allow_file_upload: p.allow_file_upload ?? true,
      allow_custom_branding: (p as any).allow_custom_branding ?? false,
      features: p.features?.length ? p.features : [''],
    })
    setPlanFormError('')
    setShowPlanModal(true)
  }

  const closePlanModal = () => {
    setShowPlanModal(false)
    setEditingPlan(null)
    setPlanForm(BLANK_PLAN)
    setPlanFormError('')
  }

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPlanFormError('')
    if (!planForm.name.trim()) { setPlanFormError('Plan name is required.'); return }
    if (!planForm.slug.trim()) { setPlanFormError('Slug is required.'); return }
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, data: planForm })
    } else {
      createPlan.mutate(planForm)
    }
  }

  const updateFeature = (i: number, val: string) => {
    const next = [...planForm.features]
    next[i] = val
    setPlanForm({ ...planForm, features: next })
  }

  // ── FAQ helpers ────────────────────────────────────────────────
  const moveFaq = (index: number, dir: -1 | 1) => {
    const next = [...localFaqs]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setLocalFaqs(next)
    reorderFaqs.mutate(next.map(f => f.id))
  }

  const openCreateFaq = () => {
    setEditingFaq(null)
    setFaqForm(BLANK_FAQ)
    setFaqFormError('')
    setShowFaqModal(true)
  }

  const openEditFaq = (f: Faq) => {
    setEditingFaq(f)
    setFaqForm({ question: f.question, answer: f.answer, is_active: f.is_active })
    setFaqFormError('')
    setShowFaqModal(true)
  }

  const closeFaqModal = () => {
    setShowFaqModal(false)
    setEditingFaq(null)
    setFaqForm(BLANK_FAQ)
    setFaqFormError('')
  }

  const handleFaqSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFaqFormError('')
    if (!faqForm.question.trim()) { setFaqFormError('Question is required.'); return }
    if (!faqForm.answer.trim()) { setFaqFormError('Answer is required.'); return }
    if (editingFaq) {
      updateFaq.mutate({ id: editingFaq.id, data: faqForm })
    } else {
      createFaq.mutate(faqForm)
    }
  }

  const isPlanPending = createPlan.isPending || updatePlan.isPending
  const isFaqPending = createFaq.isPending || updateFaq.isPending

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="cb-page-header">
        <div>
          <h4 style={{ margin: 0 }}>Plans & Organisations</h4>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Manage subscription plans, FAQs, and assign plans to organisations
          </p>
        </div>
        {tab === 'plans' && (
          <button
            className="btn btn-primary"
            style={{ borderRadius: 9, fontWeight: 600, fontSize: 13.5 }}
            onClick={openCreatePlan}
          >
            + New Plan
          </button>
        )}
        {tab === 'faqs' && (
          <button
            className="btn btn-primary"
            style={{ borderRadius: 9, fontWeight: 600, fontSize: 13.5 }}
            onClick={openCreateFaq}
          >
            + New FAQ
          </button>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <ul className="nav nav-tabs mb-4">
        {(['plans', 'organizations', 'faqs'] as Tab[]).map(t => (
          <li key={t} className="nav-item">
            <button
              type="button"
              className={`nav-link ${tab === t ? 'active' : ''}`}
              style={{ fontSize: 13 }}
              onClick={() => setTab(t)}
            >
              {t === 'plans' ? '📋 Plans' : t === 'organizations' ? '🏢 Organisations' : '❓ FAQs'}
            </button>
          </li>
        ))}
      </ul>

      {/* ── Plans tab ───────────────────────────────────────── */}
      {tab === 'plans' && (
        plansLoading ? <div className="cb-spinner" /> : (
          <>
            {localPlans.length > 1 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Use the ↑ ↓ arrows on each card to rearrange plans. Order is reflected on the public pricing page.
              </div>
            )}
            <div className="row g-3">
              {localPlans.map((plan, idx) => (
                <div key={plan.id} className="col-lg-4 col-md-6">
                  <div style={{
                    background: '#fff', borderRadius: 14,
                    border: `2px solid ${plan.is_default ? '#16a34a' : '#e2e8f0'}`,
                    padding: '1.25rem',
                    boxShadow: plan.is_default ? '0 4px 16px rgba(22,163,74,.15)' : '0 1px 4px rgba(0,0,0,.06)',
                    display: 'flex', flexDirection: 'column', gap: 0,
                    position: 'relative',
                  }}>
                    {plan.is_default && (
                      <div style={{
                        position: 'absolute', top: -11, left: 16,
                        background: '#16a34a', color: '#fff',
                        fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
                        letterSpacing: '.05em',
                      }}>DEFAULT</div>
                    )}

                    {/* Plan header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{plan.name}</div>
                        <code style={{ fontSize: 11 }}>{plan.slug}</code>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
                          background: plan.is_active ? '#f0fdf4' : '#f1f5f9',
                          color: plan.is_active ? '#16a34a' : '#94a3b8',
                        }}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {/* Reorder arrows */}
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          <ArrowBtn dir="up" disabled={idx === 0} onClick={() => movePlan(idx, -1)} />
                          <ArrowBtn dir="down" disabled={idx === localPlans.length - 1} onClick={() => movePlan(idx, 1)} />
                        </div>
                      </div>
                    </div>

                    {plan.description && (
                      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 10px', lineHeight: 1.5 }}>
                        {plan.description}
                      </p>
                    )}

                    {/* Pricing */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                        <div style={{ color: '#94a3b8', marginBottom: 2 }}>KES</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {plan.price_kes > 0 ? plan.price_kes.toLocaleString() : 'Free'}
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                        <div style={{ color: '#94a3b8', marginBottom: 2 }}>USD</div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {plan.price_usd > 0 ? `$${plan.price_usd}` : 'Free'}
                        </div>
                      </div>
                    </div>

                    {/* Limits */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Bots', val: limitLabel(plan.max_bots) },
                        { label: 'Sources', val: limitLabel(plan.max_sources) },
                        { label: 'Conv/mo', val: limitLabel(plan.max_conversations_per_month) },
                      ].map(l => (
                        <div key={l.label} style={{ background: '#f8fafc', borderRadius: 7, padding: '4px 10px', fontSize: 12, textAlign: 'center' }}>
                          <div style={{ color: '#94a3b8', fontSize: 10 }}>{l.label}</div>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{l.val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Features */}
                    {plan.features && plan.features.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {plan.features.slice(0, 5).map((f, i) => {
                          const excluded = f.startsWith('-')
                          const label = excluded ? f.slice(1).trim() : f
                          return (
                            <li key={i} style={{ fontSize: 12, color: excluded ? '#9ca3af' : '#475569', display: 'flex', alignItems: 'flex-start', gap: 6, opacity: excluded ? 0.65 : 1 }}>
                              {excluded ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                              {label}
                            </li>
                          )
                        })}
                        {plan.features.length > 5 && (
                          <li style={{ fontSize: 11, color: '#94a3b8' }}>+{plan.features.length - 5} more…</li>
                        )}
                      </ul>
                    )}

                    {/* Feature gate badges */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {[
                        { label: 'File upload', enabled: plan.allow_file_upload },
                        { label: 'Web crawler', enabled: plan.allow_crawl },
                        { label: 'Custom branding', enabled: (plan as any).allow_custom_branding ?? false },
                      ].map(g => (
                        <span key={g.label} style={{
                          fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                          background: g.enabled ? '#f0fdf4' : '#f8fafc',
                          color: g.enabled ? '#16a34a' : '#94a3b8',
                          border: `1px solid ${g.enabled ? '#bbf7d0' : '#e2e8f0'}`,
                        }}>
                          {g.enabled ? '✓' : '✗'} {g.label}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        style={{ borderRadius: 8, fontSize: 12, flex: 1 }}
                        onClick={() => openEditPlan(plan)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ borderRadius: 8, fontSize: 12 }}
                        onClick={() => setDeleteTarget(plan)}
                        title="Delete plan"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {localPlans.length === 0 && (
                <div className="col-12">
                  <div className="cb-empty">
                    <div className="cb-empty-icon">📋</div>
                    <h6 style={{ color: '#374151' }}>No plans yet</h6>
                    <p style={{ fontSize: 14, marginBottom: 16 }}>Create your first subscription plan.</p>
                    <button className="btn btn-primary" style={{ borderRadius: 9 }} onClick={openCreatePlan}>
                      Create Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* ── Organisations tab ────────────────────────────────── */}
      {tab === 'organizations' && (
        orgsLoading ? <div className="cb-spinner" /> : (
          <div className="card p-0" style={{ overflow: 'hidden' }}>
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th style={{ textAlign: 'center' }}>Users</th>
                  <th style={{ textAlign: 'center' }}>Bots</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orgs.map(org => (
                  <tr key={org.id} style={{ opacity: org.is_suspended ? 0.7 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{org.name}</div>
                      <code style={{ fontSize: 11, color: '#94a3b8' }}>{org.slug}</code>
                    </td>
                    <td>
                      {org.is_suspended
                        ? <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, padding: '3px 8px' }}>Suspended</span>
                        : <span className="badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 11, padding: '3px 8px' }}>Active</span>
                      }
                    </td>
                    <td><PlanBadge slug={org.plan} plans={plans} /></td>
                    <td style={{ textAlign: 'center', fontSize: 13 }}>{org.user_count}</td>
                    <td style={{ textAlign: 'center', fontSize: 13 }}>{org.bot_count}</td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          style={{ borderRadius: 8, fontSize: 11 }}
                          onClick={() => openOrgDetail(org.id)}
                        >
                          Details
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: 8, fontSize: 11 }}
                          onClick={() => { setOrgPlanModal(org); setSelectedPlanSlug(org.plan) }}
                        >
                          Plan
                        </button>
                        {org.is_suspended ? (
                          <button
                            className="btn btn-sm btn-outline-success"
                            style={{ borderRadius: 8, fontSize: 11 }}
                            disabled={unsuspendOrg.isPending}
                            onClick={() => unsuspendOrg.mutate(org.id)}
                          >
                            Unsuspend
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-warning"
                            style={{ borderRadius: 8, fontSize: 11 }}
                            onClick={() => { setOrgSuspendModal(org); setSuspendReason('') }}
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: 8, fontSize: 11 }}
                          onClick={() => setOrgDeleteTarget(org)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No organisations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── FAQs tab ─────────────────────────────────────────── */}
      {tab === 'faqs' && (
        faqsLoading ? <div className="cb-spinner" /> : (
          <>
            {localFaqs.length > 1 && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Use the ↑ ↓ arrows to reorder. Active FAQs appear on the public website in this order.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {localFaqs.map((faq, idx) => (
                <div key={faq.id} style={{
                  background: '#fff', borderRadius: 12,
                  border: `1px solid ${faq.is_active ? '#e2e8f0' : '#f1f5f9'}`,
                  padding: '1rem 1.25rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                  opacity: faq.is_active ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Reorder arrows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, paddingTop: 2 }}>
                      <ArrowBtn dir="up" disabled={idx === 0} onClick={() => moveFaq(idx, -1)} />
                      <ArrowBtn dir="down" disabled={idx === localFaqs.length - 1} onClick={() => moveFaq(idx, 1)} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{faq.question}</span>
                        {!faq.is_active && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: '#f1f5f9', color: '#94a3b8', textTransform: 'uppercase' }}>Hidden</span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.55 }}>{faq.answer}</p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        style={{ borderRadius: 8, fontSize: 12 }}
                        onClick={() => openEditFaq(faq)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ borderRadius: 8, fontSize: 12 }}
                        onClick={() => setDeleteFaqTarget(faq)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {localFaqs.length === 0 && (
                <div className="cb-empty">
                  <div className="cb-empty-icon">❓</div>
                  <h6 style={{ color: '#374151' }}>No FAQs yet</h6>
                  <p style={{ fontSize: 14, marginBottom: 16 }}>Add questions that appear on the public website.</p>
                  <button className="btn btn-primary" style={{ borderRadius: 9 }} onClick={openCreateFaq}>
                    Add FAQ
                  </button>
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* ── Create/Edit Plan Modal ───────────────────────────── */}
      {showPlanModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1300 }}
          onClick={e => { if (e.target === e.currentTarget) closePlanModal() }}>
          <div className="modal-dialog modal-lg" style={{ marginTop: '3vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none', overflow: 'hidden' }}>

              <div style={{ background: 'linear-gradient(135deg,#15803d,#16a34a)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h5 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
                    {editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}
                  </h5>
                  <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, margin: '2px 0 0' }}>
                    Set limits, pricing, and features for this plan
                  </p>
                </div>
                <button onClick={closePlanModal} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              <form onSubmit={handlePlanSubmit}>
                <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                  {planFormError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {planFormError}
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Plan Name <span className="text-danger">*</span></label>
                      <input
                        className="form-control" style={{ borderRadius: 9 }}
                        value={planForm.name}
                        onChange={e => {
                          const name = e.target.value
                          const autoSlug = editingPlan ? planForm.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
                          setPlanForm({ ...planForm, name, ...(!editingPlan && { slug: autoSlug }) })
                        }}
                        placeholder="e.g. Pro, Starter, Business"
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Slug <span className="text-danger">*</span></label>
                      <input
                        className="form-control" style={{ borderRadius: 9, fontFamily: 'monospace' }}
                        value={planForm.slug}
                        onChange={e => setPlanForm({ ...planForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                        placeholder="e.g. pro"
                        disabled={!!editingPlan}
                      />
                      <div className="form-text">Lowercase, no spaces. Cannot change after creation.</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Description</label>
                    <input
                      className="form-control" style={{ borderRadius: 9 }}
                      value={planForm.description}
                      onChange={e => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Short description shown on billing page"
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Price (KES/month)</label>
                      <input
                        type="number" className="form-control" style={{ borderRadius: 9 }}
                        value={planForm.price_kes}
                        onChange={e => setPlanForm({ ...planForm, price_kes: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Price (USD/month)</label>
                      <input
                        type="number" className="form-control" style={{ borderRadius: 9 }}
                        value={planForm.price_usd}
                        onChange={e => setPlanForm({ ...planForm, price_usd: Number(e.target.value) })}
                        min={0}
                      />
                    </div>
                  </div>

                  <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1rem' }} />
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 .75rem' }}>
                    Set <strong style={{ color: '#64748b' }}>-1</strong> for unlimited
                  </p>

                  <div className="row g-3 mb-3">
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Max Bots</label>
                      <input
                        type="number" className="form-control" style={{ borderRadius: 9 }}
                        value={planForm.max_bots}
                        onChange={e => setPlanForm({ ...planForm, max_bots: Number(e.target.value) })}
                        min={-1}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Max Sources</label>
                      <input
                        type="number" className="form-control" style={{ borderRadius: 9 }}
                        value={planForm.max_sources}
                        onChange={e => setPlanForm({ ...planForm, max_sources: Number(e.target.value) })}
                        min={-1}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Conv/month</label>
                      <input
                        type="number" className="form-control" style={{ borderRadius: 9 }}
                        value={planForm.max_conversations_per_month}
                        onChange={e => setPlanForm({ ...planForm, max_conversations_per_month: Number(e.target.value) })}
                        min={-1}
                      />
                    </div>
                  </div>

                  <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1rem' }} />

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                      Features
                      <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>shown on pricing page</span>
                    </label>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '0 0 8px' }}>
                      Toggle ✅/❌ to show as included or excluded on the public pricing page.
                    </p>
                    {planForm.features.map((f, i) => {
                      const excluded = f.startsWith('-')
                      const label = excluded ? f.slice(1) : f
                      return (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                          {/* Include/exclude toggle */}
                          <button
                            type="button"
                            title={excluded ? 'Mark as included' : 'Mark as excluded'}
                            onClick={() => updateFeature(i, excluded ? label : `-${label}`)}
                            style={{
                              flexShrink: 0, width: 32, height: 34,
                              background: excluded ? '#fef2f2' : '#f0fdf4',
                              border: `1px solid ${excluded ? '#fecaca' : '#bbf7d0'}`,
                              borderRadius: 8, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            {excluded ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                          <input
                            className="form-control"
                            style={{ borderRadius: 9, fontSize: 13, opacity: excluded ? 0.65 : 1 }}
                            value={label}
                            onChange={e => updateFeature(i, excluded ? `-${e.target.value}` : e.target.value)}
                            placeholder={`Feature ${i + 1}`}
                          />
                          {planForm.features.length > 1 && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', flexShrink: 0, padding: '0 4px' }}
                              onClick={() => setPlanForm({ ...planForm, features: planForm.features.filter((_, j) => j !== i) })}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          )}
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      style={{ borderRadius: 8, fontSize: 12 }}
                      onClick={() => setPlanForm({ ...planForm, features: [...planForm.features, ''] })}
                    >
                      + Add Feature
                    </button>
                  </div>

                  <hr style={{ borderColor: '#f1f5f9', margin: '0 0 1rem' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Feature Gates</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                      {[
                        { field: 'allow_crawl' as const, label: 'Web crawler ingestion' },
                        { field: 'allow_file_upload' as const, label: 'File upload (PDF, DOCX…)' },
                        { field: 'allow_custom_branding' as const, label: 'Custom branding (hides "Powered by" badge)' },
                      ].map(({ field, label }) => (
                        <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                          <input
                            type="checkbox"
                            checked={(planForm as any)[field]}
                            onChange={e => setPlanForm({ ...planForm, [field]: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <hr style={{ borderColor: '#f1f5f9', margin: '0' }} />
                    <div style={{ display: 'flex', gap: 24 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={planForm.is_active}
                          onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                        />
                        Active (visible to users)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={planForm.is_default}
                          onChange={e => setPlanForm({ ...planForm, is_default: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                        />
                        Default plan for new organisations
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1rem 1.5rem' }}>
                  <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 9 }} onClick={closePlanModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: 9, fontWeight: 600 }} disabled={isPlanPending}>
                    {isPlanPending ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="spinner-border spinner-border-sm" />
                        Saving…
                      </span>
                    ) : editingPlan ? 'Save Changes' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Create/Edit FAQ Modal ────────────────────────────── */}
      {showFaqModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1300 }}
          onClick={e => { if (e.target === e.currentTarget) closeFaqModal() }}>
          <div className="modal-dialog" style={{ maxWidth: 560, marginTop: '8vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none', overflow: 'hidden' }}>

              <div style={{ background: 'linear-gradient(135deg,#15803d,#16a34a)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h5 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
                    {editingFaq ? 'Edit FAQ' : 'New FAQ'}
                  </h5>
                  <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, margin: '2px 0 0' }}>
                    Appears on the public website FAQ section
                  </p>
                </div>
                <button onClick={closeFaqModal} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 8, color: '#fff', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              <form onSubmit={handleFaqSubmit}>
                <div className="modal-body" style={{ padding: '1.5rem' }}>
                  {faqFormError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {faqFormError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Question <span className="text-danger">*</span></label>
                    <input
                      className="form-control" style={{ borderRadius: 9 }}
                      value={faqForm.question}
                      onChange={e => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="e.g. How do I embed the bot?"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Answer <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control" style={{ borderRadius: 9, minHeight: 100, resize: 'vertical' }}
                      value={faqForm.answer}
                      onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="Write a clear, concise answer…"
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={faqForm.is_active}
                      onChange={e => setFaqForm({ ...faqForm, is_active: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                    />
                    Visible on public website
                  </label>
                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '1rem 1.5rem' }}>
                  <button type="button" className="btn btn-outline-secondary" style={{ borderRadius: 9 }} onClick={closeFaqModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: 9, fontWeight: 600 }} disabled={isFaqPending}>
                    {isFaqPending ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="spinner-border spinner-border-sm" />
                        Saving…
                      </span>
                    ) : editingFaq ? 'Save Changes' : 'Add FAQ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Plan Confirmation ─────────────────────────── */}
      {deleteTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1400 }}>
          <div className="modal-dialog" style={{ maxWidth: 420, marginTop: '20vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none' }}>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                <h5 style={{ fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
                  Delete "{deleteTarget.name}"?
                </h5>
                <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 1.5rem' }}>
                  This plan will be permanently deleted. Any organisations currently on this plan must be reassigned first.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-outline-secondary" style={{ borderRadius: 9, minWidth: 100 }} onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ borderRadius: 9, minWidth: 100 }}
                    disabled={deletePlan.isPending}
                    onClick={() => deletePlan.mutate(deleteTarget.id)}
                  >
                    {deletePlan.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete FAQ Confirmation ──────────────────────────── */}
      {deleteFaqTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1400 }}>
          <div className="modal-dialog" style={{ maxWidth: 400, marginTop: '20vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none' }}>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
                <h5 style={{ fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Delete this FAQ?</h5>
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 4px' }}>"{deleteFaqTarget.question}"</p>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 1.5rem' }}>This will be removed from the public website immediately.</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-outline-secondary" style={{ borderRadius: 9, minWidth: 90 }} onClick={() => setDeleteFaqTarget(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ borderRadius: 9, minWidth: 90 }}
                    disabled={deleteFaqMutation.isPending}
                    onClick={() => deleteFaqMutation.mutate(deleteFaqTarget.id)}
                  >
                    {deleteFaqMutation.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Org Plan Modal ────────────────────────────── */}
      {orgPlanModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1400 }}>
          <div className="modal-dialog" style={{ maxWidth: 440, marginTop: '20vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#15803d,#16a34a)', padding: '1.25rem 1.5rem' }}>
                <h5 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Change Plan</h5>
                <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, margin: '2px 0 0' }}>{orgPlanModal.name}</p>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Select Plan</label>
                <select
                  className="form-select"
                  style={{ borderRadius: 9 }}
                  value={selectedPlanSlug}
                  onChange={e => setSelectedPlanSlug(e.target.value)}
                >
                  {plans.filter(p => p.is_active).map(p => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} — {p.max_bots === -1 ? '∞' : p.max_bots} bots · {p.max_sources === -1 ? '∞' : p.max_sources} sources
                    </option>
                  ))}
                </select>

                {(() => {
                  const sel = plans.find(p => p.slug === selectedPlanSlug)
                  if (!sel) return null
                  return (
                    <div style={{ background: '#f8fafc', borderRadius: 9, padding: '10px 14px', marginTop: 12, fontSize: 13, color: '#475569' }}>
                      <div style={{ fontWeight: 700, marginBottom: 6, color: '#1e293b' }}>{sel.name} limits</div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span>Bots: <strong>{limitLabel(sel.max_bots)}</strong></span>
                        <span>Sources: <strong>{limitLabel(sel.max_sources)}</strong></span>
                        <span>Conv: <strong>{limitLabel(sel.max_conversations_per_month)}</strong></span>
                      </div>
                    </div>
                  )
                })()}
              </div>
              <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline-secondary" style={{ borderRadius: 9 }} onClick={() => setOrgPlanModal(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  style={{ borderRadius: 9, fontWeight: 600 }}
                  disabled={setOrgPlan.isPending || selectedPlanSlug === orgPlanModal.plan}
                  onClick={() => setOrgPlan.mutate({ orgId: orgPlanModal.id, slug: selectedPlanSlug })}
                >
                  {setOrgPlan.isPending ? 'Saving…' : 'Assign Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Org Detail Modal ─────────────────────────────────── */}
      {(orgDetailLoading || orgDetailModal) && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1500 }}>
          <div className="modal-dialog" style={{ maxWidth: 640, marginTop: '8vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h5 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>{orgDetailModal?.name ?? 'Loading…'}</h5>
                  {orgDetailModal && <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, margin: '2px 0 0' }}>{orgDetailModal.slug} · {orgDetailModal.plan} plan</p>}
                </div>
                <button className="btn btn-sm" style={{ color: '#fff', background: 'rgba(255,255,255,.2)', borderRadius: 8 }} onClick={() => setOrgDetailModal(null)}>✕</button>
              </div>
              {orgDetailLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}><div className="cb-spinner" /></div>
              ) : orgDetailModal && (
                <div style={{ padding: '1.5rem' }}>
                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Users', value: orgDetailModal.user_count },
                      { label: 'Bots', value: orgDetailModal.bot_count },
                      { label: 'Workspaces', value: orgDetailModal.workspace_count },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
                      </div>
                    ))}
                    <div style={{ flex: 1, background: orgDetailModal.is_suspended ? '#fef2f2' : '#f0fdf4', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: orgDetailModal.is_suspended ? '#dc2626' : '#16a34a' }}>
                        {orgDetailModal.is_suspended ? 'Suspended' : 'Active'}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Status</div>
                    </div>
                  </div>
                  {orgDetailModal.is_suspended && orgDetailModal.suspension_reason && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>
                      <strong>Suspension reason:</strong> {orgDetailModal.suspension_reason}
                    </div>
                  )}
                  {/* User list */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 8 }}>Team Members</div>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                    <table className="table table-sm align-middle mb-0">
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ fontSize: 12 }}>Name / Email</th>
                          <th style={{ fontSize: 12 }}>Role</th>
                          <th style={{ fontSize: 12 }}>Status</th>
                          <th style={{ fontSize: 12 }}>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgDetailModal.users.map(u => (
                          <tr key={u.id}>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{u.full_name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
                            </td>
                            <td><span style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 5, color: '#475569' }}>{u.role}</span></td>
                            <td>
                              {u.is_active
                                ? <span style={{ fontSize: 11, color: '#16a34a' }}>Active</span>
                                : <span style={{ fontSize: 11, color: '#dc2626' }}>Inactive</span>
                              }
                            </td>
                            <td style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {orgDetailModal.users.length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem', fontSize: 13 }}>No users.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline-secondary" style={{ borderRadius: 9 }} onClick={() => setOrgDetailModal(null)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend Org Modal ────────────────────────────────── */}
      {orgSuspendModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1500 }}>
          <div className="modal-dialog" style={{ maxWidth: 440, marginTop: '20vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#b45309,#d97706)', padding: '1.25rem 1.5rem' }}>
                <h5 style={{ color: '#fff', margin: 0, fontWeight: 700 }}>Suspend Organisation</h5>
                <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, margin: '2px 0 0' }}>{orgSuspendModal.name}</p>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: 13.5, color: '#475569', marginBottom: 14 }}>
                  Suspending this organisation will block all widget access for its bots. Users will still be able to log in to the admin panel.
                </p>
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Reason (optional)</label>
                <textarea
                  className="form-control"
                  style={{ borderRadius: 9, fontSize: 13 }}
                  rows={3}
                  placeholder="e.g. Payment overdue, policy violation…"
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                />
              </div>
              <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline-secondary" style={{ borderRadius: 9 }} onClick={() => setOrgSuspendModal(null)}>Cancel</button>
                <button
                  className="btn btn-warning"
                  style={{ borderRadius: 9, fontWeight: 600 }}
                  disabled={suspendOrg.isPending}
                  onClick={() => suspendOrg.mutate({ orgId: orgSuspendModal.id, reason: suspendReason })}
                >
                  {suspendOrg.isPending ? 'Suspending…' : 'Suspend'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Org Confirmation ───────────────────────────── */}
      {orgDeleteTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.55)', zIndex: 1500 }}>
          <div className="modal-dialog" style={{ maxWidth: 400, marginTop: '20vh' }}>
            <div className="modal-content" style={{ borderRadius: 14, border: 'none' }}>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                <h5 style={{ fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>Delete Organisation?</h5>
                <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 4px' }}>
                  <strong>{orgDeleteTarget.name}</strong>
                </p>
                <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 1.5rem' }}>
                  This will soft-delete the organisation and all its data will be hidden. This action can be reversed manually in the database.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button className="btn btn-outline-secondary" style={{ borderRadius: 9, minWidth: 100 }} onClick={() => setOrgDeleteTarget(null)}>Cancel</button>
                  <button
                    className="btn btn-danger"
                    style={{ borderRadius: 9, minWidth: 100 }}
                    disabled={deleteOrg.isPending}
                    onClick={() => deleteOrg.mutate(orgDeleteTarget.id)}
                  >
                    {deleteOrg.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
