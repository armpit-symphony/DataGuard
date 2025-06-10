# Building Windows and Mac Installers

## Prerequisites

### For Windows Builds (from any OS):
- Node.js 16+ 
- Python 3.8+
- Wine (if building on Linux/Mac)

### For Mac Builds:
- **Must build on macOS** (Apple's licensing requirements)
- Node.js 16+
- Xcode command line tools
- Apple Developer ID (for code signing - optional for beta)

## Quick Build Commands

### 1. Install Dependencies
```bash
cd electron-app
npm install
cd backend && pip install -r requirements.txt
```

### 2. Build for Current Platform
```bash
npm run pack
```

### 3. Build Installers

**Windows Installer (.exe):**
```bash
npm run dist:win
```

**Mac Installer (.dmg):**
```bash
npm run dist:mac
```

**Both Platforms:**
```bash
npm run dist
```

## Output Files

After building, find your installers in the `dist/` folder:

- **Windows**: `Status Checker Setup.exe` (~150MB)
- **Mac**: `Status Checker.dmg` (~150MB)
- **Linux**: `Status Checker.AppImage` (~150MB)

## Cross-Platform Building

### Building Windows from Linux/Mac:
```bash
# Install Wine for Windows emulation (Linux only)
sudo apt-get install wine

# Build Windows installer
npm run dist:win
```

### Building Mac from Windows/Linux:
❌ **Not possible** - Apple requires macOS for .dmg/.pkg creation
✅ **Solution**: Use GitHub Actions or macOS cloud service

## Advanced Configuration

### Code Signing (Production)

#### Windows Code Signing:
1. Purchase code signing certificate (~$100-300/year)
2. Add to `package.json`:
```json
"win": {
  "certificateFile": "path/to/certificate.p12",
  "certificatePassword": "your-password"
}
```

#### Mac Code Signing:
1. Join Apple Developer Program ($99/year)
2. Add to `package.json`:
```json
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

### Custom Icons
Replace placeholder files in `assets/`:
- `icon.ico` (Windows) - 256x256px
- `icon.icns` (Mac) - 512x512px 
- `icon.png` (Linux) - 512x512px

## Testing the Built App

### Test Without Installing:
```bash
# Run the unpacked version
./dist/linux-arm64-unpacked/status-checker-app
```

### Test the Installer:
1. Install the .exe/.dmg file
2. Launch from Start Menu/Applications
3. Verify trial license (14 days)
4. Test all features work offline

## Troubleshooting

### Common Issues:

**"Python not found" error:**
```bash
# Ensure Python is in PATH
python3 --version
pip3 --version
```

**Build fails on missing dependencies:**
```bash
# Clean and reinstall
rm -rf node_modules dist
npm install
```

**Backend doesn't start:**
- Check port 8002 is available
- Verify SQLite database permissions
- Check logs in `~/.status-checker-app/`

### Platform-Specific Issues:

**Windows:**
- Install Visual Studio Build Tools if native dependencies fail
- Use PowerShell as administrator

**Mac:**
- Install Xcode command line tools: `xcode-select --install`
- Enable "App Store and identified developers" in Security settings

**Linux:**
- Install build essentials: `sudo apt-get install build-essential`

## Beta Testing Checklist

Before distributing to beta testers:

- [ ] Test installation on clean Windows/Mac machines
- [ ] Verify 14-day trial license works
- [ ] Test offline functionality
- [ ] Check data persistence across app restarts
- [ ] Verify uninstallation process
- [ ] Test on different OS versions (Windows 10/11, macOS 12+)

## Production Release

For production distribution:
1. Get code signing certificates
2. Set up auto-updater (optional)
3. Create download page with checksums
4. Consider notarization (Mac) and SmartScreen reputation (Windows)