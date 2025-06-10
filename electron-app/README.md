# Status Checker Desktop App

A cross-platform desktop application built with Electron, React, and FastAPI.

## Features

- ✅ **14-day free trial** with automatic license management
- ✅ **Complete privacy** - all data stored locally
- ✅ **Cross-platform** - Windows and Mac installers
- ✅ **Local SQLite database** - no external dependencies
- ✅ **Real-time status checking** with client management
- ✅ **Modern UI** built with React and Tailwind CSS

## Development

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

3. Start development mode:
```bash
npm run dev
```

## Building Installers

### Build for Windows
```bash
npm run build
npm run dist:win
```

### Build for Mac
```bash
npm run build
npm run dist:mac
```

### Build for both platforms
```bash
npm run build
npm run dist
```

## Trial License System

- **Duration**: 14 days from first launch
- **Storage**: License info stored in user's home directory (`~/.status-checker-app/`)
- **Notifications**: Users are notified when trial period is close to expiring
- **Privacy**: All license tracking happens locally - no external calls

## Data Storage

- **Database**: SQLite (stored in `~/.status-checker-app/app.db`)
- **Privacy**: All data remains on user's device
- **Backup**: Users can manually backup the `.status-checker-app` folder

## File Structure

```
electron-app/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # Preload script for security
│   ├── App.js           # React frontend
│   └── App.css          # Styles
├── backend/
│   ├── server.py        # FastAPI backend
│   └── requirements.txt # Python dependencies
├── scripts/
│   ├── build.js         # Build automation
│   └── dev.js           # Development server
└── assets/              # App icons and resources
```

## Distribution

The built installers will be available in the `dist/` folder:
- Windows: `Status Checker Setup.exe`
- Mac: `Status Checker.dmg`

## License

This is a trial version with a 14-day evaluation period.