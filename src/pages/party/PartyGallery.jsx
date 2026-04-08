import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listEventMedia, loadEventConfig, uploadMedia } from '../../lib/supabase'
import { compressImage } from '../../lib/compress'
import { getTheme } from '../../lib/themes'
import './PartyGallery.css'

const POLL_MS = 5000

export default function PartyGallery() {
  const { code } = useParams()
  const nav = useNavigate()

  const [photos,    setPhotos]    = useState([])
  const [config,    setConfig]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [active,    setActive]    = useState(null)
  const [uploading, setUploading] = useState(false)
  const [stripPage, setStripPage] = useState(0)
  const knownNames    = useRef(new Set())
  const intervalRef   = useRef(null)
  const uploadInputRef = useRef(null)
  const stripScrollRef = useRef(null)

  async function fetchPhotos(isFirst = false) {
    const items = await listEventMedia(code)
    setPhotos(prev => {
      const updated = items.map(item => ({
        ...item,
        isNew:   !knownNames.current.has(item.name),
        isStrip: item.name?.startsWith('strip_'),
      }))
      items.forEach(i => knownNames.current.add(i.name))
      return updated
    })
    if (isFirst) setLoading(false)
  }

  const handleStripScroll = useCallback(() => {
    if (!stripScrollRef.current) return
    const el = stripScrollRef.current
    const page = Math.round(el.scrollLeft / el.clientWidth)
    setStripPage(page)
  }, [])

  useEffect(() => {
    loadEventConfig(code).then(setConfig)
    fetchPhotos(true)
    intervalRef.current = setInterval(() => fetchPhotos(), POLL_MS)
    return () => clearInterval(intervalRef.current)
  }, [code])

  async function handleUploadFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const { error } = await uploadMedia(compressed, { albumType: 'event', eventId: code })
      if (error) throw error
      await fetchPhotos()
    } catch { /* silently ignore */ } finally {
      setUploading(false)
    }
  }

  const theme = config ? getTheme(config.theme) : getTheme('kids')
  const eventName = config?.name || 'Party Album'

  return (
    <div className="pgal-screen">
      {/* Header */}
      <header className="pgal-header" style={{ '--theme-primary': theme.primary }}>
        <div className="pgal-live-row">
          <span className="pgal-live-dot" />
          <span className="pgal-live-label">Live</span>
        </div>
        <h1 className="pgal-title">{eventName}</h1>
        <div className="pgal-count">{photos.length} photo{photos.length !== 1 ? 's' : ''}</div>
      </header>

      {/* Grid */}
      <div className="pgal-body scroll-hide">
        {loading && (
          <div className="pgal-empty">
            <div className="pgal-spinner" />
          </div>
        )}

        {!loading && photos.length === 0 && (
          <div className="pgal-empty">
            <div className="pgal-empty-icon">📷</div>
            <p className="pgal-empty-title">No photos yet!</p>
            <p className="pgal-empty-sub">Be the first to take one.</p>
          </div>
        )}

        {/* Welcome banner */}
        {config && (
          <div className="pgal-welcome">
            <p>Welcome to <strong>{eventName}</strong>! 🎂</p>
            <p>Strike a pose, snap a photo, and help us capture these beautiful moments. Every picture counts! 💛</p>
          </div>
        )}

        {photos.length > 0 && (
          <div className="pgal-grid">
            {photos.map((item, i) => (
              <div
                key={item.name}
                className={`pgal-pola ${item.isNew ? 'pola-new' : ''}`}
                style={{ '--r': `${(i % 3 - 1) * 1.6}deg` }}
                onClick={() => { setActive(item); setStripPage(0) }}
              >
                <div className="pgal-pola-img-wrap">
                  <img
                    src={item.url}
                    alt=""
                    className="pgal-pola-img"
                    loading="lazy"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB row */}
      <div className="pgal-fab-row" style={{ '--theme-primary': theme.primary }}>
        <button className="pgal-upload-btn" onClick={() => uploadInputRef.current?.click()} disabled={uploading}>
          {uploading ? '⏳' : '📁'} Upload
        </button>
        <button className="pgal-fab" onClick={() => nav(`/party/${code}/camera`)}>
          📸 Take a photo
        </button>
      </div>
      <input
        ref={uploadInputRef}
        type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={handleUploadFile}
      />

      {/* Lightbox */}
      {active && (
        <div className="pgal-lightbox" onClick={() => setActive(null)}>
          <div className="pgal-lb-pola" onClick={e => e.stopPropagation()}>
            <button className="pgal-lb-close" onClick={() => setActive(null)}>✕</button>

            {active.isStrip ? (
              <>
                <div
                  className="pgal-lb-strip-wrap"
                  ref={stripScrollRef}
                  onScroll={handleStripScroll}
                >
                  {[0, 1, 2].map(i => (
                    <div key={i} className="pgal-lb-strip-panel">
                      <img
                        src={active.url}
                        alt={`Shot ${i + 1}`}
                        className="pgal-lb-strip-img"
                        style={{ objectPosition: `center ${i * 50}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="pgal-lb-dots">
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`pgal-lb-dot ${stripPage === i ? 'on' : ''}`} />
                  ))}
                </div>
              </>
            ) : (
              <img src={active.url} alt="" className="pgal-lb-img" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
