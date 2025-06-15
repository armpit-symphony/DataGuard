# DataGuard Pro - Privacy-Focused Desktop Application

DataGuard Pro is a desktop application built with Electron that prioritizes user privacy by running entirely on your local device. No data is transmitted to external servers.

## Features

- **Complete Privacy**: All data processing happens locally on your device
- **Desktop Native**: Cross-platform desktop application for Windows, macOS, and Linux
- **Local Database**: Uses SQLite for local data storage
- **Status Monitoring**: Track client status checks and system health
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Offline Functionality**: Works completely offline without internet connection

## Quick Start

### For Development

1. **Install Dependencies**
   ```bash
   cd frontend
   yarn install
   ```

2. **Start Development Mode**
   ```bash
   # Start the web version (for development)
   yarn start
   
   # Or start the Electron desktop app
   yarn electron-dev
   ```

### For Production

1. **Build the Application**
   ```bash
   cd frontend
   yarn build
   ```

2. **Run Desktop Application**
   ```bash
   yarn electron
   ```

3. **Package for Distribution**
   ```bash
   # For current platform
   yarn dist
   
   # For specific platforms
   yarn dist-win    # Windows
   yarn dist-mac    # macOS
   yarn dist-linux  # Linux
   ```

## Architecture

### Frontend (React + Electron)
- **React 19**: Modern React with hooks and context
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication

### Backend (FastAPI + SQLite)
- **FastAPI**: Modern Python web framework
- **SQLite**: Lightweight, file-based database
- **Pydantic**: Data validation and serialization
- **Async Support**: Full async/await support

### Desktop Integration (Electron)
- **Electron 30+**: Latest Electron framework
- **Security**: Context isolation and secure preload scripts
- **Cross-platform**: Windows, macOS, and Linux support
- **Auto-updater ready**: Prepared for automatic updates

## Privacy Features

✅ **Local Data Processing** - All computations happen on your device  
✅ **No External Connections** - No data sent to external servers  
✅ **Encrypted Local Storage** - Data is securely stored locally  
✅ **Offline Functionality** - Works without internet connection  
✅ **Open Source** - Full transparency in code and functionality  

## Project Structure

```
dataguardpro/
├── frontend/                 # React frontend + Electron
│   ├── src/                 # React source code
│   │   ├── components/      # React components
│   │   ├── App.js          # Main App component
│   │   └── index.js        # React entry point
│   ├── electron/           # Electron main process
│   │   ├── main.js         # Electron main process
│   │   └── preload.js      # Preload script
│   ├── build/              # Production build
│   └── package.json        # Frontend dependencies
├── backend/                # FastAPI backend
│   ├── server.py          # Original server (MongoDB)
│   ├── server_desktop.py  # Desktop server (SQLite)
│   ├── dataguard.db       # SQLite database (created automatically)
│   └── requirements.txt   # Python dependencies
└── README.md              # This file
```

## Available Scripts

### Frontend Scripts
- `yarn start` - Start React development server
- `yarn build` - Build React app for production
- `yarn electron` - Run Electron app (production mode)
- `yarn electron-dev` - Run Electron app (development mode)
- `yarn dist` - Package app for distribution
- `yarn test` - Run tests

### Backend Scripts
- `python server_desktop.py` - Run desktop backend server
- `uvicorn server:app --reload` - Run original backend server

## API Endpoints

### Status Check API
- `GET /api/` - Health check endpoint
- `GET /api/status` - Get all status checks
- `POST /api/status` - Create new status check

### Example API Usage

```javascript
// Create a status check
const response = await fetch('http://localhost:8001/api/status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ client_name: 'Test Client' })
});

// Get all status checks
const statusChecks = await fetch('http://localhost:8001/api/status')
  .then(res => res.json());
```

## Security Considerations

1. **Context Isolation**: Electron renderer processes are isolated from Node.js
2. **Preload Scripts**: Secure communication between main and renderer processes
3. **CSP Headers**: Content Security Policy headers prevent XSS attacks
4. **No Remote Code**: All code is bundled and verified locally
5. **Local Database**: SQLite database with no external connections

## Development

### Prerequisites
- Node.js 16+ and Yarn
- Python 3.8+ and pip
- Git

### Setting up Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dataguardpro
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   yarn install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   cd backend
   python server_desktop.py
   
   # Terminal 2: Start frontend
   cd frontend
   yarn electron-dev
   ```

## Building for Distribution

### Prerequisites
- All development prerequisites
- Platform-specific build tools:
  - **Windows**: Visual Studio Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Standard build tools (gcc, make)

### Build Commands

```bash
cd frontend

# Build for current platform
yarn dist

# Build for all platforms (requires appropriate OS)
yarn dist-win
yarn dist-mac
yarn dist-linux
```

Built applications will be in the `frontend/dist` directory.

## Troubleshooting

### Common Issues

1. **Electron app won't start**
   - Check if backend server is running on port 8001
   - Verify all dependencies are installed
   - Check console for error messages

2. **Backend connection failed**
   - Ensure SQLite database is created
   - Check if port 8001 is available
   - Verify Python dependencies are installed

3. **Build fails**
   - Clear node_modules and reinstall: `rm -rf node_modules && yarn install`
   - Update dependencies: `yarn upgrade`
   - Check Node.js version compatibility

### Logs and Debugging

- **Electron main process**: Check terminal output
- **Electron renderer**: Open DevTools (Ctrl+Shift+I)
- **Backend**: Check server console output
- **Database**: SQLite database is stored in `backend/dataguard.db`

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information

---

**DataGuard Pro** - Your privacy, your data, your device.
