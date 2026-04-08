import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadEventConfig } from '../../lib/supabase'
import { getTheme } from '../../lib/themes'
import './PartyEntry.css'

export default function PartyEntry() {
  const { code } = useParams()
  const nav = useNavigate()

  const [config,   setConfig]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [opening,     setOpening]     = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    loadEventConfig(code).then(cfg => {
      if (!cfg) setNotFound(true)
      else setConfig(cfg)
      setLoading(false)
    })
  }, [code])

  function handleEnter() {
    setOpening(true)
    setTimeout(() => setShowWelcome(true), 350)
    setTimeout(() => nav(`/party/${code}/camera`), 2500)
  }

  const theme = config ? getTheme(config.theme) : getTheme('kids')

  const PARTY_EMOJIS = ['🎈','🎀','🎊','🎂','🥳','🎉','✨','🍭','🎁','🌸','🎈','🎊']

  // Generate 24 balloons clustered at the bottom — stable across renders
  const balloons = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    id: i,
    emoji: PARTY_EMOJIS[i % PARTY_EMOJIS.length],
    x: (i % 6) * 16 + (i * 5 % 8),
    y: 58 + Math.floor(i / 6) * 10 + (i * 7 % 8),  // 58–95% — bottom cluster
    size: 28 + (i % 4) * 8,
    delay: i * 0.035,
    rot: -20 + (i % 5) * 10,
  })), [])

  if (loading) return (
    <div className="entry-screen" style={{ '--curtain-l': '#FF6B47', '--curtain-r': '#FFD166' }}>
      <div className="entry-spinner" />
    </div>
  )

  if (notFound) return (
    <div className="entry-screen entry-error" style={{ '--curtain-l': '#555', '--curtain-r': '#333' }}>
      <div className="entry-err-icon">🎭</div>
      <div className="entry-err-title">Event not found</div>
      <div className="entry-err-sub">Check the URL or ask the host for the correct link.</div>
    </div>
  )

  return (
    <div
      className="entry-screen"
      style={{ '--curtain-l': theme.curtainLeft, '--curtain-r': theme.curtainRight }}
    >
      {/* Spotlight — z-index 16, on curtains, fades out when opening */}
      <div className={`entry-spotlight ${opening ? 'fade-out' : ''}`} />

      {/* Balloon cluster — z-index 10, behind curtains */}
      <div className="balloon-cover">
        {balloons.map(b => (
          <span
            key={b.id}
            className={`balloon-item ${opening ? 'fly' : ''}`}
            style={{
              left: `${b.x}%`,
              top:  `${b.y}%`,
              fontSize: `${b.size}px`,
              ...(opening ? {
                transform: `translateY(-130vh) rotate(${b.rot * 2}deg)`,
                opacity: 0,
                transitionDelay: `${b.delay}s`,
              } : {
                transform: `rotate(${b.rot}deg)`,
              }),
            }}
          >
            {b.emoji}
          </span>
        ))}
      </div>

      {/* Curtains — z-index 15, in front of balloons */}
      <div className={`curtain curtain-left  ${opening ? 'open' : ''}`} />
      <div className={`curtain curtain-right ${opening ? 'open' : ''}`} />

      {/* Content — z-index 20, always on top */}
      <div className="entry-content">
        <div className="entry-live-row">
          <span className="entry-live-dot" />
          <span className="entry-live-label">Live</span>
        </div>
        <h1 className="entry-title">{config.name}</h1>
        {opening && showWelcome ? (
          <div className="entry-welcome">
            <p className="entry-welcome-title">Welcome to {config.name}! 🎂</p>
            <p className="entry-welcome-msg">Strike a pose, snap a photo, and help us capture these beautiful moments. Every picture counts! 💛</p>
          </div>
        ) : (
          <>
            <p className="entry-sub">Tap below to step into the photo booth</p>
            <button
              className="entry-btn"
              style={{ background: 'rgba(255,255,255,0.92)', color: theme.curtainLeft }}
              onClick={handleEnter}
            >
              Step Inside →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
