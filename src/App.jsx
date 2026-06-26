import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Sessions from './pages/Sessions'
import CheckIn from './pages/CheckIn'
import Safeguarding from './pages/Safeguarding'
import Payments from './pages/Payments'
import MemberProfile from './pages/MemberProfile'
import SessionDetail from './pages/SessionDetail'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

function App() {
  return (
    <Router>
      {/* Toaster handles all the toast notifications across the app */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: 8, fontSize: '0.9rem' }
        }}
      />

      <Routes>
        {/* login page has no navbar */}
        <Route path="/login" element={<Login />} />

        {/* everything else is wrapped in ProtectedRoute which checks if user is logged in */}
        <Route path="/*" element={
          <ProtectedRoute>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <Navbar />
            <main id="main-content" tabIndex="-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/members/:id" element={<MemberProfile />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/sessions/:id" element={<SessionDetail />} />
                <Route path="/checkin" element={<CheckIn />} />
                <Route path="/safeguarding" element={<Safeguarding />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App