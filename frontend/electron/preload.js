const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Example of secure API exposure
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // File operations (if needed later)
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // App controls
  minimize: () => ipcRenderer.invoke('minimize'),
  maximize: () => ipcRenderer.invoke('maximize'),
  close: () => ipcRenderer.invoke('close'),
});

// Expose a version of console that works in the main world
contextBridge.exposeInMainWorld('electronConsole', {
  log: (message) => console.log(message),
  error: (message) => console.error(message),
});