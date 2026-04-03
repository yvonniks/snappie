import { useRef, useState, useCallback, useEffect } from 'react'

export function useCamera() {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const [facing, setFacing]     = useState('user')  // 'user' | 'environment'
  const [ready,  setReady]      = useState(false)
  const [error,  setError]      = useState(null)

  const startCamera = useCallback(async (facingMode = facing) => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setReady(false)
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width:  { ideal: 1280 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 1 }
        },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      }
    } catch (err) {
      setError(err.message || 'Camera access denied')
    }
  }, [facing])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setReady(false)
  }, [])

  const flipCamera = useCallback(() => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    startCamera(next)
  }, [facing, startCamera])

  // Capture a single frame as a canvas
  const captureFrame = useCallback((width = 800, height = 800) => {
    if (!videoRef.current) return null
    const canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const v   = videoRef.current
    // Mirror for selfie
    if (facing === 'user') {
      ctx.save(); ctx.scale(-1, 1); ctx.drawImage(v, -width, 0, width, height); ctx.restore()
    } else {
      ctx.drawImage(v, 0, 0, width, height)
    }
    return canvas
  }, [facing])

  // Capture N frames over durationMs for GIF / stop-motion
  const captureBurst = useCallback((count = 6, intervalMs = 200, size = 600) => {
    return new Promise((resolve) => {
      const frames = []
      let i = 0
      const iv = setInterval(() => {
        const f = captureFrame(size, size)
        if (f) frames.push(f)
        i++
        if (i >= count) {
          clearInterval(iv)
          resolve(frames)
        }
      }, intervalMs)
    })
  }, [captureFrame])

  // Clean up on unmount
  useEffect(() => () => stopCamera(), [stopCamera])

  return { videoRef, ready, error, facing, startCamera, stopCamera, flipCamera, captureFrame, captureBurst }
}
