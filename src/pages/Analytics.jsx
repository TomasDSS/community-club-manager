import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

function Analytics() {
  const [memberStats, setMemberStats] = useState([])
  const [sessionTrend, setSessionTrend] = useState([])
  const [atRiskMembers, setAtRiskMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAnalytics() }, [])

  async function fetchAnalytics() {
    // get attendance count per member
    const { data: members } = await supabase
      .from('members')
      .select('id, full_name, attendance(count)')
      .eq('active', true)
      .order('full_name')

    // get sessions with attendance counts for the trend line
    const { data: sessions } = await supabase
      .from('sessions')
      .select('name, session_date, attendance(count)')
      .order('session_date', { ascending: true })
      .limit(10)

    // get all members and their last check in to find at-risk ones
    const { data: allAttendance } = await supabase
      .from('attendance')
      .select('member_id, checked_in_at, members(full_name)')
      .order('checked_in_at', { ascending: false })

    if (members) {
      setMemberStats(members.map(m => ({
        name: m.full_name.split(' ')[0], // just use first name for the chart
        sessions: m.attendance?.[0]?.count || 0
      })).sort((a, b) => b.sessions - a.sessions))
    }

    if (sessions) {
      setSessionTrend(sessions.map(s => ({
        name: s.name.length > 10 ? s.name.substring(0, 10) + '...' : s.name,
        attendance: s.attendance?.[0]?.count || 0
      })))
    }

    // find members who havent been seen in 14+ days
    if (allAttendance && members) {
      const lastSeen = {}
      allAttendance.forEach(a => {
        if (!lastSeen[a.member_id]) {
          lastSeen[a.member_id] = { date: a.checked_in_at, name: a.members?.full_name }
        }
      })

      const atRisk = members
        .filter(m => {
          const last = lastSeen[m.id]
          if (!last) return true // never attended
          const days = Math.floor((Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24))
          return days > 14
        })
        .map(m => ({
          name: m.full_name,
          lastSeen: lastSeen[m.id] ? new Date(lastSeen[m.id].date).toLocaleDateString('en-GB') : 'Never'
        }))

      setAtRiskMembers(atRisk)
    }

    setLoading(false)
  }

  // export full attendance report as CSV
  async function exportFullReport() {
    const { data } = await supabase
      .from('attendance')
      .select('members(full_name, email), sessions(name, session_date), checked_in_at, check_in_method, face_verified')
      .order('checked_in_at', { ascending: false })

    if (!data) return toast.error('No data to export')

    const rows = [
      ['Member', 'Email', 'Session', 'Session Date', 'Check In Time', 'Method', 'Face Verified'],
      ...data.map(a => [
        a.members?.full_name || '',
        a.members?.email || '',
        a.sessions?.name || '',
        a.sessions?.session_date || '',
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
    a.download = 'full-attendance-report.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported')
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading analytics" />

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Analytics</h1>
        <button className="btn btn-secondary" onClick={exportFullReport} aria-label="Export full attendance report">
          <Download size={18} aria-hidden="true" /> Export Full Report
        </button>
      </div>

      {/* attendance per member chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Sessions Attended per Member</h2>
        {memberStats.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={memberStats} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 12, fill: '#475569' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="sessions" fill="#2563eb" radius={[4, 4, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* attendance trend over sessions */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Attendance Trend</h2>
        {sessionTrend.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sessionTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 12, fill: '#475569' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Line type="monotone" dataKey="attendance" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} name="Attendance" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* at risk members */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>
          At-Risk Members
          <span style={{ fontSize: '0.85rem', fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>
            (not seen in 14+ days)
          </span>
        </h2>

        {atRiskMembers.length === 0 ? (
          <p style={{ color: '#16a34a', fontWeight: 600, padding: '12px 0' }}>✓ All members have attended recently</p>
        ) : (
          <div className="table-wrapper">
            <table aria-label="At risk members">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Last Seen</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {atRiskMembers.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.lastSeen}</td>
                    <td><span className="badge badge-warning">⚠ At Risk</span></td>
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

export default Analytics