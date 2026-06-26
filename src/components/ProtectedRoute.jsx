import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

// Wraps pages that require login - redirects to /login if no session found
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // check if theres an active session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    // listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // still checking auth state - render nothing to avoid a flash
  if (session === undefined) return null

  if (!session) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute