const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you want to expose to the renderer process
  platform: process.platform,
  
  // License management
  getLicenseInfo: () => ipcRenderer.invoke('get-license-info'),
  
  // App management
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File operations (if needed)
  saveFile: (data) => ipcRenderer.invoke('save-file', data),
  loadFile: () => ipcRenderer.invoke('load-file')
});