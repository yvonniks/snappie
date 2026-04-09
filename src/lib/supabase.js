import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─── Storage bucket names ─────────────────────────────────
const FAMILY_BUCKET = 'family-album'
const EVENT_BUCKET  = 'event-albums'

// ─── Upload a blob to Supabase Storage ───────────────────
// Returns: { url, path, error }
export async function uploadMedia(blob, { albumType = 'family', eventId = null, filename } = {}) {
  if (!supabase) return { url: null, path: null, error: new Error('Supabase not configured') }
  const bucket = albumType === 'event' ? EVENT_BUCKET : FAMILY_BUCKET
  const folder = albumType === 'event' ? `${eventId}/` : ''
  const ext    = blob.type === 'image/gif' ? 'gif' : 'jpg'
  const name   = filename || `${Date.now()}.${ext}`
  const path   = `${folder}${name}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: blob.type, upsert: false })

  if (error) return { url: null, path: null, error }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: urlData.publicUrl, path, error: null }
}

// ─── List media in family album (private bucket, signed URLs) ────────────────
export async function listFamilyMedia() {
  if (!supabase) return []
  const { data, error } = await supabase.storage
    .from(FAMILY_BUCKET)
    .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return []

  const files = data.filter(f => f.name && /\.(jpg|jpeg|gif|png|webp)$/i.test(f.name))
  if (files.length === 0) return []

  const { data: signed, error: signError } = await supabase.storage
    .from(FAMILY_BUCKET)
    .createSignedUrls(files.map(f => f.name), 60 * 60 * 24) // 24-hour tokens
  if (signError) return []

  return signed.map((s, i) => ({ ...files[i], url: s.signedUrl }))
}

// ─── List media in an event album ────────────────────────
export async function listEventMedia(eventId) {
  if (!supabase) return []
  const { data, error } = await supabase.storage
    .from(EVENT_BUCKET)
    .list(`${eventId}/`, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  if (error) return []

  const files = data.filter(f => f.name && /\.(jpg|jpeg|gif|png|webp)$/i.test(f.name))
  if (files.length === 0) return []

  const paths = files.map(f => `${eventId}/${f.name}`)
  const { data: signed, error: signError } = await supabase.storage
    .from(EVENT_BUCKET)
    .createSignedUrls(paths, 60 * 60 * 24)
  if (signError) return []

  return signed.map((s, i) => ({ ...files[i], url: s.signedUrl }))
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

// ─── Event config (_config.json per event) ───────────────
export async function uploadEventConfig(code, config) {
  if (!supabase) return { error: new Error('Supabase not configured') }
  const json = JSON.stringify(config)
  const blob = new Blob([json], { type: 'application/json' })
  const { error } = await supabase.storage
    .from(EVENT_BUCKET)
    .upload(`${code}/_config.json`, blob, { contentType: 'application/json', upsert: true })
  return { error }
}

export async function loadEventConfig(code) {
  if (!supabase) return null
  const { data, error } = await supabase.storage
    .from(EVENT_BUCKET)
    .download(`${code}/_config.json`)
  if (error || !data) return null
  try {
    return JSON.parse(await data.text())
  } catch {
    return null
  }
}

// ─── Delete a file ────────────────────────────────────────
export async function deleteMedia(path, albumType = 'family') {
  if (!supabase) return { error: new Error('Supabase not configured') }
  const bucket = albumType === 'event' ? EVENT_BUCKET : FAMILY_BUCKET
  const { error } = await supabase.storage.from(bucket).remove([path])
  return { error }
}
