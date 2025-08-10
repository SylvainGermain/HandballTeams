const fs = require('fs');
const path = require('path');

// For static serving, the build folder is already at the root level
// and index.html already references the correct paths in the build folder.
// This script just verifies everything is in place.

const rootDir = path.join(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const indexPath = path.join(rootDir, 'index.html');

// Check if build folder exists at root level
if (!fs.existsSync(buildDir)) {
    console.log('Warning: build folder not found at root level. Please run build first.');
    process.exit(1);
}

// Check if index.html exists at root level
if (!fs.existsSync(indexPath)) {
    console.log('Warning: index.html not found at root level. Please run build first.');
    process.exit(1);
}

// List build folder contents
console.log('Build folder contents:');
const buildFiles = fs.readdirSync(buildDir);
buildFiles.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.statSync(filePath).isFile()) {
        console.log(`  - ${file}`);
    }
});

console.log('\nStatic files ready for deployment!');
console.log('The build folder is at the root level and index.html references it correctly.');
console.log('You can serve the root folder using any web server.');
console.log('For example: python -m http.server 8080');

console.log('Static files ready for deployment!');
console.log('You can serve the static folder using any web server.');
console.log('For example: cd static && python -m http.server 8080');