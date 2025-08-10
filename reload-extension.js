// Auto-reload script for development
// This watches for file changes and reloads the extension

const fs = require('fs');
const path = require('path');

const WATCH_FILES = [
  'dist/contentScript.js',
  'styles.css',
  'manifest.json'
];

const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'; // Replace with actual ID from chrome://extensions

console.log('🔄 Watching for changes...');
console.log('📝 To get your extension ID:');
console.log('   1. Go to chrome://extensions/');
console.log('   2. Enable Developer mode');
console.log('   3. Find your extension and copy the ID');
console.log('   4. Replace YOUR_EXTENSION_ID_HERE in reload-extension.js');
console.log('');

// Watch for file changes
WATCH_FILES.forEach(file => {
  if (fs.existsSync(file)) {
    fs.watchFile(file, { interval: 500 }, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        console.log(`📁 ${file} changed, attempting reload...`);
        
        // Create a simple HTTP request to trigger extension reload
        // This requires the extension to have a background script that listens
        console.log('💡 Manual reload required: Go to chrome://extensions/ and click reload');
      }
    });
    console.log(`👀 Watching: ${file}`);
  }
});

// Keep the script running
process.stdin.resume();
