import ffmpeg from 'fluent-ffmpeg'
import sharp from 'sharp'
import stream from 'stream'
import path from 'path'
import { app } from 'electron'

// Resolver ruta de ffmpeg correctamente
const ffmpegPath: string = app.isPackaged
  ? path.join(
      process.resourcesPath,
      process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    )
  : require('ffmpeg-static')

ffmpeg.setFfmpegPath(ffmpegPath)

/**
 * Extrae un thumbnail del segundo 1 del video
 * y lo devuelve como base64
 */
export async function extractThumbnailBase64(
  videoPath: string
): Promise<string> {
  const pass = new stream.PassThrough()

await new Promise<void>((resolve, reject) => {
  ffmpeg(videoPath)
    .format('image2')
    .frames(1)
    .seekInput(1)
    .outputOptions('-vframes 1')
    .on('error', reject)
    .on('end', () => resolve()) // ✅ FIX
    .pipe(pass, { end: true })
})

  const chunks: Buffer[] = []
  for await (const chunk of pass) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  const inputBuffer = Buffer.concat(chunks)

  const buffer = await sharp(inputBuffer)
    .resize(320, 180, { fit: 'cover' })
    .jpeg({ quality: 60 })
    .toBuffer()

  return `data:image/jpeg;base64,${buffer.toString('base64')}`
}

/**
 * Formatea duración en segundos a mm:ss
 */
export const formatDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
