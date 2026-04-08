import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { uploadMedia } from '../lib/supabase'
import { generateCaption } from '../lib/captions'
import './Result.css'

export default function Result() {
  const nav = useNavigate()
  const { capturedDataUrl, capturedBlob, activeDare, shootMode, albumMode, partySession } = useApp()

  const [caption,     setCaption]     = useState('')
  const [editCaption, setEditCaption] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [saveError,   setSaveError]   = useState(null)

  // Redirect if there's nothing to show
  useEffect(() => {
    if (!capturedDataUrl) nav('/', { replace: true })
  }, [capturedDataUrl, nav])

  // Generate caption on mount
  useEffect(() => {
    generateCaption({
      dare: activeDare?.text || null,
      mode: shootMode,
    }).then(setCaption)
  }, [])

  async function handleSave() {
    if (saving || saved || !capturedBlob) return
    setSaving(true)
    setSaveError(null)

    const isEvent  = albumMode === 'event' && partySession?.id
    const { url, error } = await uploadMedia(capturedBlob, {
      albumType: isEvent ? 'event' : 'family',
      eventId:   isEvent ? partySession.id : null,
    })

    if (error) {
      setSaveError('Upload failed — check your connection.')
      setSaving(false)
    } else {
      setSaved(true)
      setSaving(false)
    }
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })

  const isGif = shootMode !== 'photo'

  return (
    <div className="result-screen">
      {/* Polaroid */}
      <div className="result-pola">
        <div className="pola-photo-wrap">
          {isGif
            ? <img src={capturedDataUrl} alt="captured" className="pola-img" />
            : <img src={capturedDataUrl} alt="captured" className="pola-img" />
          }
          {isGif && <div className="gif-badge">GIF</div>}
        </div>

        {/* Caption */}
        <div className="pola-footer">
          {editCaption ? (
            <input
              className="pola-caption-input"
              value={caption}
              maxLength={40}
              onChange={e => setCaption(e.target.value)}
              onBlur={() => setEditCaption(false)}
              autoFocus
            />
          ) : (
            <div className="pola-caption" onClick={() => setEditCaption(true)}>
              {caption || '…'}
              <span className="pola-edit-hint">✏️</span>
            </div>
          )}
          <div className="pola-date">{dateStr}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="result-actions">
        {saved ? (
          <div className="saved-banner">
            <span>✅</span>
            <span>Saved to your album!</span>
          </div>
        ) : (
          <button
            className="result-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <span className="result-spinner" /> : '💾'}
            &nbsp;{saving ? 'Saving…' : 'Save to Album'}
          </button>
        )}

        {saveError && <p className="result-error">{saveError}</p>}

        <div className="result-secondary">
          <button className="result-sec-btn" onClick={() => nav('/booth')}>
            🔄 Retake
          </button>
          <button className="result-sec-btn" onClick={() => nav('/')}>
            🏠 Home
          </button>
          {saved && (
            <button className="result-sec-btn" onClick={() => nav('/gallery')}>
              🖼️ Gallery
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
