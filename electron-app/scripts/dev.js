const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Starting development mode...');

// Start React development server
console.log('⚛️  Starting React dev server...');
const reactProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit'
});

// Wait a bit for React to start, then launch Electron
setTimeout(() => {
  console.log('⚡ Starting Electron...');
  const electronProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  // Handle process cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    reactProcess.kill();
    electronProcess.kill();
    process.exit();
  });
}, 5000);