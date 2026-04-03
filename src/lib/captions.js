const CLAUDE_KEY   = import.meta.env.VITE_CLAUDE_API_KEY
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001' // fast + cheap for captions

// ─── Generate a fun AI caption for a polaroid ────────────
// imageDataUrl: base64 data URL from canvas (optional - works text-only too)
// context: { dare, mode, date }
export async function generateCaption({ dare = null, mode = 'photo', date = null } = {}) {
  const today = date || new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  const dareContext = dare ? `The person was doing this dare: "${dare}". ` : ''
  const modeContext = mode === 'gif' ? 'This is an animated GIF burst. '
                    : mode === 'stopmotion' ? 'This is a stop-motion sequence. '
                    : ''

  const prompt = `You are writing a fun, short polaroid photo caption for a family photo booth app called Snappie. 
${dareContext}${modeContext}The photo was taken on ${today}.

Write ONE caption that is:
- Playful, warm, and family-friendly
- Under 35 characters (it must fit on a polaroid)
- Includes 1 emoji
- Creative and specific — avoid generic phrases like "fun times" or "great memories"
- Sounds like something a kid would love reading

Reply with ONLY the caption text, nothing else.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!res.ok) throw new Error(`Claude API ${res.status}`)
    const data = await res.json()
    const raw  = data.content?.[0]?.text?.trim() || ''
    // Strip quotes if the model wraps in them
    return raw.replace(/^["']|["']$/g, '')
  } catch (err) {
    console.warn('Caption generation failed:', err)
    return fallbackCaption()
  }
}

// ─── Fallback captions if API is unavailable ─────────────
function fallbackCaption() {
  const captions = [
    'Peak silliness achieved 🏆',
    'Future comedian spotted 🎭',
    'No context needed 😂',
    'Caught in the act 📸',
    'Main character energy ✨',
    'This one is framed forever 🖼️',
    'A moment too good to delete 💛',
    'Certified chaos 🌀',
    'Dinosaur mode: activated 🦕',
    'Just being us 🧡',
  ]
  return captions[Math.floor(Math.random() * captions.length)]
}
