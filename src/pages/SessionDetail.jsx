import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { ArrowLeft, Download } from 'lucide-react'
import toast from 'react-hot-toast'

function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const [sessionRes, attendanceRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', id).single(),
      supabase.from('attendance').select('*, members(full_name, email)').eq('session_id', id).order('checked_in_at')
    ])
    setSession(sessionRes.data)
    setAttendance(attendanceRes.data || [])
    setLoading(false)
  }

  // export the attendance list as a CSV file
  function exportCSV() {
    const rows = [
      ['Name', 'Email', 'Check In Time', 'Method', 'Face Verified'],
      ...attendance.map(a => [
        a.members?.full_name || '',
        a.members?.email || '',
        new Date(a.checked_in_at).toLocaleString('en-GB'),
        a.check_in_method,
        a.face_verified ? 'Yes' : 'No'
      ])
    ]

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session?.name || 'session'}-attendance.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading session" />
  if (!session) return <div className="page-wrapper"><p>Session not found</p></div>

  return (
    <div className="page-wrapper">
      <button className="btn btn-secondary" onClick={() => navigate('/sessions')} style={{ marginBottom: 20 }} aria-label="Back to sessions">
        <ArrowLeft size={16} aria-hidden="true" /> Back to Sessions
      </button>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>{session.name}</h1>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>
              {new Date(session.session_date).toLocaleDateString('en-GB', { dateStyle: 'full' })}
              {session.start_time && ` · ${session.start_time}`}
              {session.end_time && ` — ${session.end_time}`}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>{attendance.length}</div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>Attendees</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Attendance List</h2>
          {attendance.length > 0 && (
            <button className="btn btn-secondary" onClick={exportCSV} aria-label="Export attendance as CSV">
              <Download size={16} aria-hidden="true" /> Export CSV
            </button>
          )}
        </div>

        {attendance.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Nobody checked in to this session yet</p>
        ) : (
          <div className="table-wrapper">
            <table aria-label="Session attendance list">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Check In Time</th>
                  <th scope="col">Method</th>
                  <th scope="col">Face Verified</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.members?.full_name || '—'}</td>
                    <td>{a.members?.email || '—'}</td>
                    <td>{new Date(a.checked_in_at).toLocaleTimeString('en-GB', { timeStyle: 'short' })}</td>
                    <td><span className="badge badge-info">{a.check_in_method}</span></td>
                    <td>{a.face_verified ? <span className="badge badge-success">Yes</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionDetail