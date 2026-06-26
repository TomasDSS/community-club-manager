import React, { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import StatCard from '../components/StatCard'
import { Users, CalendarCheck, CreditCard, ShieldCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function Dashboard() {
  const [stats, setStats] = useState({ members: 0, sessions: 0, payments: 0, safeguarding: 0 })
  const [recentAttendance, setRecentAttendance] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const [members, sessions, payments, safeguarding, attendance, recentCheckins, recentPayments] = await Promise.all([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
      supabase.from('safeguarding_logs').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('id, name, session_date, attendance(count)').order('session_date', { ascending: false }).limit(6),
      supabase.from('attendance').select('checked_in_at, members(full_name), sessions(name)').order('checked_in_at', { ascending: false }).limit(5),
      supabase.from('payments').select('created_at, amount, members(full_name)').order('created_at', { ascending: false }).limit(5)
    ])

    setStats({
      members: members.count || 0,
      sessions: sessions.count || 0,
      payments: payments.count || 0,
      safeguarding: safeguarding.count || 0
    })

    if (attendance.data) {
      const chartData = attendance.data.map(s => ({
        name: s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name,
        attendance: s.attendance[0]?.count || 0
      })).reverse()
      setRecentAttendance(chartData)
    }

    // combine and sort recent checkins and payments into one activity feed
    const activity = [
      ...(recentCheckins.data || []).map(a => ({
        type: 'checkin',
        text: `${a.members?.full_name} checked in to ${a.sessions?.name}`,
        time: a.checked_in_at
      })),
      ...(recentPayments.data || []).map(p => ({
        type: 'payment',
        text: `${p.members?.full_name} — £${Math.abs(p.amount).toFixed(2)} ${p.amount > 0 ? 'payment in' : 'payment out'}`,
        time: p.created_at
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)

    setRecentActivity(activity)
    setLoading(false)
  }

  function timeAgo(ts) {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading dashboard" />

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <StatCard title="Total Members" value={stats.members} icon={Users} color="#2563eb" />
        <StatCard title="Total Sessions" value={stats.sessions} icon={CalendarCheck} color="#16a34a" />
        <StatCard title="Payments Logged" value={stats.payments} icon={CreditCard} color="#d97706" />
        <StatCard title="Safeguarding Logs" value={stats.safeguarding} icon={ShieldCheck} color="#dc2626" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* attendance chart */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Attendance by Session</h2>
          {recentAttendance.length === 0 ? (
            <div className="empty-state">
              <p>No session data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={recentAttendance} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.9rem' }} />
                <Bar dataKey="attendance" fill="#2563eb" radius={[4, 4, 0, 0]} name="Attendance" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* recent activity feed */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>No activity yet</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }} aria-label="Recent activity feed">
              {recentActivity.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: i < recentActivity.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  {/* coloured dot to show type of activity */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.type === 'checkin' ? '#2563eb' : '#16a34a', marginTop: 6, flexShrink: 0 }} aria-hidden="true" />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', color: '#0f172a', lineHeight: 1.4 }}>{item.text}</p>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>{timeAgo(item.time)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard