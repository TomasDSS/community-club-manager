import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { CalendarCheck, Camera, CameraOff, CheckCircle } from 'lucide-react'

function CheckIn() {
  const [members, setMembers] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [cameraOn, setCameraOn] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [success, setSuccess] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const faceApiRef = useRef(null)

  useEffect(() => {
    fetchData()
    return () => stopCamera()
  }, [])

  async function fetchData() {
    const [mem, ses] = await Promise.all([
      supabase.from('members').select('id, full_name').eq('active', true).order('full_name'),
      supabase.from('sessions').select('id, name, session_date').order('session_date', { ascending: false }).limit(20)
    ])
    setMembers(mem.data || [])
    setSessions(ses.data || [])
    setLoading(false)
  }

  // load face-api models from the public folder
  async function loadFaceApi() {
    if (faceApiRef.current) return faceApiRef.current
    const faceapi = await import('face-api.js')
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
    faceApiRef.current = faceapi
    return faceapi
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)

      // load face detection models
      const faceapi = await loadFaceApi()

      // check for a face every 800ms
      const interval = setInterval(async () => {
        if (!videoRef.current) return
        const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        setFaceDetected(!!detection)
      }, 800)

      // save interval id so we can clear it later
      streamRef.current._interval = interval
    } catch {
      alert('Could not access camera. Please check browser permissions.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      clearInterval(streamRef.current._interval)
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraOn(false)
    setFaceDetected(false)
  }

  // check if member is already checked in for the selected session
  async function checkAlreadyIn(memberId, sessionId) {
    if (!memberId || !sessionId) return
    const { data } = await supabase.from('attendance')
      .select('id')
      .eq('member_id', memberId)
      .eq('session_id', sessionId)
      .limit(1)
    setAlreadyCheckedIn(data && data.length > 0)
  }

  useEffect(() => {
    checkAlreadyIn(selectedMember, selectedSession)
  }, [selectedMember, selectedSession])

  async function handleCheckIn() {
    if (!selectedMember || !selectedSession) return alert('Please select a member and session')
    if (alreadyCheckedIn) return alert('This member is already checked in for this session')

    setChecking(true)

    const { error } = await supabase.from('attendance').insert({
      member_id: selectedMember,
      session_id: selectedSession,
      check_in_method: cameraOn && faceDetected ? 'face' : 'manual',
      face_verified: cameraOn && faceDetected
    })

    if (!error) {
      const member = members.find(m => m.id === selectedMember)
      setSuccess(member?.full_name)
      setSelectedMember('')
      setFaceDetected(false)
      // clear the success message after 3 secs
      setTimeout(() => setSuccess(null), 3000)
    }

    setChecking(false)
  }

  if (loading) return <div className="spinner" role="status" aria-label="Loading check in" />

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Check In</h1>

      {/* success banner */}
      {success && (
        <div role="alert" style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: '#15803d', fontWeight: 600 }}>
          <CheckCircle size={20} aria-hidden="true" />
          {success} has been checked in successfully!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* check in form */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Member Check In</h2>

          <div className="form-group">
            <label className="form-label" htmlFor="member-select">Select Member *</label>
            <select
              id="member-select"
              className="form-input"
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
              aria-label="Select member to check in"
            >
              <option value="">-- Choose a member --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="session-select">Select Session *</label>
            <select
              id="session-select"
              className="form-input"
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              aria-label="Select session"
            >
              <option value="">-- Choose a session --</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {new Date(s.session_date).toLocaleDateString('en-GB')}
                </option>
              ))}
            </select>
          </div>

          {alreadyCheckedIn && (
            <p role="alert" style={{ color: 'var(--warning)', fontSize: '0.9rem', marginBottom: 12, fontWeight: 600 }}>
              ⚠ This member is already checked in for this session
            </p>
          )}

          {/* camera toggle button */}
          <div style={{ marginBottom: 16 }}>
            <button
              className={`btn ${cameraOn ? 'btn-danger' : 'btn-secondary'}`}
              onClick={cameraOn ? stopCamera : startCamera}
              style={{ width: '100%' }}
              aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera for face verification'}
            >
              {cameraOn ? <><CameraOff size={18} aria-hidden="true" /> Turn Off Camera</> : <><Camera size={18} aria-hidden="true" /> Enable Face Verification</>}
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCheckIn}
            disabled={checking || !selectedMember || !selectedSession}
            style={{ width: '100%' }}
            aria-label="Confirm check in"
          >
            <CalendarCheck size={18} aria-hidden="true" />
            {checking ? 'Checking in...' : 'Confirm Check In'}
          </button>
        </div>

        {/* camera preview panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          {cameraOn ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                aria-label="Camera preview for face detection"
                style={{ width: '100%', maxWidth: 360, borderRadius: 8, border: `3px solid ${faceDetected ? '#16a34a' : '#e2e8f0'}` }}
              />
              <p style={{ marginTop: 12, fontWeight: 600, color: faceDetected ? '#16a34a' : '#94a3b8' }} aria-live="polite">
                {faceDetected ? '✓ Face detected' : 'No face detected — look at the camera'}
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <CameraOff size={48} aria-hidden="true" style={{ marginBottom: 12 }} />
              <p>Camera is off</p>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Enable face verification above for an extra check in method</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckIn