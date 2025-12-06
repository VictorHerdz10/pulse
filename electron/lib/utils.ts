import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';
import stream from 'stream';
import { promisify } from 'util';

const pipeline = promisify(stream.pipeline);
if (!ffmpegPath) {
  throw new Error('ffmpeg-static did not provide an ffmpeg path');
}
ffmpeg.setFfmpegPath(ffmpegPath);

// Función principal
export async function extractThumbnailBase64(videoPath: string): Promise<string> {
  const pass = new stream.PassThrough();

  // start ffmpeg and pipe its output into the PassThrough
  ffmpeg(videoPath)
    .format('image2') // formato de imagen
    .frames(1)        // solo un frame
    .seekInput(1)     // segundo 1
    .outputOptions('-vframes 1') // asegurar solo un frame
    .pipe(pass, { end: true });

  // collect the streamed image into a Buffer
  const chunks: Buffer[] = [];
  for await (const chunk of pass) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const inputBuffer = Buffer.concat(chunks);

  // Comprimir y convertir a base64 directamente
  const buffer = await sharp(inputBuffer)
    .resize(320, 180)
    .jpeg({ quality: 60 })
    .toBuffer();

  const base64 = buffer.toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64}`;
  return dataUri;
}

export const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};