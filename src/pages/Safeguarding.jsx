import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { ShieldCheck, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import DeleteModal from '../components/DeleteModal'

const emptyForm = {
  member_id: '', log_type: 'drop_off', guardian_name: '',
  guardian_phone: '', notes: '', logged_by: ''
}

function Safeguarding() {
  const [logs, setLogs] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [logsRes, membersRes] = await Promise.all([
      supabase.from('safeguarding_logs').select('*, members(full_name)').order('logged_at', { ascending: false }),
      supabase.from('members').select('id, full_name').eq('active', true).order('full_name')
    ])
    setLogs(logsRes.data || [])
    setMembers(membersRes.data || [])
    setLoading(false)
  }

  async function saveLog() {
    if (!form.member_id || !form.guardian_name || !form.guardian_phone) {
      return toast.error('Member, guardian name and phone are required')
    }
    setSaving(true)
    const { error } = await supabase.from('safeguarding_logs').insert(form)
    if (error) toast.error('Failed to save log')
    else toast.success('Safeguarding log saved')
    setSaving(false)
    setShowModal(false)
    setForm(emptyForm)
    fetchData()
  }

  async function deleteLog() {
    const { error } = await supabase.from('safeguarding_logs').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Failed to delete log')
    else toast.success('Log deleted')
    setDeleteTarget(null)
    fetchData()
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading safeguarding logs" />

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Safeguarding Logs</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} aria-label="Add safeguarding log">
          <Plus size={18} aria-hidden="true" /> Add Log
        </button>
      </div>

      <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#1d4ed8', fontSize: '0.9rem' }} role="note">
        <strong>About this page:</strong> Use this to record drop-off and collection of young members. All logs are timestamped and stored securely.
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={40} color="#94a3b8" aria-hidden="true" />
            <p>No safeguarding logs yet</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Safeguarding logs">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Type</th>
                  <th scope="col">Guardian</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Notes</th>
                  <th scope="col">Logged By</th>
                  <th scope="col">Date & Time</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>{log.members?.full_name || '—'}</td>
                    <td>
                      <span className={`badge ${log.log_type === 'drop_off' ? 'badge-info' : 'badge-success'}`}>
                        {log.log_type === 'drop_off' ? 'Drop Off' : 'Collection'}
                      </span>
                    </td>
                    <td>{log.guardian_name}</td>
                    <td>{log.guardian_phone}</td>
                    <td>{log.notes || '—'}</td>
                    <td>{log.logged_by || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.logged_at)}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', minHeight: 36 }}
                        onClick={() => setDeleteTarget(log)}
                        aria-label="Delete safeguarding log"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add safeguarding log">
          <div className="modal">
            <h2 className="modal-title">Add Safeguarding Log</h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 16 }}>Fields marked * are required</p>

            <div className="form-group">
              <label className="form-label" htmlFor="sg-member">Member *</label>
              <select id="sg-member" className="form-input" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}>
                <option value="">-- Select member --</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sg-type">Log Type *</label>
              <select id="sg-type" className="form-input" value={form.log_type} onChange={e => setForm({ ...form, log_type: e.target.value })}>
                <option value="drop_off">Drop Off</option>
                <option value="collection">Collection</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sg-gname">Guardian Name *</label>
              <input id="sg-gname" className="form-input" value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} placeholder="Parent or guardian name" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sg-gphone">Guardian Phone *</label>
              <input id="sg-gphone" className="form-input" value={form.guardian_phone} onChange={e => setForm({ ...form, guardian_phone: e.target.value })} placeholder="07700 000000" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sg-notes">Notes</label>
              <textarea id="sg-notes" className="form-input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." style={{ resize: 'vertical' }} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sg-loggedby">Logged By</label>
              <input id="sg-loggedby" className="form-input" value={form.logged_by} onChange={e => setForm({ ...form, logged_by: e.target.value })} placeholder="Staff member name" />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveLog} disabled={saving}>
                {saving ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          message={`Delete this safeguarding log for ${deleteTarget.members?.full_name}? This cannot be undone.`}
          onConfirm={deleteLog}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default Safeguarding