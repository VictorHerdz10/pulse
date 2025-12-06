import { ipcMain, dialog, BrowserWindow } from 'electron';
import { parseFile } from 'music-metadata';
import path from 'path';
import fs from "fs"
import http from 'http';
import url from 'url';
import { extractThumbnailBase64, formatDuration } from '../lib/utils';


export const toFileUrl = (localPath: string) =>
  `file://${localPath.replace(/\\/g, '/')}`;

export const registerMusicHandlers = (mainWindow: BrowserWindow) => {
  // Lightweight audio server (on localhost) to serve audio files with Range support
  let audioServer: http.Server | null = null;
  let audioServerPort = 0;

  const ensureAudioServer = async (): Promise<number> => {
    if (audioServer && audioServerPort > 0) return audioServerPort;

    audioServer = http.createServer((req, res) => {
      if (!req.url) return res.end();
      const parsed = url.parse(req.url, true);
      if (parsed.pathname !== '/audio') {
        res.statusCode = 404;
        return res.end('Not found');
      }

      const fileParam = parsed.query.file as string | undefined;
      if (!fileParam) {
        res.statusCode = 400;
        return res.end('Missing file param');
      }

      // decode once (fileParam is expected to be encodeURIComponent(filePath))
      const filePath = decodeURIComponent(fileParam);
      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        return res.end('File not found');
      }

      const stat = fs.statSync(filePath);
      const total = stat.size;
      const range = req.headers.range;
      const ext = path.extname(filePath).replace('.', '').toLowerCase();
      const mime = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        aac: 'audio/aac',
        m4a: 'audio/mp4',
        mp4: 'video/mp4',
        m4v: 'video/mp4',
        webm: 'video/webm',
        mov: 'video/quicktime',
        mkv: 'video/x-matroska',
      }[ext] || 'application/octet-stream';

      // Allow cross-origin requests for the local stream (renderer requests)
      res.setHeader('Access-Control-Allow-Origin', '*');
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024 * 5, total - 1);
        if (isNaN(start) || isNaN(end)) {
          res.statusCode = 416; // Range Not Satisfiable
          return res.end();
        }

        const chunksize = (end - start) + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${total}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': mime,
        });
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': total,
          'Content-Type': mime,
          'Accept-Ranges': 'bytes',
        });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      }
    });

    // Wait until server is listening so we can return the real port
    await new Promise<void>((resolve, reject) => {
      audioServer!.listen(0, '127.0.0.1');
      audioServer!.once('listening', () => {
        const addr = audioServer!.address();
        if (addr && typeof addr === 'object') audioServerPort = addr.port;
        console.log('Audio server listening on port', audioServerPort);
        resolve();
      });
      audioServer!.once('error', (err) => {
        reject(err);
      });
    });
    audioServer.on('error', (err) => console.error('Audio server error', err));

    return audioServerPort;
  };
  // Manejador para abrir el diálogo de selección de archivos
  ipcMain.handle('dialog:openFile', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Audio/Video', extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'aiff', 'mp4', 'm4v', 'webm', 'mov', 'mkv', 'avi'] }
        ]
      });

      if (result.canceled) {
        return [];
      }

      return result.filePaths;
    } catch (error) {
      console.error('Error al abrir el diálogo:', error);
      return [];
    }
  });

  // Manejador para procesar la metadata de los archivos
  ipcMain.handle('music:processMetadata', async (event, filePaths: string[]) => {
    try {
      const songsMetadata = await Promise.all(
        filePaths.map(async (filePath: string) => {
          try {
            const isVideo = ['mp4', 'm4v', 'webm', 'mov', 'mkv'].includes(path.extname(filePath).replace('.', '').toLowerCase())
            const metadata = await parseFile(filePath);
            
            // Extraer la imagen si existe
            let coverUrl: string | undefined;
            if (metadata.common.picture && metadata.common.picture.length > 0) {
              const picture = metadata.common.picture[0];
              // Usamos Buffer.from para convertir el array de bytes a base64
              const base64String = Buffer.from(picture.data).toString('base64');
              coverUrl = `data:${picture.format};base64,${base64String}`;
            }

            if (isVideo && !coverUrl) {
              // Para videos, intentar extraer un thumbnail si no hay cover
              try {
                coverUrl = await extractThumbnailBase64(filePath);
              } catch (thumbError) {
                // Solo loguear silenciosamente, no mostrar error al usuario
                console.warn(`No se pudo extraer thumbnail del video ${filePath}:`, thumbError instanceof Error ? thumbError.message : 'Error desconocido');
                // Continuar sin thumbnail
              }
            }

            return {
              title: metadata.common.title || path.basename(filePath),
              artist: metadata.common.artist || 'Desconocido',
              album: metadata.common.album || 'Desconocido',
              duration: formatDuration(metadata.format.duration || 0),
              durationRaw: metadata.format.duration || 0, // Mantener la duración original en segundos
              coverUrl,
              // Flag to indicate this file is a video container (helps renderer)
              isVideo,
              filePath
            };
          } catch (error) {
            // Loguear solo en consola del servidor, no mostrar al usuario
            console.warn(`No se pudo procesar ${filePath}:`, error instanceof Error ? error.message : 'Error desconocido');
            return {
              title: path.basename(filePath),
              artist: 'Desconocido',
              album: 'Desconocido',
              duration: '0:00',
              durationRaw: 0,
              filePath
            };
          }
        })
      );

      return songsMetadata;
    } catch (error) {
      console.warn('Error al procesar los archivos de música:', error instanceof Error ? error.message : 'Error desconocido');
      return [];
    }
  });


  ipcMain.handle('get-audio-data', async (event, filePath: string) => {
    try {
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const ext = filePath.split('.').pop()?.toLowerCase();
            const mime = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        aac: 'audio/aac',
        m4a: 'audio/mp4',
        mp4: 'video/mp4',
        m4v: 'video/mp4',
        webm: 'video/webm',
        mov: 'video/quicktime',
        mkv: 'video/x-matroska',
      }[ext || ''] || 'application/octet-stream';

      return `data:${mime};base64,${base64}`;
    } catch (err) {
      console.error('Error al leer archivo:', err);
      return null;
    }
  });

  // Return a streaming URL that can be used by the renderer to stream the local file.
  ipcMain.handle('get-audio-stream-url', async (event, filePath: string) => {
    try {
      if (!filePath || !fs.existsSync(filePath)) return null;
      const port = await ensureAudioServer();
      // encodeURIComponent to safely transport localPath in URL
      const encoded = encodeURIComponent(filePath);
      return `http://127.0.0.1:${port}/audio?file=${encoded}`;
    } catch (err) {
      console.error('Error creating audio stream URL:', err);
      return null;
    }
  });

};


