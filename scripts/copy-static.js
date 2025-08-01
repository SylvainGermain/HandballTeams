const fs = require('fs');
const path = require('path');

// Create static directory if it doesn't exist
// replace '.' by any output folder
const staticDir = path.join(__dirname, '..', '.');
if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir);
}

// Copy files from dist to static
const distDir = path.join(__dirname, '..', 'dist');

// Get all files from dist directory
if (fs.existsSync(distDir)) {
    const allFiles = fs.readdirSync(distDir);

    allFiles.forEach(file => {
        const srcPath = path.join(distDir, file);
        const destPath = path.join(staticDir, file);

        // Only copy files, not directories
        if (fs.statSync(srcPath).isFile()) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`Copied ${file} to static folder`);
        }
    });
} else {
    console.log('Warning: dist folder not found. Please run build first.');
}

// Verify and fix the HTML file to ensure it properly references bundle.js
const htmlPath = path.join(staticDir, 'index.html');
if (fs.existsSync(htmlPath)) {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Check if bundle.js is already referenced
    if (!htmlContent.includes('bundle.js')) {
        console.log('Adding bundle.js reference to HTML file...');

        // Add CSS link if styles.css exists
        if (fs.existsSync(path.join(staticDir, 'styles.css')) && !htmlContent.includes('styles.css')) {
            htmlContent = htmlContent.replace(
                '</head>',
                '    <link rel="stylesheet" href="styles.css">\n</head>'
            );
        }

        // Add script tag before closing body tag
        htmlContent = htmlContent.replace(
            '</body>',
            '    <script src="bundle.js"></script>\n</body>'
        );

        fs.writeFileSync(htmlPath, htmlContent);
        console.log('Updated HTML file to reference bundle.js and styles.css');
    } else {
        console.log('HTML file already properly references bundle.js');
    }
}

console.log('Static files ready for deployment!');
console.log('You can serve the static folder using any web server.');
console.log('For example: cd static && python -m http.server 8080');