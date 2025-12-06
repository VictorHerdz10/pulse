import { ipcRenderer, contextBridge } from 'electron';
import { Song } from './types/music';



// Configurar el listener para mini-mode una sola vez
ipcRenderer.on('mini-mode', (_event, enable) => {
  window.dispatchEvent(new CustomEvent('mini-mode', { detail: enable }));
});

const electronHandler = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  closeApp: () => ipcRenderer.invoke('close-app'),
  minimizeApp: () => ipcRenderer.invoke('minimize-app'),
  maximizeApp: () => ipcRenderer.invoke('maximize-app'),
  setMiniMode: (enable: boolean) => ipcRenderer.invoke('set-mini-mode', enable),
  openFile: (): Promise<string[]> => ipcRenderer.invoke('dialog:openFile'),
  processMetadata: (filePaths: string[]): Promise<Song[]> => ipcRenderer.invoke('music:processMetadata', filePaths),
  getUserConfig: () => ipcRenderer.invoke('config:get'),
  setUserConfig: (config: any) => ipcRenderer.invoke('config:set', config),
  onConfigUpdated: (listener: (config: any) => void) => ipcRenderer.on('config:updated', (_e, cfg) => listener(cfg)),
  openConfigFolder: () => ipcRenderer.invoke('config:open-folder'),
  // Musica
  getAudioData: (filePath: string) => ipcRenderer.invoke('get-audio-data', filePath),
  getAudioStreamUrl: (filePath: string) => ipcRenderer.invoke('get-audio-stream-url', filePath)
};

contextBridge.exposeInMainWorld('electronAPI', electronHandler);