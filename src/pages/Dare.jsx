import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { getRandomDare, shuffleDare } from '../lib/dares'
import './Dare.css'

export default function Dare() {
  const nav = useNavigate()
  const { setActiveDare } = useApp()
  const [dare, setDare] = useState(() => getRandomDare())
  const [idx,  setIdx]  = useState(1)

  function handleShuffle() {
    const next = shuffleDare(dare)
    setDare(next)
    setIdx(i => i + 1)
  }

  function handleReady() {
    setActiveDare(dare)
    nav('/booth')
  }

  function handleSkip() {
    setActiveDare(null)
    nav('/booth')
  }

  return (
    <div className="dare-screen">
      <div className="dare-eyebrow">🎲 Today's Dare</div>
      <h2 className="dare-head">Can you pull this off?</h2>

      <div className="dare-card">
        <div className="dare-counter">Dare {idx}</div>
        <span className="dare-emoji">{dare.emoji}</span>
        <div className="dare-text">"{dare.text}"</div>
        <div className="dare-sub">{dare.sub}</div>
      </div>

      <button className="dare-shuffle" onClick={handleShuffle}>
        🔀 &nbsp;Shuffle dare
      </button>

      <button className="dare-ready" onClick={handleReady}>
        I'm ready! 🎬
      </button>

      <button className="dare-skip" onClick={handleSkip}>
        Skip the dare
      </button>
    </div>
  )
}
