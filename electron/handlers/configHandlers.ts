import { ipcMain, shell, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';

export const registerConfigHandlers = (mainWindow: BrowserWindow) => {
  let userSettings: any = {};

  const loadUserSettings = async () => {
    const userDataPath = (await import('electron')).app.getPath('userData');
    const configPath = path.join(userDataPath, 'config');
    try {
      await fs.access(configPath);
    } catch {
      await fs.mkdir(configPath, { recursive: true });
    }

    const settingsFilePath = path.join(configPath, 'settings.json');
    try {
      await fs.access(settingsFilePath);
      const fileContent = await fs.readFile(settingsFilePath, 'utf-8');
      userSettings = JSON.parse(fileContent);
    } catch (err) {
      const defaultConfig = {
        welcomeMessage: 'Hola desde tu configuración personalizada!',
        autoPlay: false,
        theme: 'dark',
        accentColor: '#ff8a00',
        hardwareAcceleration: true,
        autoUpdate: true
      };
      try { await fs.writeFile(settingsFilePath, JSON.stringify(defaultConfig, null, 2)); } catch (e) { /**/ }
      userSettings = defaultConfig;
    }
  };

  // Initialize userSettings when handler is registered
  loadUserSettings();

  ipcMain.handle('config:get', async () => {
    return userSettings;
  });

  ipcMain.handle('config:set', async (event, newSettings: any) => {
    try {
      const userDataPath = (await import('electron')).app.getPath('userData');
      const configPath = path.join(userDataPath, 'config');
      const settingsFilePath = path.join(configPath, 'settings.json');

      userSettings = { ...userSettings, ...newSettings };
      await fs.writeFile(settingsFilePath, JSON.stringify(userSettings, null, 2));
      // Notify renderer windows about the new config
      try { mainWindow.webContents.send('config:updated', userSettings); } catch (e) { /* ignore */ }
      return userSettings;
    } catch (err) {
      console.error('Error writing config file:', err);
      throw err;
    }
  });

  ipcMain.handle('config:open-folder', async () => {
    const configPath = path.join((await import('electron')).app.getPath('userData'), 'config');
    shell.openPath(configPath);
  });
};

export default registerConfigHandlers;
