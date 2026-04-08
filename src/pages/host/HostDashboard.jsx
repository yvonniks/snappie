import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import JSZip from 'jszip'
import { loadEventConfig, listEventMedia, deleteMedia } from '../../lib/supabase'
import { getTheme } from '../../lib/themes'
import './HostDashboard.css'

export default function HostDashboard() {
  const { code } = useParams()
  const nav = useNavigate()

  const [config,    setConfig]    = useState(null)
  const [photos,    setPhotos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [pinInput,  setPinInput]  = useState('')
  const [pinError,  setPinError]  = useState(false)
  const [unlocked,  setUnlocked]  = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [deleting,  setDeleting]  = useState(null)
  const [zipping,   setZipping]   = useState(false)

  useEffect(() => {
    loadEventConfig(code).then(cfg => {
      setConfig(cfg)
      setLoading(false)
      if (cfg) {
        const shareUrl = `${window.location.origin}/party/${code}`
        import('qrcode').then(QRCode =>
          QRCode.toDataURL(shareUrl, { width: 200, margin: 2,
            color: { dark: '#1A1A2E', light: '#FFF5E6' } }).then(setQrDataUrl)
        )
      }
    })
  }, [code])

  useEffect(() => {
    if (unlocked) loadPhotos()
  }, [unlocked])

  async function loadPhotos() {
    const items = await listEventMedia(code)
    setPhotos(items)
  }

  function handlePin(e) {
    e.preventDefault()
    if (pinInput === config.pin) {
      setUnlocked(true)
      setPinError(false)
    } else {
      setPinError(true)
      setPinInput('')
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('Delete this photo?')) return
    setDeleting(item.name)
    await deleteMedia(`${code}/${item.name}`, 'event')
    setPhotos(prev => prev.filter(p => p.name !== item.name))
    setDeleting(null)
  }

  async function handleDownloadAll() {
    if (photos.length === 0) return
    setZipping(true)
    const zip = new JSZip()
    await Promise.all(photos.map(async (item, i) => {
      try {
        const res  = await fetch(item.url)
        const blob = await res.blob()
        zip.file(`photo-${String(i + 1).padStart(3, '0')}.jpg`, blob)
      } catch { /* skip failed */ }
    }))
    const content = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(content)
    a.download = `${code}-photos.zip`
    a.click()
    URL.revokeObjectURL(a.href)
    setZipping(false)
  }

  if (loading) return (
    <div className="hdash-screen hdash-center">
      <div className="hdash-spinner" />
    </div>
  )

  if (!config) return (
    <div className="hdash-screen hdash-center">
      <div style={{ fontSize: 52 }}>🎭</div>
      <p className="hdash-err-title">Event not found</p>
      <button className="hdash-back-btn" onClick={() => nav('/host')}>← Create Event</button>
    </div>
  )

  const theme    = getTheme(config.theme)
  const shareUrl = `${window.location.origin}/party/${code}`

  // PIN gate
  if (!unlocked) return (
    <div className="hdash-screen hdash-center">
      <div className="hdash-pin-card">
        <div className="hdash-pin-icon">🔒</div>
        <h2 className="hdash-pin-title">{config.name}</h2>
        <p className="hdash-pin-sub">Enter your host PIN to manage this event.</p>
        <form onSubmit={handlePin}>
          <input
            className={`hdash-pin-input ${pinError ? 'error' : ''}`}
            type="password" inputMode="numeric"
            placeholder="• • • •" value={pinInput}
            onChange={e => { setPinInput(e.target.value); setPinError(false) }}
            autoFocus maxLength={8}
          />
          {pinError && <p className="hdash-pin-err">Wrong PIN</p>}
          <button type="submit" className="hdash-pin-btn">Unlock →</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="hdash-screen">
      {/* Header */}
      <header className="hdash-header" style={{ '--tp': theme.primary }}>
        <button className="hdash-back-btn-sm" onClick={() => nav('/')}>← Home</button>
        <h1 className="hdash-title">{config.name}</h1>
        <div className="hdash-badge">Host</div>
      </header>

      <div className="hdash-body scroll-hide">
        {/* QR + share */}
        <div className="hdash-qr-card">
          <div className="hdash-qr-label">📲 Guest QR Code</div>
          {qrDataUrl && <img src={qrDataUrl} alt="QR" className="hdash-qr-img" />}
          <div className="hdash-share-url">{shareUrl}</div>
          <button className="hdash-copy-btn" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
            Copy Link
          </button>
        </div>

        {/* Stats + actions */}
        <div className="hdash-actions-row">
          <div className="hdash-stat">
            <div className="hdash-stat-val">{photos.length}</div>
            <div className="hdash-stat-lbl">Photos</div>
          </div>
          <button className="hdash-dl-btn" onClick={handleDownloadAll} disabled={zipping || photos.length === 0}>
            {zipping ? 'Zipping…' : '⬇️ Download All'}
          </button>
          <button className="hdash-refresh-btn" onClick={loadPhotos}>↻</button>
        </div>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="hdash-empty">No photos yet.</div>
        ) : (
          <div className="hdash-grid">
            {photos.map(item => (
              <div key={item.name} className="hdash-pola">
                <div className="hdash-pola-img-wrap">
                  <img src={item.url} alt="" className="hdash-pola-img"
                    onError={e => { e.currentTarget.style.display = 'none' }} />
                </div>
                <button
                  className={`hdash-del-btn ${deleting === item.name ? 'busy' : ''}`}
                  onClick={() => handleDelete(item)}
                  disabled={!!deleting}
                >🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
