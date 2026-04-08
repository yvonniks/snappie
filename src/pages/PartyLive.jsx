import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { usePartyMode } from '../hooks/usePartyMode'
import './PartyLive.css'

export default function PartyLive() {
  const nav = useNavigate()
  const { partySession, setPartySession, setAlbumMode, setShootMode } = useApp()
  const { isActive, isExpired, remainingStr, endParty } = usePartyMode()

  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [tick, setTick] = useState(0)
  const intervalRef = useRef(null)

  // Tick every second to keep timer live
  useEffect(() => {
    intervalRef.current = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // Generate QR code from share URL
  useEffect(() => {
    if (!partySession?.shareUrl) return
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(partySession.shareUrl, {
        width: 220, margin: 2,
        color: { dark: '#1A1A2E', light: '#FFF5E6' }
      }).then(setQrDataUrl)
    })
  }, [partySession?.shareUrl])

  function handleEnd() {
    if (!window.confirm('End this party session?')) return
    endParty()
    setPartySession(null)
    setAlbumMode('family')
    nav('/')
  }

  function handleOpenBooth() {
    setShootMode('photo')
    nav('/dare')
  }

  // Redirect if no active session
  useEffect(() => {
    if (!partySession) nav('/', { replace: true })
  }, [partySession, nav])

  if (!partySession) return null

  const shareUrl = partySession.shareUrl

  return (
    <div className="party-live-screen">
      {/* Header */}
      <div className="pl-header">
        <div className="pl-status-dot" data-expired={isExpired} />
        <div className="pl-event-name">{partySession.eventName}</div>
        <div className={`pl-timer ${isExpired ? 'expired' : ''}`}>
          {isExpired ? '⏰ Ended' : remainingStr}
        </div>
      </div>

      {/* QR Card */}
      <div className="pl-qr-card">
        <div className="pl-qr-eyebrow">📲 Scan to join</div>
        {qrDataUrl
          ? <img src={qrDataUrl} alt="QR Code" className="pl-qr-img" />
          : <div className="pl-qr-placeholder" />
        }
        <div className="pl-share-url">{shareUrl}</div>
        <button
          className="pl-copy-btn"
          onClick={() => navigator.clipboard?.writeText(shareUrl)}
        >
          Copy Link
        </button>
      </div>

      {/* Stats row */}
      <div className="pl-stats">
        <div className="pl-stat">
          <div className="pl-stat-val">{partySession.photoCount}</div>
          <div className="pl-stat-lbl">Photos</div>
        </div>
        <div className="pl-stat-div" />
        <div className="pl-stat">
          <div className="pl-stat-val">{partySession.durationHours}h</div>
          <div className="pl-stat-lbl">Duration</div>
        </div>
      </div>

      {/* Actions */}
      <div className="pl-actions">
        <button className="pl-booth-btn" onClick={handleOpenBooth} disabled={isExpired}>
          📸 Open Booth
        </button>
        <button className="pl-gallery-btn" onClick={() => nav(`/event/${partySession.id}`)}>
          🖼️ View Album
        </button>
        <button className="pl-end-btn" onClick={handleEnd}>
          End Party
        </button>
      </div>
    </div>
  )
}
