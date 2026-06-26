import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarCheck, ShieldCheck, CreditCard, CalendarDays, BarChart2, LogOut } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import toast from 'react-hot-toast'

function Navbar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <nav role="navigation" aria-label="Main navigation" style={styles.nav}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <ShieldCheck size={24} color="#2563eb" aria-hidden="true" />
          <span style={styles.brandText}>ClubManager</span>
        </div>

        <ul style={styles.links} role="list">
          {[
            { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
            { to: '/members', icon: Users, label: 'Members' },
            { to: '/sessions', icon: CalendarDays, label: 'Sessions' },
            { to: '/checkin', icon: CalendarCheck, label: 'Check In' },
            { to: '/safeguarding', icon: ShieldCheck, label: 'Safeguarding' },
            { to: '/payments', icon: CreditCard, label: 'Payments' },
            { to: '/analytics', icon: BarChart2, label: 'Analytics' },
          ].map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                style={({ isActive }) => isActive ? { ...styles.link, ...styles.activeLink } : styles.link}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* logout button on the right */}
        <button
          onClick={handleLogout}
          style={styles.logoutBtn}
          aria-label="Log out"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandText: { fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' },
  links: { display: 'flex', alignItems: 'center', gap: '4px', listStyle: 'none', flexWrap: 'wrap' },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    textDecoration: 'none',
    color: '#475569',
    fontSize: '0.9rem',
    fontWeight: '500',
    minHeight: '44px'
  },
  activeLink: { background: '#eff6ff', color: '#2563eb', fontWeight: '600' },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: '#475569',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: 44
  }
}

export default Navbar