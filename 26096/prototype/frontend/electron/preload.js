const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  chat: (message) => ipcRenderer.invoke('api:chat', { message }),
  health: () => ipcRenderer.invoke('api:health'),
  onReady: (callback) => ipcRenderer.on('app-ready', callback),
});
