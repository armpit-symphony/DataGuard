const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let backendProcess;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready-to-show
    backgroundColor: '#111827' // Dark theme background
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus the window
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function startBackendServer() {
  if (isDev) {
    // In development, assume backend is running via supervisor
    console.log('Development mode: Backend should be running on supervisor');
    return;
  }

  // In production, start the desktop backend server
  const backendPath = path.join(__dirname, '../../backend');
  const pythonExecutable = process.platform === 'win32' ? 'python.exe' : 'python3';
  
  backendProcess = spawn(pythonExecutable, ['server_desktop.py'], {
    cwd: backendPath,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend process:', error);
  });
}

function stopBackendServer() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// IPC handlers for the preload script
ipcMain.handle('get-version', () => {
  return app.getVersion();
});

ipcMain.handle('minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  startBackendServer();
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  stopBackendServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    console.log('Blocked new window creation to:', navigationUrl);
  });
});

// Handle app protocol for deep linking (optional)
app.setAsDefaultProtocolClient('dataguardpro');