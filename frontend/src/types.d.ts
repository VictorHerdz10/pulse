// Extiende el tipo Window para exponer electronAPI y eventos personalizados
interface ElectronAPI {
  openConfigFolder(): void;
  getAudioData(filePath: string): Promise<string | null>;
  getAudioStreamUrl(filePath: string): Promise<string | null>;
  minimizeApp: () => Promise<void>;
  maximizeApp: () => Promise<void>;
  closeApp: () => Promise<void>;
  setMiniMode: (enable: boolean) => Promise<void>;
  openFile: () => Promise<string[]>;
  processMetadata: (filePaths: string[]) => Promise<Song[]>;
}

interface Window {
  electronAPI: ElectronAPI;
}
