import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import './Home.css'

const FAMILY_PIN = import.meta.env.VITE_FAMILY_PIN || '1234'

export default function Home() {
  const nav = useNavigate()
  const { setShootMode, setAlbumMode } = useApp()
  const [activeTab, setActiveTab] = useState('photo')
  const [pinOpen, setPinOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  function openBooth() {
    setShootMode(activeTab)
    setAlbumMode('family')
    nav('/dare')
  }

  function handlePinSubmit(e) {
    e.preventDefault()
    if (pinInput === FAMILY_PIN) {
      setPinOpen(false)
      setPinInput('')
      setPinError(false)
      nav('/gallery')
    } else {
      setPinError(true)
      setPinInput('')
    }
  }

  return (
    <div className="home-screen">
      {/* ── Hero header ── */}
      <header className="home-hero">
        <div className="home-hero-text">
          <h1 className="logo">Snapp<em>ie</em></h1>
          <p className="tagline">Strike a pose. Keep the moment. ✨</p>
        </div>
      </header>

      {/* ── Scrollable body ── */}
      <main className="home-body scroll-hide">

        {/* Party Mode card */}
        <div className="party-card" onClick={() => nav('/party/setup')}>
          <div className="party-eyebrow">✨ Event Feature</div>
          <div className="party-title">🎉 Party Mode</div>
          <div className="party-sub">Set up a shared booth for guests — your family album stays private.</div>
          <div className="party-arrow">→</div>
        </div>

        {/* Mode tabs */}
        <div className="mode-tabs">
          {[
            { id: 'photo',      label: '📸 Photo' },
            { id: 'gif',        label: '🎬 GIF' },
            { id: 'stopmotion', label: '🎭 Stop-Mo' },
          ].map(t => (
            <button
              key={t.id}
              className={`mtab ${activeTab === t.id ? 'on' : 'off'}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Recent moments placeholder strip */}
        <div className="sec-row">
          <span className="sec-label">Recent Moments</span>
          <span className="sec-link" onClick={() => nav('/gallery')}>View all →</span>
        </div>
        <div className="pola-strip scroll-hide">
          {SAMPLE_RECENTS.map((s, i) => (
            <div className="mini-pola" key={i} style={{ '--r': s.r }}>
              <div className="mini-photo" style={{ background: s.bg }}>{s.emoji}</div>
              {s.tag && <div className={`type-tag tag-${s.tag}`}>{s.tag.toUpperCase()}</div>}
              <div className="mini-cap">{s.cap}<br />{s.date}</div>
            </div>
          ))}
        </div>
      </main>

      {/* ── CTA bar ── */}
      <div className="home-cta">
        <button className="big-btn" onClick={openBooth}>
          📸 &nbsp;Open Booth
        </button>
      </div>

      {/* ── Bottom nav ── */}
      <nav className="bnav">
        <div className="bnav-item on">
          <span className="bnav-icon">🏠</span>
          <span className="bnav-lbl">Home</span>
        </div>
        <div className="bnav-cam-wrap">
          <button className="bnav-cam" onClick={openBooth}>📸</button>
        </div>
        <div className="bnav-item" onClick={() => setPinOpen(true)}>
          <span className="bnav-icon">🖼️</span>
          <span className="bnav-lbl">Gallery</span>
        </div>
      </nav>

      {/* ── Family PIN modal ── */}
      {pinOpen && (
        <div className="pin-overlay" onClick={() => { setPinOpen(false); setPinInput(''); setPinError(false) }}>
          <div className="pin-modal" onClick={e => e.stopPropagation()}>
            <div className="pin-icon">🔒</div>
            <h2 className="pin-title">Family Album</h2>
            <p className="pin-sub">Enter your PIN to view your private photos.</p>
            <form onSubmit={handlePinSubmit}>
              <input
                className={`pin-input ${pinError ? 'error' : ''}`}
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • •"
                value={pinInput}
                onChange={e => { setPinInput(e.target.value); setPinError(false) }}
                autoFocus
              />
              {pinError && <p className="pin-error">Wrong PIN, try again</p>}
              <button type="submit" className="pin-btn">Unlock →</button>
            </form>
            <button className="pin-cancel" onClick={() => { setPinOpen(false); setPinInput(''); setPinError(false) }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SAMPLE_RECENTS = [
  { emoji: '🦕', bg: 'linear-gradient(135deg,#FFD166,#FF6B47)', cap: 'Dino crew',    date: 'Mar 22', tag: 'gif', r: '-2.5deg' },
  { emoji: '🌊', bg: 'linear-gradient(135deg,#2A9D8F,#1A5F58)', cap: 'Beach day',    date: 'Mar 19', tag: null,  r: '1.8deg'  },
  { emoji: '👻', bg: 'linear-gradient(135deg,#F4A261,#E76F51)', cap: 'Spooky trio',  date: 'Mar 15', tag: 'sm',  r: '-1deg'   },
  { emoji: '🎉', bg: 'linear-gradient(135deg,#E9C46A,#F4A261)', cap: 'Party mode!',  date: 'Mar 12', tag: null,  r: '2.2deg'  },
  { emoji: '🦄', bg: 'linear-gradient(135deg,#9B5DE5,#F15BB5)', cap: 'Unicorn hrs',  date: 'Mar 10', tag: null,  r: '-1.5deg' },
]
