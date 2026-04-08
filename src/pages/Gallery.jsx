import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { listFamilyMedia, listEventMedia, deleteMedia, downloadMedia } from '../lib/supabase'
import './Gallery.css'

export default function Gallery({ eventMode = false }) {
  const nav = useNavigate()
  const { id: eventId } = useParams()

  const [media,   setMedia]   = useState([])
  const [loading, setLoading] = useState(true)
  const [active,  setActive]  = useState(null)   // full-screen item
  const [deleting, setDeleting] = useState(null) // path being deleted

  useEffect(() => {
    async function load() {
      setLoading(true)
      const items = eventMode
        ? await listEventMedia(eventId)
        : await listFamilyMedia()
      setMedia(items)
      setLoading(false)
    }
    load()
  }, [eventMode, eventId])

  async function handleDelete(item) {
    if (!window.confirm('Delete this photo?')) return
    setDeleting(item.name)
    const albumType = eventMode ? 'event' : 'family'
    const path = eventMode ? `${eventId}/${item.name}` : item.name
    await deleteMedia(path, albumType)
    setMedia(prev => prev.filter(m => m.name !== item.name))
    if (active?.name === item.name) setActive(null)
    setDeleting(null)
  }

  const title = eventMode ? '🎉 Event Album' : '🏠 Family Album'

  return (
    <div className="gallery-screen">
      {/* Header */}
      <header className="gallery-header">
        <button className="gallery-back" onClick={() => eventMode ? nav('/party/live') : nav(-1)}>← Back</button>
        <h1 className="gallery-title">{title}</h1>
        <div className="gallery-count">{media.length} photo{media.length !== 1 ? 's' : ''}</div>
      </header>

      {/* Grid */}
      <div className="gallery-body scroll-hide">
        {loading && (
          <div className="gallery-empty">
            <div className="gallery-spinner" />
            <p>Loading…</p>
          </div>
        )}

        {!loading && media.length === 0 && (
          <div className="gallery-empty">
            <div className="gallery-empty-icon">📷</div>
            <p className="gallery-empty-title">No photos yet</p>
            <p className="gallery-empty-sub">Go take some snappies!</p>
            <button className="gallery-cta" onClick={() => nav('/')}>Open Booth</button>
          </div>
        )}

        {!loading && media.length > 0 && (
          <div className="gallery-grid">
            {media.map((item, i) => (
              <div
                key={item.name}
                className="gallery-pola"
                style={{ '--r': `${(i % 3 - 1) * 1.8}deg` }}
                onClick={() => setActive(item)}
              >
                <div className="gallery-pola-img-wrap">
                  <img
                    src={item.url}
                    alt=""
                    className="gallery-pola-img"
                    loading="lazy"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                </div>
                <div className="gallery-pola-cap">
                  {item.name.replace(/\.\w+$/, '').slice(-8)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen lightbox */}
      {active && (
        <div className="lightbox" onClick={() => setActive(null)}>
          <div className="lightbox-pola" onClick={e => e.stopPropagation()}>
            <img src={active.url} alt="" className="lightbox-img" />
            <div className="lightbox-actions">
              <button
                className="lb-btn lb-download"
                onClick={() => downloadMedia(active.url, active.name)}
              >
                ⬇️ Save
              </button>
              <button
                className={`lb-btn lb-delete ${deleting === active.name ? 'busy' : ''}`}
                onClick={() => handleDelete(active)}
                disabled={!!deleting}
              >
                {deleting === active.name ? '…' : '🗑️ Delete'}
              </button>
              <button className="lb-btn lb-close" onClick={() => setActive(null)}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
