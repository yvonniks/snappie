import React, { useRef, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { uploadMedia } from '../../lib/supabase'
import { compressImage } from '../../lib/compress'
import Confetti from '../../components/Confetti'
import './PartyPreview.css'

const STICKERS = ['🎉', '🎂', '🎈', '⭐', '🦄', '🌈', '👑', '💫']

export default function PartyPreview() {
  const { code } = useParams()
  const nav = useNavigate()
  const { state } = useLocation()

  const { blob: originalBlob, dataUrl, dare } = state || {}

  const [stickers,     setStickers]     = useState([])
  const [dragging,     setDragging]     = useState(null)
  const [caption,      setCaption]      = useState('')
  const [saving,       setSaving]       = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState(null)
  const imgWrapRef = useRef(null)
  const dragState  = useRef(null)

  // Redirect if navigated here directly without state
  if (!dataUrl) {
    nav(`/party/${code}/camera`, { replace: true })
    return null
  }

  function addSticker(emoji) {
    if (stickers.length >= 6) return
    const n = stickers.length
    setStickers(prev => [...prev, {
      id: Date.now() + n,
      emoji,
      x: 45 + (n % 3) * 6,
      y: 45 + Math.floor(n / 3) * 6,
    }])
  }

  function removeSticker(id) {
    setStickers(prev => prev.filter(s => s.id !== id))
  }

  function onStickerPointerDown(e, id) {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const rect = imgWrapRef.current.getBoundingClientRect()
    const sticker = stickers.find(s => s.id === id)
    dragState.current = {
      id,
      offsetX: e.clientX - (rect.left + (sticker.x / 100) * rect.width),
      offsetY: e.clientY - (rect.top  + (sticker.y / 100) * rect.height),
    }
    setDragging(id)
  }

  function onWrapPointerMove(e) {
    if (!dragState.current) return
    const rect = imgWrapRef.current.getBoundingClientRect()
    const { id, offsetX, offsetY } = dragState.current
    const x = Math.max(5, Math.min(95, ((e.clientX - offsetX - rect.left) / rect.width)  * 100))
    const y = Math.max(5, Math.min(95, ((e.clientY - offsetY - rect.top)  / rect.height) * 100))
    setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y } : s))
  }

  function onWrapPointerUp() {
    dragState.current = null
    setDragging(null)
  }

  async function compositeAndUpload() {
    setSaving(true)
    setError(null)

    let finalBlob = originalBlob

    try {
      const img = new Image()
      await new Promise((res, rej) => {
        img.onload = res; img.onerror = rej; img.src = dataUrl
      })

      const photoSize = img.naturalWidth   // square capture
      const pad       = Math.round(photoSize * 0.04)
      const stripH    = Math.round(photoSize * 0.20)

      const canvas = document.createElement('canvas')
      canvas.width  = photoSize + pad * 2
      canvas.height = photoSize + pad + stripH
      const ctx = canvas.getContext('2d')

      // White polaroid background
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Photo
      ctx.drawImage(img, pad, pad, photoSize, photoSize)

      // Stickers — positions are % of photo area
      if (stickers.length > 0) {
        const sz = Math.round(photoSize * 0.18)
        ctx.font = `${sz}px serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        stickers.forEach(({ emoji, x, y }) => {
          ctx.fillText(emoji, pad + (x / 100) * photoSize, pad + (y / 100) * photoSize)
        })
      }

      // Caption in white strip — marker style
      if (caption.trim()) {
        await document.fonts.ready
        const capSize = Math.round(photoSize * 0.09)
        ctx.font = `italic 700 ${capSize}px 'Caveat', cursive`
        ctx.fillStyle = '#444'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(caption.trim(), canvas.width / 2, photoSize + pad + stripH / 2)
      }

      finalBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
    } catch {
      // fall back to original blob
    }

    try {
      const compressed = await compressImage(finalBlob)
      const { error: uploadError } = await uploadMedia(compressed, {
        albumType: 'event',
        eventId:   code,
      })
      if (uploadError) throw uploadError
      setShowConfetti(true)
    } catch {
      setError('Upload failed — check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="preview-screen">
      {showConfetti && (
        <Confetti onDone={() => {
          setSaved(true)
          setTimeout(() => nav(`/party/${code}/gallery`), 800)
        }} />
      )}
      {/* Full-width progress bar — visible the moment save is tapped */}
      {saving && !showConfetti && <div className="preview-progress-bar" />}

      {/* Polaroid */}
      <div className="preview-pola">
        <div
          className="preview-img-wrap"
          ref={imgWrapRef}
          onPointerMove={onWrapPointerMove}
          onPointerUp={onWrapPointerUp}
          onPointerLeave={onWrapPointerUp}
        >
          <img src={dataUrl} alt="your photo" className="preview-img" />
          {stickers.map(s => (
            <div
              key={s.id}
              className={`sticker-placed ${dragging === s.id ? 'dragging' : ''}`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onPointerDown={e => onStickerPointerDown(e, s.id)}
            >
              <span className="sticker-emoji">{s.emoji}</span>
              <button
                className="sticker-remove"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => removeSticker(s.id)}
              >✕</button>
            </div>
          ))}
        </div>
        <div className="preview-pola-cap">
          {caption.trim() ? caption : dare ? `${dare.emoji} ${dare.text}` : ''}
        </div>
      </div>

      {/* Sticker picker */}
      <div className="preview-sticker-row">
        <div className="preview-sticker-hint">
          {stickers.length >= 6 ? 'Max stickers reached' : 'Tap to add a sticker'}
        </div>
        <div className="preview-stickers">
          {STICKERS.map(s => (
            <button
              key={s}
              className="preview-sticker-btn"
              onClick={() => addSticker(s)}
              disabled={stickers.length >= 6}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div className="preview-sticker-row">
        <input
          type="text"
          className="preview-caption-input"
          placeholder="Add a caption… (optional)"
          maxLength={60}
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="preview-actions">
        {saved ? (
          <div className="preview-saved">✅ Added to the album!</div>
        ) : (
          <button className="preview-save-btn" onClick={compositeAndUpload} disabled={saving}>
            {saving ? <span className="preview-spinner" /> : '📸'}
            &nbsp;{saving ? 'Saving…' : 'Add to Party Album'}
          </button>
        )}
        {error && <p className="preview-error">{error}</p>}
        <button className="preview-retake" onClick={() => nav(`/party/${code}/camera`)}>
          ↩ Retake
        </button>
      </div>
    </div>
  )
}
