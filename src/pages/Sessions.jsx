import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { Plus, Trash2, CalendarDays } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DeleteModal from '../components/DeleteModal'

const emptyForm = { name: '', session_date: '', start_time: '', end_time: '' }

function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchSessions() }, [])

  async function fetchSessions() {
    const { data } = await supabase.from('sessions').select('*, attendance(count)').order('session_date', { ascending: false })
    setSessions(data || [])
    setLoading(false)
  }

  async function saveSession() {
    if (!form.name.trim() || !form.session_date) return toast.error('Name and date are required')
    setSaving(true)
    const { error } = await supabase.from('sessions').insert(form)
    if (error) toast.error('Failed to add session')
    else toast.success('Session added')
    setSaving(false)
    setShowModal(false)
    setForm(emptyForm)
    fetchSessions()
  }

  async function deleteSession() {
    const { error } = await supabase.from('sessions').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Failed to delete session')
    else toast.success('Session deleted')
    setDeleteTarget(null)
    fetchSessions()
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading sessions" />

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Sessions</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} aria-label="Add new session">
          <Plus size={18} aria-hidden="true" /> Add Session
        </button>
      </div>

      <div className="card">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={40} color="#94a3b8" aria-hidden="true" />
            <p>No sessions yet — add your first one</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Sessions list">
              <thead>
                <tr>
                  <th scope="col">Session Name</th>
                  <th scope="col">Date</th>
                  <th scope="col">Start</th>
                  <th scope="col">End</th>
                  <th scope="col">Attendance</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr
                    key={session.id}
                    onClick={() => navigate(`/sessions/${session.id}`)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/sessions/${session.id}`)}
                    aria-label={`View details for ${session.name}`}
                  >
                    <td style={{ fontWeight: 600 }}>{session.name}</td>
                    <td>{new Date(session.session_date).toLocaleDateString('en-GB')}</td>
                    <td>{session.start_time || '—'}</td>
                    <td>{session.end_time || '—'}</td>
                    <td><span className="badge badge-info">{session.attendance?.[0]?.count || 0} checked in</span></td>
                    <td>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', minHeight: 36 }}
                        onClick={e => { e.stopPropagation(); setDeleteTarget(session) }}
                        aria-label={`Delete session ${session.name}`}
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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add session">
          <div className="modal">
            <h2 className="modal-title">Add New Session</h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 16 }}>Fields marked * are required</p>
            <div className="form-group">
              <label className="form-label" htmlFor="sname">Session Name *</label>
              <input id="sname" className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tuesday Training" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sdate">Date *</label>
              <input id="sdate" className="form-input" type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sstart">Start Time</label>
              <input id="sstart" className="form-input" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="send">End Time</label>
              <input id="send" className="form-input" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveSession} disabled={saving}>
                {saving ? 'Saving...' : 'Add Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          message={`This will permanently delete "${deleteTarget.name}" and all its attendance records.`}
          onConfirm={deleteSession}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default Sessions