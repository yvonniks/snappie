import { DARES } from './dares'

const WEDDING_PROMPTS = [
  { emoji: '💃', text: 'Spin your partner around!',       sub: 'Feel the music!' },
  { emoji: '💍', text: 'Show off that ring!',             sub: 'Bling bling!' },
  { emoji: '🥂', text: 'Toast to the happy couple!',      sub: 'Cheers!' },
  { emoji: '💃', text: 'Bust your best dance move!',      sub: 'The floor is yours!' },
  { emoji: '🌹', text: 'Strike a romantic pose!',         sub: 'So elegant!' },
  { emoji: '🎊', text: 'Toss some confetti!',             sub: 'Celebrate!' },
]

const CORPORATE_PROMPTS = [
  { emoji: '💼', text: 'Strike your power pose!',         sub: 'CEO energy!' },
  { emoji: '🤝', text: 'Give your best handshake face!',  sub: 'Deal closed!' },
  { emoji: '📊', text: 'Pretend to present the Q4 deck!', sub: 'Numbers are up!' },
  { emoji: '🏆', text: 'Hold your invisible award!',      sub: 'MVP right here!' },
  { emoji: '🚀', text: 'Launch the product!',             sub: '3… 2… 1…' },
  { emoji: '🎯', text: 'Hit the bullseye pose!',          sub: 'On target!' },
]

export const THEMES = {
  kids: {
    label:        'Kids Party',
    primary:      '#FF6CAB',   // hot pink
    accent:       '#FFD166',   // sunny yellow
    bg:           '#FBF0FF',   // pale lavender
    curtainLeft:  '#4A1D96',   // deep purple
    curtainRight: '#1E3A8A',   // deep navy blue
    prompts:      DARES,
  },
  wedding: {
    label:        'Wedding',
    primary:      '#C9A96E',
    accent:       '#F5EFE6',
    bg:           '#1C1410',
    curtainLeft:  '#722F37',
    curtainRight: '#9B4A55',
    prompts:      WEDDING_PROMPTS,
  },
  corporate: {
    label:        'Corporate',
    primary:      '#2C5282',
    accent:       '#EBF4FF',
    bg:           '#0F172A',
    curtainLeft:  '#1E3A5F',
    curtainRight: '#2C5282',
    prompts:      CORPORATE_PROMPTS,
  },
}

export const DEFAULT_THEME = 'kids'

export function getTheme(key) {
  return THEMES[key] || THEMES[DEFAULT_THEME]
}
