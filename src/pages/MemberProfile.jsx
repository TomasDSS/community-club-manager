import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { ArrowLeft, CalendarCheck, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react'

function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [payments, setPayments] = useState([])
  const [safeguarding, setSafeguarding] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const [memberRes, attendanceRes, paymentsRes, safeguardingRes] = await Promise.all([
      supabase.from('members').select('*').eq('id', id).single(),
      supabase.from('attendance').select('*, sessions(name, session_date)').eq('member_id', id).order('checked_in_at', { ascending: false }),
      supabase.from('payments').select('*').eq('member_id', id).order('created_at', { ascending: false }),
      supabase.from('safeguarding_logs').select('*').eq('member_id', id).order('logged_at', { ascending: false })
    ])

    setMember(memberRes.data)
    setAttendance(attendanceRes.data || [])
    setPayments(paymentsRes.data || [])
    setSafeguarding(safeguardingRes.data || [])
    setLoading(false)
  }

  function calcAge(dob) {
    if (!dob) return '—'
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  // work out how many days since last attendance
  function daysSinceLastAttendance() {
    if (attendance.length === 0) return null
    const last = new Date(attendance[0].checked_in_at)
    const diff = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading member profile" />
  if (!member) return <div className="page-wrapper"><p>Member not found</p></div>

  const daysSince = daysSinceLastAttendance()
  const isAtRisk = daysSince !== null && daysSince > 14

  return (
    <div className="page-wrapper">
      {/* back button */}
      <button
        className="btn btn-secondary"
        onClick={() => navigate('/members')}
        style={{ marginBottom: 20 }}
        aria-label="Back to members list"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Back to Members
      </button>

      {/* member header card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>{member.full_name}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span className={`badge ${member.active ? 'badge-success' : 'badge-danger'}`}>
                {member.active ? 'Active' : 'Inactive'}
              </span>
              {isAtRisk && (
                <span className="badge badge-warning" aria-label="Attendance risk flag">
                  ⚠ Not seen in {daysSince} days
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px 24px', fontSize: '0.9rem', color: '#475569' }}>
              {member.email && <span>📧 {member.email}</span>}
              {member.phone && <span>📞 {member.phone}</span>}
              {member.date_of_birth && <span>🎂 Age {calcAge(member.date_of_birth)}</span>}
              {member.emergency_contact_name && <span>🆘 {member.emergency_contact_name} {member.emergency_contact_phone}</span>}
            </div>
          </div>

          {/* balance shown prominently */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 4 }}>Balance</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: member.balance < 0 ? 'var(--danger)' : 'var(--success)' }}>
              £{(member.balance || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <CalendarCheck size={24} color="#2563eb" style={{ margin: '0 auto 8px' }} aria-hidden="true" />
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{attendance.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>Sessions Attended</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <CreditCard size={24} color="#16a34a" style={{ margin: '0 auto 8px' }} aria-hidden="true" />
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{payments.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>Payments Logged</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <ShieldCheck size={24} color="#dc2626" style={{ margin: '0 auto 8px' }} aria-hidden="true" />
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{safeguarding.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>Safeguarding Logs</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <AlertTriangle size={24} color={isAtRisk ? '#d97706' : '#16a34a'} style={{ margin: '0 auto 8px' }} aria-hidden="true" />
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: isAtRisk ? '#d97706' : '#16a34a' }}>
            {daysSince !== null ? `${daysSince}d` : '—'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>Days Since Last Visit</div>
        </div>
      </div>

      {/* attendance history */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>
          Attendance History
        </h2>
        {attendance.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No attendance records yet</p>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Attendance history">
              <thead>
                <tr>
                  <th scope="col">Session</th>
                  <th scope="col">Date</th>
                  <th scope="col">Check In Method</th>
                  <th scope="col">Face Verified</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.sessions?.name || '—'}</td>
                    <td>{a.sessions?.session_date ? new Date(a.sessions.session_date).toLocaleDateString('en-GB') : '—'}</td>
                    <td><span className="badge badge-info">{a.check_in_method}</span></td>
                    <td>{a.face_verified ? '✓ Yes' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* payment history */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Payment History</h2>
        {payments.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No payments logged yet</p>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Payment history">
              <thead>
                <tr>
                  <th scope="col">Amount</th>
                  <th scope="col">Description</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: p.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {p.amount > 0 ? '+' : ''}£{Math.abs(p.amount).toFixed(2)}
                    </td>
                    <td>{p.description || '—'}</td>
                    <td>{new Date(p.created_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* safeguarding logs */}
      {safeguarding.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Safeguarding Logs</h2>
          <div className="table-wrapper">
            <table aria-label="Safeguarding logs">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Guardian</th>
                  <th scope="col">Notes</th>
                  <th scope="col">Date</th>
                </tr>
              </thead>
              <tbody>
                {safeguarding.map(s => (
                  <tr key={s.id}>
                    <td><span className={`badge ${s.log_type === 'drop_off' ? 'badge-info' : 'badge-success'}`}>{s.log_type === 'drop_off' ? 'Drop Off' : 'Collection'}</span></td>
                    <td>{s.guardian_name}</td>
                    <td>{s.notes || '—'}</td>
                    <td>{new Date(s.logged_at).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemberProfile