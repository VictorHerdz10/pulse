interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  closeApp: () => Promise<void>;
  minimizeApp: () => Promise<void>;
  maximizeApp: () => Promise<void>;
  openFile: () => Promise<string[]>;
  processMetadata: (filePaths: string[]) => Promise<Song[]>;
  getAudioData: (filePath: string) => Promise<string | null>;
  getAudioStreamUrl: (filePath: string) => Promise<string | null>;
  getUserConfig: () => Promise<any>;
  setUserConfig: (config: any) => Promise<any>;
  onConfigUpdated?: (listener: (config: any) => void) => void;
  openConfigFolder: () => Promise<any>;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;      // Duración formateada (MM:SS)
  durationRaw: number;   // Duración en segundos
  coverUrl?: string;
  filePath: string;
  isPlaying?: boolean;
}


declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
