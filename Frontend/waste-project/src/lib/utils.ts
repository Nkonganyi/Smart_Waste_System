import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function compressImage(file: File, maxSizeMB = 10): Promise<File> {
  const imageBitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const maxDimension = Math.max(imageBitmap.width, imageBitmap.height)
  const scale = maxDimension > 1200 ? 1200 / maxDimension : 1
  canvas.width = Math.round(imageBitmap.width * scale)
  canvas.height = Math.round(imageBitmap.height * scale)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Unable to get canvas rendering context')
  }

  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)

  let quality = 0.92
  let blob: Blob | null = null

  while (quality > 0.4) {
    blob = await new Promise((resolve) => canvas.toBlob(resolve, file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg', quality))
    if (!blob) break
    const sizeMB = blob.size / 1024 / 1024
    if (sizeMB <= maxSizeMB) {
      break
    }
    quality -= 0.12
  }

  if (!blob) {
    throw new Error('Image compression failed')
  }

  return new File([blob], file.name, { type: blob.type })
}
