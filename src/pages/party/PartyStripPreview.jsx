import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { uploadMedia } from '../../lib/supabase'
import { compressImage } from '../../lib/compress'
import Confetti from '../../components/Confetti'
import './PartyStripPreview.css'

export default function PartyStripPreview() {
  const { code } = useParams()
  const nav = useNavigate()
  const { state } = useLocation()

  const { shots, dare } = state || {}

  const [caption,      setCaption]      = useState('')
  const [saving,       setSaving]       = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error,        setError]        = useState(null)

  if (!shots?.length) {
    nav(`/party/${code}/camera`, { replace: true })
    return null
  }

  async function saveStrip() {
    setSaving(true)
    setError(null)

    try {
      const imgs = await Promise.all(shots.map(s => new Promise((res, rej) => {
        const img = new Image()
        img.onload = () => res(img)
        img.onerror = rej
        img.src = s.dataUrl
      })))

      const photoSize = imgs[0].naturalWidth || 1600
      const pad       = Math.round(photoSize * 0.04)
      // Each shot: photoSize + pad (top) + small gap. Shared caption strip at very bottom.
      const shotSlot  = photoSize + pad * 2   // height of each polaroid slot (pad top + photo + pad bottom)
      const capStripH = caption.trim() ? Math.round(photoSize * 0.12) : 0

      const canvas = document.createElement('canvas')
      canvas.width  = photoSize + pad * 2
      canvas.height = shotSlot * 3 + capStripH
      const ctx = canvas.getContext('2d')

      // White background
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      imgs.forEach((img, i) => {
        const yOff = i * shotSlot
        ctx.drawImage(img, pad, yOff + pad, photoSize, photoSize)
        // Thin separator line between shots
        if (i < 2) {
          ctx.fillStyle = 'rgba(0,0,0,0.08)'
          ctx.fillRect(0, yOff + shotSlot - 1, canvas.width, 2)
        }
      })

      // Caption in white strip at bottom — marker style
      if (caption.trim()) {
        await document.fonts.ready
        const capSize = Math.round(photoSize * 0.08)
        ctx.font = `italic 700 ${capSize}px 'Caveat', cursive`
        ctx.fillStyle = '#444'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(caption.trim(), canvas.width / 2, shotSlot * 3 + capStripH / 2)
      }

      const finalBlob  = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92))
      const compressed = await compressImage(finalBlob, 2400, 0.82)
      const { error: uploadError } = await uploadMedia(compressed, {
        albumType: 'event',
        eventId:   code,
        filename:  `strip_${Date.now()}.jpg`,
      })
      if (uploadError) throw uploadError
      setShowConfetti(true)
    } catch {
      setError('Upload failed — check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="pstrip-screen">
      {showConfetti && (
        <Confetti onDone={() => setTimeout(() => nav(`/party/${code}/gallery`), 800)} />
      )}
      {saving && !showConfetti && <div className="pstrip-progress-bar" />}

      <div className="pstrip-scroll">
        <p className="pstrip-hint">Your photo strip 🎞</p>

        {/* Three polaroids */}
        <div className="pstrip-polas">
          {shots.map((s, i) => (
            <div
              key={i}
              className="pstrip-pola"
              style={{ '--r': `${(i % 2 === 0 ? 1 : -1) * 1.4}deg` }}
            >
              <div className="pstrip-img-wrap">
                <img src={s.dataUrl} alt={`Shot ${i + 1}`} className="pstrip-img" />
              </div>
            </div>
          ))}
        </div>

        {dare && <p className="pstrip-dare">{dare.emoji} {dare.text}</p>}

        {/* Caption */}
        <input
          type="text"
          className="pstrip-caption-input"
          placeholder="Add a caption… (optional)"
          maxLength={60}
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />

        {/* Actions */}
        <div className="pstrip-actions">
          <button className="pstrip-save-btn" onClick={saveStrip} disabled={saving || showConfetti}>
            {saving ? <span className="pstrip-spinner" /> : '🎞'}
            &nbsp;{saving ? 'Saving…' : 'Save Strip'}
          </button>
          {error && <p className="pstrip-error">{error}</p>}
          <button className="pstrip-retake" onClick={() => nav(`/party/${code}/camera`)}>
            ↩ Retake
          </button>
        </div>
      </div>
    </div>
  )
}
