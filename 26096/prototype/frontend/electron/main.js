const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

const API_URL = 'http://localhost:8000';

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    kiosk: true,
    kioskPrinting: false,
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('app-ready');
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('api:chat', async (event, { message }) => {
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        `${API_URL}/api/chat`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } },
        (res) => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error('Invalid JSON')); }
          });
        }
      );
      req.on('error', reject);
      req.write(JSON.stringify({ message }));
      req.end();
    });
    return response;
  } catch (error) {
    return { error: true, message: 'Backend unavailable. Please try again later.' };
  }
});

ipcMain.handle('api:health', async () => {
  try {
    const response = await new Promise((resolve, reject) => {
      http.get(`${API_URL}/api/health`, (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(error); } });
      }).on('error', reject);
    });
    return response;
  } catch {
    return { status: 'offline' };
  }
});
