const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

class StatusCheckerApp {
  constructor() {
    this.mainWindow = null;
    this.backendProcess = null;
    this.licenseManager = new LicenseManager();
  }

  async createWindow() {
    // Check license first
    const licenseStatus = await this.licenseManager.checkLicense();
    
    if (!licenseStatus.valid) {
      const response = await dialog.showMessageBox({
        type: 'warning',
        title: 'Trial Expired',
        message: licenseStatus.message,
        buttons: ['Exit', 'Continue Trial'],
        defaultId: 0
      });
      
      if (response.response === 0) {
        app.quit();
        return;
      }
    }

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: 'default',
      show: false
    });

    // Start backend first
    await this.startBackend();
    
    // Load frontend
    const isDev = process.argv.includes('--dev');
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../frontend-build/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Show license info
      if (licenseStatus.daysLeft <= 7) {
        this.showLicenseNotification(licenseStatus.daysLeft);
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  async startBackend() {
    return new Promise((resolve, reject) => {
      const isDev = process.argv.includes('--dev');
      const backendPath = isDev 
        ? path.join(__dirname, '../../backend')
        : path.join(process.resourcesPath, 'backend');
      
      const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
      
      this.backendProcess = spawn(pythonExecutable, ['server.py'], {
        cwd: backendPath,
        env: {
          ...process.env,
          SQLITE_DB_PATH: path.join(this.getDataDir(), 'app.db'),
          PORT: '8002'
        }
      });

      this.backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
      });

      this.backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
      });

      this.backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
      });

      // Wait for backend to start
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  getDataDir() {
    const dataDir = path.join(os.homedir(), '.status-checker-app');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
  }

  showLicenseNotification(daysLeft) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Trial Period',
      message: `Your trial period expires in ${daysLeft} day(s).`,
      buttons: ['OK']
    });
  }
}

class LicenseManager {
  constructor() {
    this.licenseFile = path.join(os.homedir(), '.status-checker-app', 'license.json');
  }

  async checkLicense() {
    try {
      if (!fs.existsSync(this.licenseFile)) {
        return this.createNewLicense();
      }

      const licenseData = JSON.parse(fs.readFileSync(this.licenseFile, 'utf8'));
      const now = new Date();
      const expiryDate = new Date(licenseData.expiry);
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        return {
          valid: false,
          message: 'Your 14-day trial has expired. Please contact support for a full license.',
          daysLeft: 0
        };
      }

      return {
        valid: true,
        message: `Trial period: ${daysLeft} days remaining`,
        daysLeft: daysLeft
      };
    } catch (error) {
      console.error('License check error:', error);
      return this.createNewLicense();
    }
  }

  createNewLicense() {
    const now = new Date();
    const expiry = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days

    const licenseData = {
      created: now.toISOString(),
      expiry: expiry.toISOString(),
      version: '1.0.0'
    };

    // Ensure directory exists
    const dir = path.dirname(this.licenseFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.licenseFile, JSON.stringify(licenseData, null, 2));

    return {
      valid: true,
      message: 'Welcome! Your 14-day trial has started.',
      daysLeft: 14
    };
  }
}

const statusApp = new StatusCheckerApp();

app.whenReady().then(() => {
  statusApp.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      statusApp.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (statusApp.backendProcess) {
    statusApp.backendProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (statusApp.backendProcess) {
    statusApp.backendProcess.kill();
  }
});