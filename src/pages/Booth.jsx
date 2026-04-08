import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { useCamera } from '../hooks/useCamera'
import { encodeBurstToGif } from '../lib/gifEncoder'
import './Booth.css'

const BURST_COUNT    = 6
const BURST_INTERVAL = 180  // ms between burst frames
const FRAME_SIZE     = 800

export default function Booth() {
  const nav = useNavigate()
  const { shootMode, activeDare, setCapturedBlob, setCapturedDataUrl, setCapturedFrames, albumMode } = useApp()
  const { videoRef, ready, error, facing, flipCamera, captureFrame, captureBurst, startCamera } = useCamera()

  const [phase, setPhase]         = useState('idle')   // idle | counting | capturing | processing
  const [countdown, setCountdown] = useState(3)
  const [burstLit,  setBurstLit]  = useState(0)        // how many burst dots are lit
  const [flashOn,   setFlashOn]   = useState(false)

  const countRef = useRef(null)

  // Start camera on mount
  useEffect(() => {
    startCamera('user')
  }, [startCamera])

  // ── Countdown → capture ──────────────────────────────
  const startCountdown = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('counting')
    setCountdown(3)
    setBurstLit(0)
    let n = 3
    countRef.current = setInterval(() => {
      n--
      if (n <= 0) {
        clearInterval(countRef.current)
        setPhase('capturing')
        doCapture()
      } else {
        setCountdown(n)
      }
    }, 1000)
  }, [phase])

  useEffect(() => () => clearInterval(countRef.current), [])

  async function doCapture() {
    if (shootMode === 'photo') {
      // Flash
      setFlashOn(true)
      setTimeout(() => setFlashOn(false), 120)
      const canvas  = captureFrame(FRAME_SIZE, FRAME_SIZE)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      canvas.toBlob(blob => {
        setCapturedBlob(blob)
        setCapturedDataUrl(dataUrl)
        setCapturedFrames([canvas])
        nav('/result')
      }, 'image/jpeg', 0.92)

    } else {
      // Burst (GIF or stop-motion)
      setBurstLit(0)
      setPhase('capturing')
      const frames = []
      for (let i = 0; i < BURST_COUNT; i++) {
        await new Promise(r => setTimeout(r, BURST_INTERVAL))
        const f = captureFrame(FRAME_SIZE, FRAME_SIZE)
        if (f) frames.push(f)
        setBurstLit(i + 1)
      }
      setPhase('processing')
      setCapturedFrames(frames)
      try {
        const blob    = await encodeBurstToGif(frames, { width: FRAME_SIZE, height: FRAME_SIZE, delay: 120 })
        const dataUrl = URL.createObjectURL(blob)
        setCapturedBlob(blob)
        setCapturedDataUrl(dataUrl)
        nav('/result')
      } catch (err) {
        console.error('GIF encoding failed:', err)
        // Fallback: use first frame as JPEG
        const canvas  = frames[0]
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
        canvas.toBlob(blob => {
          setCapturedBlob(blob)
          setCapturedDataUrl(dataUrl)
          nav('/result')
        }, 'image/jpeg', 0.92)
      }
    }
  }

  function handleClose() {
    clearInterval(countRef.current)
    nav(-1)
  }

  const modeLabel = shootMode === 'gif' ? 'Burst GIF'
                  : shootMode === 'stopmotion' ? 'Stop-Mo'
                  : 'Photo'

  return (
    <div className="booth-screen">
      {/* ── Top bar ── */}
      <div className="cam-topbar">
        <button className="cam-icon-btn" onClick={handleClose}>✕</button>
        <div className="cam-mode-badge">{modeLabel}</div>
        <button className="cam-icon-btn" onClick={flipCamera}>🔄</button>
      </div>

      {/* ── Viewfinder ── */}
      <div className="vf">
        <video ref={videoRef} className="vf-video" playsInline muted autoPlay />

        {/* Dare banner */}
        {activeDare && (
          <div className="dare-banner">
            <span className="dare-banner-emoji">{activeDare.emoji}</span>
            <span className="dare-banner-text">{activeDare.text}</span>
          </div>
        )}

        {/* Corner brackets */}
        <div className="vf-bracket tl" />
        <div className="vf-bracket tr" />
        <div className="vf-bracket bl" />
        <div className="vf-bracket br" />

        {/* Countdown overlay */}
        {phase === 'counting' && (
          <div className="cam-countdown">
            <div className="count-dig" key={countdown}>{countdown}</div>
          </div>
        )}

        {/* Processing overlay */}
        {phase === 'processing' && (
          <div className="cam-processing">
            <div className="proc-spinner" />
            <div className="proc-label">Creating your GIF…</div>
          </div>
        )}

        {/* Flash */}
        {flashOn && <div className="cam-flash" />}

        {/* Camera error */}
        {error && (
          <div className="cam-error">
            <div className="cam-error-icon">📷</div>
            <div className="cam-error-text">Camera access needed</div>
            <div className="cam-error-sub">{error}</div>
            <button className="cam-error-retry" onClick={() => startCamera(facing)}>Try again</button>
            <button className="cam-error-home" onClick={() => nav('/')}>← Home</button>
          </div>
        )}

        {/* Burst dots */}
        {shootMode !== 'photo' && (
          <div className="burst-dots">
            {Array.from({ length: BURST_COUNT }).map((_, i) => (
              <div key={i} className={`bd ${i < burstLit ? 'lit' : ''}`} />
            ))}
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="cam-ctrl">
        <button className="ctrl-btn" onClick={flipCamera}>🔄</button>
        <button
          className="shutter"
          onClick={startCountdown}
          disabled={phase !== 'idle' || !ready}
          aria-label="Take photo"
        />
        <div className="ctrl-btn" style={{ opacity: 0.4, cursor: 'default' }}>⚡</div>
      </div>
    </div>
  )
}
