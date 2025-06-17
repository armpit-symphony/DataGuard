const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

// Check if running in development
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev, // Disable web security in dev mode
      allowRunningInsecureContent: isDev
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#111827',
    icon: getIconPath()
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Load the application
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  console.log('Loading URL:', startUrl);
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

function getIconPath() {
  // Return appropriate icon path based on platform
  if (process.platform === 'win32') {
    return path.join(__dirname, 'assets', 'icon.ico');
  } else if (process.platform === 'darwin') {
    return path.join(__dirname, 'assets', 'icon.icns');
  } else {
    return path.join(__dirname, 'assets', 'icon.png');
  }
}

function startBackendServer() {
  console.log('Starting backend server...');
  
  let backendPath;
  let nodePath;
  
  if (isDev) {
    // Development mode - use local backend
    backendPath = path.join(__dirname, '../../backend/server_nodejs.js');
    nodePath = 'node';
  } else {
    // Production mode - use bundled backend
    backendPath = path.join(process.resourcesPath, 'backend', 'server_nodejs.js');
    
    // Try to find Node.js executable
    const possibleNodePaths = [
      path.join(process.resourcesPath, 'node', 'node'),
      path.join(process.resourcesPath, 'node', 'node.exe'),
      'node'
    ];
    
    nodePath = possibleNodePaths.find(p => {
      try {
        return fs.existsSync(p) || p === 'node';
      } catch {
        return false;
      }
    }) || 'node';
  }
  
  console.log('Backend path:', backendPath);
  console.log('Node path:', nodePath);
  
  // Check if backend file exists
  if (!fs.existsSync(backendPath)) {
    console.error('Backend file not found at:', backendPath);
    return;
  }
  
  // Spawn the backend process
  backendProcess = spawn(nodePath, [backendPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: '8001'
    }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    backendProcess = null;
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend process:', error);
    
    // Show error dialog to user
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Backend Error', 
      `Failed to start DataGuard Pro backend server:\n\n${error.message}\n\nPlease try restarting the application.`
    );
  });
  
  // Give backend time to start
  setTimeout(() => {
    console.log('Backend should be running on http://127.0.0.1:8001');
  }, 3000);
}

function stopBackendServer() {
  if (backendProcess) {
    console.log('Stopping backend server...');
    backendProcess.kill('SIGTERM');
    
    // Force kill after 5 seconds if it doesn't stop gracefully
    setTimeout(() => {
      if (backendProcess) {
        console.log('Force killing backend process...');
        backendProcess.kill('SIGKILL');
        backendProcess = null;
      }
    }, 5000);
  }
}

// App event handlers
app.whenReady().then(() => {
  console.log('Electron app is ready');
  console.log('Environment:', isDev ? 'development' : 'production');
  console.log('App version:', app.getVersion());
  
  startBackendServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  stopBackendServer();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  console.log('App is quitting...');
  stopBackendServer();
});

app.on('will-quit', (event) => {
  console.log('App will quit...');
  stopBackendServer();
});

// Handle certificate errors in development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    // In development, ignore certificate errors
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    console.log('Blocked new window creation to:', url);
    shell.openExternal(url);
  });
  
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.origin !== 'http://127.0.0.1:3000' && 
        parsedUrl.origin !== 'http://localhost:3000' &&
        !url.startsWith('file://')) {
      event.preventDefault();
      console.log('Blocked navigation to:', url);
    }
  });
});

// Set app user model ID for Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('com.dataguardpro.app');
}

console.log('DataGuard Pro Electron main process started');
console.log('Process arguments:', process.argv);
console.log('Working directory:', process.cwd());
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));