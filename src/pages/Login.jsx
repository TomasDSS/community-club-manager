import React, { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) return toast.error('Please enter email and password')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Logged in successfully')
      // force a full reload so ProtectedRoute picks up the new session
      window.location.href = '/'
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo} aria-label="ClubManager">
          <ShieldCheck size={36} color="#2563eb" aria-hidden="true" />
          <h1 style={styles.title}>ClubManager</h1>
        </div>

        <p style={styles.subtitle}>Sign in to access the admin panel</p>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email *</label>
          <input
            id="email"
            className="form-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="admin@example.com"
            autoComplete="email"
            aria-label="Email address"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password *</label>
          <input
            id="password"
            className="form-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-label="Password"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', marginTop: 8 }}
          aria-label="Sign in"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f1f5f9',
    padding: 16
  },
  card: {
    background: '#ffffff',
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e2e8f0'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a'
  },
  subtitle: {
    color: '#475569',
    fontSize: '0.95rem',
    marginBottom: 28
  }
}

export default Login