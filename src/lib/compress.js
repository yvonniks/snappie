// Resize a blob to maxPx on the longest side, export as JPEG at given quality.
// Keeps photos well under 1MB while maintaining good visual quality.
export function compressImage(blob, maxPx = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      const scale = Math.min(1, maxPx / Math.max(w, h))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        out => out ? resolve(out) : reject(new Error('Compression failed')),
        'image/jpeg',
        quality
      )
    }
    img.onerror = reject
    img.src = url
  })
}
