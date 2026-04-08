import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadEventConfig } from '../../lib/supabase'
import { THEMES } from '../../lib/themes'
import './HostCreate.css'

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function HostCreate() {
  const nav = useNavigate()

  const [name,    setName]    = useState('')
  const [code,    setCode]    = useState('')
  const [theme,   setTheme]   = useState('kids')
  const [pin,     setPin]     = useState('')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  function handleNameChange(val) {
    setName(val)
    setCode(slugify(val))
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!code) { setError('Event code is required.'); return }
    if (pin.length < 4) { setError('PIN must be at least 4 digits.'); return }

    setSaving(true)
    setError(null)

    const config = {
      code,
      name: name.trim() || code,
      theme,
      pin,
      createdAt: new Date().toISOString(),
    }

    const { error: uploadError } = await uploadEventConfig(code, config)
    if (uploadError) {
      setError('Could not create event — check your connection.')
      setSaving(false)
    } else {
      nav(`/host/${code}`)
    }
  }

  return (
    <div className="hcreate-screen">
      <button className="hcreate-back" onClick={() => nav('/')}>← Home</button>

      <div className="hcreate-hero">
        <div className="hcreate-icon">🎛️</div>
        <h1 className="hcreate-title">Create Event</h1>
        <p className="hcreate-sub">Set up a new photo booth for your guests.</p>
      </div>

      <form className="hcreate-form" onSubmit={handleCreate}>
        <label className="hcreate-label">Event name</label>
        <input
          className="hcreate-input"
          type="text"
          placeholder="e.g. Zoey's Birthday 🎂"
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          maxLength={50}
          required
        />

        <label className="hcreate-label">Event URL code</label>
        <div className="hcreate-code-wrap">
          <span className="hcreate-code-prefix">/party/</span>
          <input
            className="hcreate-input hcreate-code-input"
            type="text"
            placeholder="zoeys-bday"
            value={code}
            onChange={e => setCode(slugify(e.target.value))}
            maxLength={40}
            required
          />
        </div>

        <label className="hcreate-label">Theme</label>
        <div className="hcreate-themes">
          {Object.entries(THEMES).map(([key, t]) => (
            <button
              key={key}
              type="button"
              className={`hcreate-theme-chip ${theme === key ? 'on' : 'off'}`}
              style={{ '--tp': t.primary }}
              onClick={() => setTheme(key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="hcreate-label">Host PIN (min 4 digits)</label>
        <input
          className="hcreate-input"
          type="password"
          inputMode="numeric"
          placeholder="e.g. 2026"
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
          maxLength={8}
          required
        />

        {error && <p className="hcreate-error">{error}</p>}

        <button type="submit" className="hcreate-submit" disabled={saving}>
          {saving ? 'Creating…' : '🎉 Create Event'}
        </button>
      </form>
    </div>
  )
}
