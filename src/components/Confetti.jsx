import React, { useEffect, useMemo } from 'react'
import './Confetti.css'

const COLORS = ['#FF6CAB','#FFD166','#C084FC','#4ECDC4','#FF8C42','#ffffff','#A8E6CF','#FFB3D1']

export default function Confetti({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: i,
    x:     Math.random() * 100,
    color: COLORS[i % COLORS.length],
    size:  6 + (i % 5) * 2,
    delay: Math.random() * 0.6,
    dur:   1.4 + Math.random() * 0.8,
    rot:   Math.random() * 360,
    drift: -30 + Math.random() * 60,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'rect-tall',
  })), [])

  return (
    <div className="confetti-root" aria-hidden>
      {pieces.map(p => (
        <span
          key={p.id}
          className={`confetti-piece confetti-${p.shape}`}
          style={{
            left:              `${p.x}%`,
            width:             `${p.size}px`,
            height:            p.shape === 'rect-tall' ? `${p.size * 2.5}px` : `${p.size}px`,
            background:        p.color,
            animationDelay:    `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            '--drift':         `${p.drift}px`,
            '--rot':           `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}
