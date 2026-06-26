import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { CreditCard, Plus } from 'lucide-react'

const emptyForm = { member_id: '', amount: '', payment_type: 'payment_in', description: '' }

function Payments() {
  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterMember, setFilterMember] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [paymentsRes, membersRes] = await Promise.all([
      supabase.from('payments').select('*, members(full_name)').order('created_at', { ascending: false }),
      supabase.from('members').select('id, full_name, balance').eq('active', true).order('full_name')
    ])
    setPayments(paymentsRes.data || [])
    setMembers(membersRes.data || [])
    setLoading(false)
  }

  async function savePayment() {
    if (!form.member_id || !form.amount) return alert('Member and amount are required')
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount === 0) return alert('Please enter a valid amount')

    setSaving(true)

    // work out the actual amount - payments out are stored as negative
    const finalAmount = form.payment_type === 'payment_out' ? -Math.abs(amount) : Math.abs(amount)

    await supabase.from('payments').insert({ ...form, amount: finalAmount })

    // update the members balance as well
    const member = members.find(m => m.id === form.member_id)
    const newBalance = (member?.balance || 0) + finalAmount
    await supabase.from('members').update({ balance: newBalance }).eq('id', form.member_id)

    setSaving(false)
    setShowModal(false)
    setForm(emptyForm)
    fetchData()
  }

  const filtered = filterMember ? payments.filter(p => p.member_id === filterMember) : payments

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-GB', { dateStyle: 'medium' })
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading payments" />

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Payments</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} aria-label="Log new payment">
          <Plus size={18} aria-hidden="true" /> Log Payment
        </button>
      </div>

      {/* member balances summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {members.map(m => (
          <div key={m.id} className="card" style={{ padding: '14px 16px' }} aria-label={`${m.full_name} balance: £${(m.balance || 0).toFixed(2)}`}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>{m.full_name}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: m.balance < 0 ? 'var(--danger)' : 'var(--success)' }}>
              £{(m.balance || 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* filter by member */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <select
          className="form-input"
          value={filterMember}
          onChange={e => setFilterMember(e.target.value)}
          aria-label="Filter payments by member"
        >
          <option value="">All Members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </select>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={40} color="#94a3b8" aria-hidden="true" />
            <p>No payments logged yet</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Payments list">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Type</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Description</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(payment => (
                  <tr key={payment.id}>
                    <td style={{ fontWeight: 600 }}>{payment.members?.full_name || '—'}</td>
                    <td>
                      <span className={`badge ${payment.amount > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {payment.amount > 0 ? 'Payment In' : 'Payment Out'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: payment.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {payment.amount > 0 ? '+' : ''}£{Math.abs(payment.amount).toFixed(2)}
                    </td>
                    <td>{payment.description || '—'}</td>
                    <td>{formatDate(payment.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Log payment">
          <div className="modal">
            <h2 className="modal-title">Log Payment</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-member">Member *</label>
              <select id="pay-member" className="form-input" value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })}>
                <option value="">-- Select member --</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name} (£{(m.balance || 0).toFixed(2)})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-type">Payment Type *</label>
              <select id="pay-type" className="form-input" value={form.payment_type} onChange={e => setForm({ ...form, payment_type: e.target.value })}>
                <option value="payment_in">Payment In</option>
                <option value="payment_out">Payment Out</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-amount">Amount (£) *</label>
              <input id="pay-amount" className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="pay-desc">Description</label>
              <input id="pay-desc" className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Monthly membership fee" />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={savePayment} disabled={saving}>
                {saving ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments