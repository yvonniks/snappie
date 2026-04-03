import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Storage bucket names ─────────────────────────────────
const FAMILY_BUCKET = 'family-album'
const EVENT_BUCKET  = 'event-albums'

// ─── Upload a blob to Supabase Storage ───────────────────
// Returns: { url, path, error }
export async function uploadMedia(blob, { albumType = 'family', eventId = null, filename } = {}) {
  const bucket = albumType === 'event' ? EVENT_BUCKET : FAMILY_BUCKET
  const folder = albumType === 'event' ? `${eventId}/` : ''
  const ext    = blob.type === 'image/gif' ? 'gif' : 'jpg'
  const name   = filename || `${Date.now()}.${ext}`
  const path   = `${folder}${name}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) return { url: null, path: null, error }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: urlData.publicUrl, path, error: null }
}

// ─── List media in family album ───────────────────────────
export async function listFamilyMedia() {
  const { data, error } = await supabase.storage
    .from(FAMILY_BUCKET)
    .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return []
  return data.map(f => ({
    ...f,
    url: supabase.storage.from(FAMILY_BUCKET).getPublicUrl(f.name).data.publicUrl
  }))
}

// ─── List media in an event album ────────────────────────
export async function listEventMedia(eventId) {
  const { data, error } = await supabase.storage
    .from(EVENT_BUCKET)
    .list(`${eventId}/`, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return []
  return data.map(f => ({
    ...f,
    url: supabase.storage.from(EVENT_BUCKET).getPublicUrl(`${eventId}/${f.name}`).data.publicUrl
  }))
}

// ─── Download a file to the user's device ────────────────
export async function downloadMedia(url, filename = 'snappie-photo.jpg') {
  const res  = await fetch(url)
  const blob = await res.blob()
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ─── Delete a file ────────────────────────────────────────
export async function deleteMedia(path, albumType = 'family') {
  const bucket = albumType === 'event' ? EVENT_BUCKET : FAMILY_BUCKET
  const { error } = await supabase.storage.from(bucket).remove([path])
  return { error }
}
