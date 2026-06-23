import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useWorkspaceId } from '../hooks/useWorkspaceId'
import { useRole } from '../hooks/useRole'
import UpgradeModal from '../components/UpgradeModal'

interface Bot {
  id: string
  name: string
  public_key: string
  brand_color: string
  is_active: boolean
  created_at: string
}

interface CreateBotForm {
  name: string
  brand_color: string
  welcome_message: string
  fallback_email: string
}

const DEFAULTS: CreateBotForm = {
  name: '',
  brand_color: '#6366f1',
  welcome_message: 'Hi! How can I help you today?',
  fallback_email: '',
}

export default function BotsPage() {
  const workspaceId = useWorkspaceId()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin } = useRole()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateBotForm>(DEFAULTS)
  const [formError, setFormError] = useState('')
  const [upgradeReason, setUpgradeReason] = useState('')

  const { data: bots = [], isLoading } = useQuery<Bot[]>({
    queryKey: ['bots', workspaceId],
    queryFn: () => api.get(`/bots?workspace_id=${workspaceId}`).then((r) => r.data),
    enabled: !!workspaceId,
  })

  const createBot = useMutation({
    mutationFn: (data: CreateBotForm) =>
      api.post('/bots', { ...data, workspace_id: workspaceId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', workspaceId] })
      setShowModal(false)
      setForm(DEFAULTS)
      setFormError('')
    },
    onError: (e: any) => {
      if (e?.response?.status === 402) {
        setShowModal(false)
        setUpgradeReason(e?.response?.data?.detail || 'You have reached the bot limit on your current plan.')
      } else {
        setFormError(e?.response?.data?.detail || 'Failed to create bot. Please try again.')
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Bot name is required.'); return }
    createBot.mutate(form)
  }

  if (!workspaceId) {
    return <div className="alert alert-warning">No workspace selected. Please contact your administrator.</div>
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>Bots</h4>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setShowModal(true); setForm(DEFAULTS); setFormError('') }}>
            + New Bot
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-5">Loading…</div>
      ) : bots.length === 0 ? (
        <div className="card p-5 text-center text-muted">
          <div className="fs-1 mb-3">🤖</div>
          <p className="mb-3">No bots yet.</p>
          {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create your first bot</button>}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>Name</th><th>Status</th><th>Public Key</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {bots.map((bot) => (
                <tr key={bot.id}>
                  <td className="fw-medium">{bot.name}</td>
                  <td>
                    <span className={`badge ${bot.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td><code className="small text-muted">{bot.public_key}</code></td>
                  <td className="small text-muted">{new Date(bot.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate(`/bots/${bot.id}?workspace_id=${workspaceId}`)}
                    >
                      Settings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {upgradeReason && (
        <UpgradeModal reason={upgradeReason} onClose={() => setUpgradeReason('')} />
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Bot</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger py-2">{formError}</div>}
                  <div className="mb-3">
                    <label className="form-label">Bot Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Support Bot"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Welcome Message</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={form.welcome_message}
                      onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
                    />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label">Brand Color</label>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={form.brand_color}
                          onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
                        />
                        <span className="small text-muted">{form.brand_color}</span>
                      </div>
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label">Fallback Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={form.fallback_email}
                        onChange={(e) => setForm({ ...form, fallback_email: e.target.value })}
                        placeholder="support@example.com"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={createBot.isPending}>
                    {createBot.isPending ? 'Creating…' : 'Create Bot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
