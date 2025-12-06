import {app, BrowserWindow, ipcMain, shell} from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createMainWindow } from './window/mainWindow';
import { registerWindowControls } from './handlers/windowControls';
import { registerMusicHandlers } from './handlers/musicHandlers';
import { registerConfigHandlers } from './handlers/configHandlers';
import electronSquirrelStartup from 'electron-squirrel-startup';


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
let mainWindow: BrowserWindow;
let userSettings: any = {};

const isDev = !app.isPackaged;
if (electronSquirrelStartup) {
  app.quit();
}

const initialize = () => {
  mainWindow = createMainWindow(isDev);
  registerWindowControls();
  registerMusicHandlers(mainWindow);
  registerConfigHandlers(mainWindow);
};


// config IPCs are handled by the configHandlers module


// This method will be called when Electron has finished initialization
app.on('ready', initialize);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize();
  }
});
