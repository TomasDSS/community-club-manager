import React from 'react'

function StatCard({ title, value, icon: Icon, color = '#2563eb', subtitle }) {
  return (
    <div className="card" role="region" aria-label={`${title}: ${value}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }} aria-hidden="true">
        <Icon size={22} color={color} />
      </div>
      {/* aria-live so the number getting announced when it updates */}
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }} aria-live="polite">{value}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{subtitle}</div>}
    </div>
  )
}

export default StatCard