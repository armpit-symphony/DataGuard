const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

// Simple development check without electron-is-dev
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    show: false,
    titleBarStyle: 'default',
    backgroundColor: '#111827'
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Always try localhost first (for development)
  const startUrl = 'http://localhost:3000';
  
  console.log('Loading URL:', startUrl);
  console.log('Is Development:', isDev);
  
  mainWindow.loadURL(startUrl).catch(err => {
    console.error('Failed to load URL:', err);
    // If localhost fails, try loading from build
    const buildPath = `file://${path.join(__dirname, '../build/index.html')}`;
    console.log('Trying build path:', buildPath);
    mainWindow.loadURL(buildPath);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  console.log('Electron app is ready');
  console.log('Process args:', process.argv);
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

console.log('Electron main process started - no external dependencies');