const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const os = require('os');
const crypto = require('crypto');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;

// License management
class LicenseManager {
  constructor() {
    this.licenseFile = path.join(app.getPath('userData'), 'license.key');
    this.trialFile = path.join(app.getPath('userData'), 'trial.dat');
  }

  getHardwareFingerprint() {
    const cpuInfo = os.cpus()[0].model;
    const totalMem = os.totalmem();
    const platform = os.platform();
    const hostname = os.hostname();
    
    const fingerprint = crypto
      .createHash('sha256')
      .update(cpuInfo + totalMem + platform + hostname)
      .digest('hex');
    
    return fingerprint;
  }

  async checkTrialStatus() {
    if (!fs.existsSync(this.trialFile)) {
      // First run - create trial file
      const trialData = {
        startDate: Date.now(),
        hardwareFingerprint: this.getHardwareFingerprint(),
        trialDays: 14
      };
      
      fs.writeFileSync(this.trialFile, JSON.stringify(trialData));
      return { isValid: true, daysRemaining: 14, isTrial: true };
    }

    try {
      const trialData = JSON.parse(fs.readFileSync(this.trialFile, 'utf8'));
      const currentFingerprint = this.getHardwareFingerprint();
      
      // Check if hardware fingerprint matches (prevent trial reset)
      if (trialData.hardwareFingerprint !== currentFingerprint) {
        return { isValid: false, daysRemaining: 0, isTrial: true, error: 'Hardware mismatch' };
      }

      const daysElapsed = Math.floor((Date.now() - trialData.startDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = trialData.trialDays - daysElapsed;

      return {
        isValid: daysRemaining > 0,
        daysRemaining: Math.max(0, daysRemaining),
        isTrial: true
      };
    } catch (error) {
      return { isValid: false, daysRemaining: 0, isTrial: true, error: 'Corrupted trial data' };
    }
  }

  async checkLicense() {
    // First check if we have a valid license
    if (fs.existsSync(this.licenseFile)) {
      try {
        const licenseData = JSON.parse(fs.readFileSync(this.licenseFile, 'utf8'));
        // TODO: Implement proper license validation
        return { isValid: true, isLicensed: true };
      } catch (error) {
        // If license is corrupted, fall back to trial
      }
    }

    // No license found, check trial
    return await this.checkTrialStatus();
  }
}

const licenseManager = new LicenseManager();

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Add your app icon
    show: false // Don't show until ready
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Check license status on startup
    licenseManager.checkLicense().then(licenseStatus => {
      mainWindow.webContents.send('license-status', licenseStatus);
    });
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (backendProcess) {
      backendProcess.kill();
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function startBackendServer() {
  if (isDev) {
    // In development, assume backend is running separately
    console.log('Development mode: Backend should be running on port 8001');
    return;
  }

  // In production, start embedded backend
  const backendPath = path.join(__dirname, '../backend');
  const pythonExecutable = process.platform === 'win32' ? 'python.exe' : 'python3';
  
  backendProcess = spawn(pythonExecutable, ['server.py'], {
    cwd: backendPath,
    env: { ...process.env, ELECTRON_MODE: 'true' }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

// App event handlers
app.whenReady().then(() => {
  startBackendServer();
  
  // Wait a moment for backend to start, then create window
  setTimeout(() => {
    createWindow();
  }, isDev ? 500 : 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC Handlers
ipcMain.handle('get-license-status', async () => {
  return await licenseManager.checkLicense();
});

ipcMain.handle('show-license-dialog', async () => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'DataGuard Pro License',
    message: 'Enter your license key to unlock full features',
    detail: 'Your trial period will expire soon. Purchase a license to continue using DataGuard Pro.',
    buttons: ['Enter License Key', 'Purchase License', 'Continue Trial'],
    defaultId: 0,
    cancelId: 2
  });

  switch (result.response) {
    case 0:
      // Show license key input dialog
      return { action: 'enter-key' };
    case 1:
      // Open purchase page
      shell.openExternal('https://dataguardpro.com/purchase');
      return { action: 'purchase' };
    default:
      return { action: 'continue' };
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: os.release()
  };
});

// Auto-updater (for production builds)
if (!isDev) {
  const { autoUpdater } = require('electron-updater');
  
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version of DataGuard Pro is available. It will be downloaded in the background.',
      buttons: ['OK']
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}