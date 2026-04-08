import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCamera } from '../../hooks/useCamera'
import { loadEventConfig } from '../../lib/supabase'
import { getTheme } from '../../lib/themes'
import './PartyCamera.css'

const FREE_PROMPT = { id: 'free', emoji: '🙂', text: null, sub: null }

function sleep(ms) { return new Promise(res => setTimeout(res, ms)) }

export default function PartyCamera() {
  const { code } = useParams()
  const nav = useNavigate()
  const { videoRef, ready, error, facing, startCamera, flipCamera, captureFrame } = useCamera()

  const [theme,      setTheme]      = useState(getTheme('kids'))
  const [prompts,    setPrompts]    = useState([FREE_PROMPT])
  const [selected,   setSelected]   = useState(FREE_PROMPT)
  const [phase,      setPhase]      = useState('idle')
  const [countdown,  setCountdown]  = useState(3)
  const [flashOn,    setFlashOn]    = useState(false)
  const [stripMode,  setStripMode]  = useState(false)
  const [stripIndex, setStripIndex] = useState(0)   // 1-3 during strip capture
  const countRef  = useRef(null)
  const uploadRef = useRef(null)

  useEffect(() => {
    startCamera('user')
    loadEventConfig(code).then(cfg => {
      if (cfg) {
        const t = getTheme(cfg.theme)
        setTheme(t)
        const list = [FREE_PROMPT, ...t.prompts.map((p, i) => ({ ...p, id: i }))]
        setPrompts(list)
      }
    })
  }, [code])

  useEffect(() => () => clearInterval(countRef.current), [])

  const startCountdown = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('counting')
    setCountdown(3)
    let n = 3
    countRef.current = setInterval(() => {
      n--
      if (n <= 0) {
        clearInterval(countRef.current)
        doCapture()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }, [phase])

  function doCapture() {
    setFlashOn(true)
    setTimeout(() => setFlashOn(false), 120)
    const canvas  = captureFrame(1600, 1600)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    canvas.toBlob(blob => {
      setPhase('done')
      nav(`/party/${code}/preview`, {
        state: { blob, dataUrl, dare: selected.text ? selected : null }
      })
    }, 'image/jpeg', 0.92)
  }

  // Returns a promise that resolves with {blob, dataUrl} after a 3-2-1 countdown
  function captureAfterCountdown() {
    return new Promise(resolve => {
      setCountdown(3)
      let n = 3
      countRef.current = setInterval(() => {
        n--
        if (n <= 0) {
          clearInterval(countRef.current)
          setFlashOn(true)
          setTimeout(() => setFlashOn(false), 120)
          const canvas  = captureFrame(1600, 1600)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
          canvas.toBlob(blob => resolve({ blob, dataUrl }), 'image/jpeg', 0.92)
        } else {
          setCountdown(n)
        }
      }, 1000)
    })
  }

  async function startStripCapture() {
    if (phase !== 'idle') return
    setPhase('counting')
    const shots = []
    for (let i = 0; i < 3; i++) {
      setStripIndex(i + 1)
      const shot = await captureAfterCountdown()
      shots.push(shot)
      if (i < 2) {
        setPhase('idle')
        await sleep(400)
        setPhase('counting')
      }
    }
    setPhase('done')
    setStripIndex(0)
    nav(`/party/${code}/strip-preview`, {
      state: { shots, dare: selected.text ? selected : null }
    })
  }

  function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = URL.createObjectURL(file)
    nav(`/party/${code}/preview`, {
      state: { blob: file, dataUrl, dare: null }
    })
  }

  const dare = selected.text ? selected : null

  return (
    <div className="pcam-screen" style={{ '--theme-primary': theme.primary }}>
      {/* Top bar — normal flow, not absolute */}
      <div className="pcam-topbar">
        <button className="pcam-icon-btn" onClick={() => nav(`/party/${code}/gallery`)}>✕</button>
        <div className="pcam-seg">
          <button
            className={`pcam-seg-btn ${!stripMode ? 'active' : ''}`}
            onClick={() => { if (phase === 'idle') setStripMode(false) }}
          >📸 Photo</button>
          <button
            className={`pcam-seg-btn ${stripMode ? 'active' : ''}`}
            onClick={() => { if (phase === 'idle') setStripMode(true) }}
          >🎞 Strip</button>
        </div>
        <button className="pcam-icon-btn" onClick={flipCamera}>🔄</button>
      </div>

      {/* Viewfinder */}
      <div className="pcam-vf">
        <video ref={videoRef} className="pcam-video" playsInline muted autoPlay />

        {/* Selected dare shown as top overlay */}
        {dare && (
          <div className="pcam-dare-overlay">
            <span>{dare.emoji}</span> {dare.text}
          </div>
        )}

        {/* Corner brackets */}
        <div className="pcam-bracket tl" />
        <div className="pcam-bracket tr" />
        <div className="pcam-bracket bl" />
        <div className="pcam-bracket br" />

        {/* Strip shot progress */}
        {stripMode && stripIndex > 0 && (
          <div className="pcam-strip-badge">Shot {stripIndex} of 3</div>
        )}

        {/* Countdown */}
        {phase === 'counting' && (
          <div className="pcam-countdown">
            <div className="pcam-count-dig" key={countdown}>{countdown}</div>
          </div>
        )}

        {/* Flash */}
        {flashOn && <div className="pcam-flash" />}

        {/* Camera error */}
        {error && (
          <div className="pcam-error">
            <div className="pcam-error-icon">📷</div>
            <div className="pcam-error-text">Camera access needed</div>
            <div className="pcam-error-sub">{error}</div>
            <button className="pcam-error-retry" onClick={() => startCamera(facing)}>Try again</button>
            <button className="pcam-error-home" onClick={() => nav('/')}>← Home</button>
          </div>
        )}
      </div>

      {/* Pose prompt chips */}
      <div className="pcam-prompts scroll-hide">
        {prompts.map(p => (
          <button
            key={p.id}
            className={`pcam-chip ${selected.id === p.id ? 'active' : ''}`}
            onClick={() => setSelected(p)}
          >
            {p.emoji} {p.id === 'free' ? 'No prompt' : p.text}
          </button>
        ))}
      </div>

      {/* Shutter row */}
      <div className="pcam-ctrl">
        {/* Upload from camera roll */}
        <button className="pcam-upload-btn" onClick={() => uploadRef.current?.click()}>
          📁<br /><span>Upload</span>
        </button>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleUpload}
        />

        {/* Shutter */}
        <button
          className="pcam-shutter"
          onClick={stripMode ? startStripCapture : startCountdown}
          disabled={phase !== 'idle' || !ready}
          aria-label="Take photo"
        >
          <div className="pcam-shutter-inner" />
        </button>

        <div className="pcam-ctrl-spacer" />
      </div>
    </div>
  )
}
