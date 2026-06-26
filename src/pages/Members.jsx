import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { UserPlus, Pencil, Trash2, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import DeleteModal from '../components/DeleteModal'

const emptyForm = {
  full_name: '', email: '', phone: '', date_of_birth: '',
  emergency_contact_name: '', emergency_contact_phone: '', active: true
}

function Members() {
  const [members, setMembers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { fetchMembers() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(members.filter(m => m.full_name.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)))
  }, [search, members])

  async function fetchMembers() {
    const { data } = await supabase.from('members').select('*').order('full_name')
    setMembers(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(e, member) {
    // stop the row click from firing when edit button is clicked
    e.stopPropagation()
    setEditing(member.id)
    setForm({
      full_name: member.full_name,
      email: member.email || '',
      phone: member.phone || '',
      date_of_birth: member.date_of_birth || '',
      emergency_contact_name: member.emergency_contact_name || '',
      emergency_contact_phone: member.emergency_contact_phone || '',
      active: member.active
    })
    setShowModal(true)
  }

  async function saveMember() {
    if (!form.full_name.trim()) return toast.error('Full name is required')
    if (!form.date_of_birth) return toast.error('Date of birth is required')
    setSaving(true)

    const cleanedForm = { ...form, date_of_birth: form.date_of_birth || null }

    if (editing) {
      const { error } = await supabase.from('members').update(cleanedForm).eq('id', editing)
      if (error) toast.error('Failed to update member')
      else toast.success('Member updated')
    } else {
      const { error } = await supabase.from('members').insert(cleanedForm)
      if (error) toast.error('Failed to add member')
      else toast.success('Member added successfully')
    }

    setSaving(false)
    setShowModal(false)
    fetchMembers()
  }

  async function deleteMember() {
    const { error } = await supabase.from('members').delete().eq('id', deleteTarget.id)
    if (error) toast.error('Failed to delete member')
    else toast.success(`${deleteTarget.full_name} deleted`)
    setDeleteTarget(null)
    fetchMembers()
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading members" />

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Members</h1>
        <button className="btn btn-primary" onClick={openAdd} aria-label="Add new member">
          <UserPlus size={18} aria-hidden="true" /> Add Member
        </button>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} aria-hidden="true" />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search members..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search members"
          />
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={40} color="#94a3b8" aria-hidden="true" />
            <p>{search ? 'No members match your search' : 'No members yet — add one to get started'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Members list">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Status</th>
                  <th scope="col">Balance</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(member => (
                  // clicking the row goes to the member profile page
                  <tr
                    key={member.id}
                    onClick={() => navigate(`/members/${member.id}`)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && navigate(`/members/${member.id}`)}
                    aria-label={`View profile for ${member.full_name}`}
                  >
                    <td style={{ fontWeight: 600 }}>{member.full_name}</td>
                    <td>{member.email || '—'}</td>
                    <td>{member.phone || '—'}</td>
                    <td>
                      <span className={`badge ${member.active ? 'badge-success' : 'badge-danger'}`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: member.balance < 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      £{(member.balance || 0).toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', minHeight: 36 }}
                          onClick={e => openEdit(e, member)}
                          aria-label={`Edit ${member.full_name}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', minHeight: 36 }}
                          onClick={e => { e.stopPropagation(); setDeleteTarget(member) }}
                          aria-label={`Delete ${member.full_name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={editing ? 'Edit member' : 'Add member'}>
          <div className="modal">
            <h2 className="modal-title">{editing ? 'Edit Member' : 'Add New Member'}</h2>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: 16 }}>Fields marked * are required</p>

            <div className="form-group">
              <label className="form-label" htmlFor="full_name">Full Name *</label>
              <input id="full_name" className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Smith" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dob">Date of Birth *</label>
              <input id="dob" className="form-input" type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone</label>
              <input id="phone" className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="07700 000000" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ec_name">Emergency Contact Name</label>
              <input id="ec_name" className="form-input" value={form.emergency_contact_name} onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ec_phone">Emergency Contact Phone</label>
              <input id="ec_phone" className="form-input" value={form.emergency_contact_phone} onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="07700 000001" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select id="status" className="form-input" value={form.active} onChange={e => setForm({ ...form, active: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveMember} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          message={`This will permanently delete ${deleteTarget.full_name} and all their records.`}
          onConfirm={deleteMember}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

export default Members