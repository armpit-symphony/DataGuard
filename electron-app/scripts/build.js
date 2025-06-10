const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Status Checker Desktop App...');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
if (fs.existsSync('frontend-build')) {
  fs.rmSync('frontend-build', { recursive: true, force: true });
}

// Build React frontend
console.log('⚛️  Building React frontend...');
try {
  execSync('npm run build', { 
    cwd: path.join(__dirname, '..'), 
    stdio: 'inherit' 
  });
  
  // Copy build to electron app
  execSync('cp -r build frontend-build', { 
    cwd: path.join(__dirname, '..'), 
    stdio: 'inherit' 
  });
  
  console.log('✅ Frontend build completed');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Copy backend files
console.log('🐍 Preparing backend files...');
try {
  if (!fs.existsSync('backend')) {
    fs.mkdirSync('backend', { recursive: true });
  }
  
  // Copy backend files (already done during bulk_file_writer)
  console.log('✅ Backend files prepared');
} catch (error) {
  console.error('❌ Backend preparation failed:', error.message);
  process.exit(1);
}

// Create app icons (placeholder)
console.log('🎨 Creating app icons...');
try {
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets', { recursive: true });
  }
  
  // Create placeholder icon files
  fs.writeFileSync('assets/icon.ico', ''); // Windows
  fs.writeFileSync('assets/icon.icns', ''); // Mac
  fs.writeFileSync('assets/icon.png', ''); // Linux
  
  console.log('✅ App icons created (placeholders)');
} catch (error) {
  console.error('❌ Icon creation failed:', error.message);
}

console.log('🎉 Build preparation completed!');
console.log('');
console.log('Next steps:');
console.log('1. Run: npm run dist:win (for Windows installer)');
console.log('2. Or: npm run dist:mac (for Mac installer)');
console.log('3. Or: npm run dist (for both platforms)');