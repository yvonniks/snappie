// Wraps gif.js to encode an array of canvas frames into an animated GIF blob
// gif.js worker must be available at /gif.worker.js (copied to public/)

export function encodeBurstToGif(frames, { width = 400, height = 400, delay = 120 } = {}) {
  return new Promise((resolve, reject) => {
    // Dynamically import gif.js
    import('gif.js').then(({ default: GIF }) => {
      const gif = new GIF({
        workers: 2,
        quality: 8,
        width,
        height,
        workerScript: '/gif.worker.js',
      })

      frames.forEach(canvas => {
        gif.addFrame(canvas, { delay, copy: true })
      })

      gif.on('finished', blob => resolve(blob))
      gif.on('error',    err  => reject(err))
      gif.render()
    }).catch(reject)
  })
}

// Draw a video frame onto a canvas and return the canvas
export function frameFromVideo(videoEl, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  // Mirror for selfie feel
  ctx.save()
  ctx.scale(-1, 1)
  ctx.drawImage(videoEl, -width, 0, width, height)
  ctx.restore()
  return canvas
}
