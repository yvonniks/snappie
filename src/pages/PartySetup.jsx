import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { usePartyMode } from '../hooks/usePartyMode'
import './PartySetup.css'

const DURATIONS = [1, 2, 3, 4, 6]

export default function PartySetup() {
  const nav = useNavigate()
  const { setPartySession, setAlbumMode } = useApp()
  const { createParty } = usePartyMode()

  const [eventName, setEventName] = useState('')
  const [duration,  setDuration]  = useState(2)

  function handleStart(e) {
    e.preventDefault()
    const name = eventName.trim() || 'Party Time'
    const session = createParty({ eventName: name, durationHours: duration })
    setPartySession(session)
    setAlbumMode('event')
    nav('/party/live')
  }

  return (
    <div className="setup-screen">
      <button className="setup-back" onClick={() => nav(-1)}>← Back</button>

      <div className="setup-hero">
        <div className="setup-icon">🎉</div>
        <h1 className="setup-title">Party Mode</h1>
        <p className="setup-sub">Set up a shared photo booth for your guests. Your family album stays private.</p>
      </div>

      <form className="setup-form" onSubmit={handleStart}>
        <label className="setup-label">Event name</label>
        <input
          className="setup-input"
          type="text"
          placeholder="e.g. Emma's Birthday 🎂"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
          maxLength={40}
        />

        <label className="setup-label">Duration</label>
        <div className="dur-chips">
          {DURATIONS.map(h => (
            <button
              key={h}
              type="button"
              className={`dur-chip ${duration === h ? 'on' : 'off'}`}
              onClick={() => setDuration(h)}
            >
              {h}h
            </button>
          ))}
        </div>

        <button type="submit" className="setup-start-btn">
          🎬 Start Party
        </button>
      </form>
    </div>
  )
}
