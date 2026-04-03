import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

const SESSION_KEY = 'snappie_party_session'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function usePartyMode() {
  const [session, setSession] = useState(() => loadSession())

  const createParty = useCallback(({ eventName, durationHours = 2 }) => {
    const id        = uuidv4()
    const expiresAt = Date.now() + durationHours * 60 * 60 * 1000
    const newSession = {
      id,
      eventName,
      durationHours,
      expiresAt,
      createdAt:  Date.now(),
      photoCount: 0,
      guestCount: 0,
      shareUrl:   `${window.location.origin}/event/${id}`,
    }
    saveSession(newSession)
    setSession(newSession)
    return newSession
  }, [])

  const incrementPhotos = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, photoCount: prev.photoCount + 1 }
      saveSession(updated)
      return updated
    })
  }, [])

  const endParty = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setSession(null)
  }, [])

  const isExpired = session ? Date.now() > session.expiresAt : false
  const isActive  = !!session && !isExpired

  // Remaining time as mm:ss string
  const remainingMs   = session ? Math.max(0, session.expiresAt - Date.now()) : 0
  const remainingMins = Math.floor(remainingMs / 60000)
  const remainingSecs = Math.floor((remainingMs % 60000) / 1000)
  const remainingStr  = `${String(remainingMins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`

  return { session, isActive, isExpired, remainingStr, createParty, incrementPhotos, endParty }
}
