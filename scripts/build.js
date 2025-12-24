const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function main() {
    const rootDir = path.resolve(__dirname, '..');
    const srcDir = path.join(rootDir, 'src');
    const distDir = path.join(rootDir, 'dist');

    // 1. Clean / Convert Typescript (Assumes tsc run before or handled via npm script, but usually we run checks here)
    // For now, we assume 'tsc' is run separately via 'npm run build:ts' or included in 'npm run build'

    // 2. Copy Assets
    console.log('Copying assets...');
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(distDir, 'index.html'));
    fs.copyFileSync(path.join(srcDir, 'style.css'), path.join(distDir, 'style.css'));

    copyDir(path.join(srcDir, 'print/templates'), path.join(distDir, 'print/templates'));
    copyDir(path.join(srcDir, 'assets'), path.join(distDir, 'assets'));

    // 3. Fix Renderer (Remove Object.defineProperty(exports...))
    console.log('Fixing renderer.js...');
    const rendererPath = path.join(distDir, 'renderer.js');
    if (fs.existsSync(rendererPath)) {
        let content = fs.readFileSync(rendererPath, 'utf8');
        // Remove the line causing issues in Electron renderer with nodeIntegration
        content = content.replace(/Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/g, '');
        fs.writeFileSync(rendererPath, content);
    }

    console.log('Build preparation complete.');
}

main();
