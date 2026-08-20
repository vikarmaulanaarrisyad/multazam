const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 1. Building Next.js application in PRODUCTION mode using .env.production...');
execSync('npm run build', { 
  stdio: 'inherit',
  env: Object.assign({}, process.env, { NODE_ENV: 'production' })
});

console.log('📦 2. Copying static assets to standalone folder...');
const standalonePath = path.join(__dirname, '..', '.next', 'standalone');
const publicSource = path.join(__dirname, '..', 'public');
const publicTarget = path.join(standalonePath, 'public');

const staticSource = path.join(__dirname, '..', '.next', 'static');
const staticTarget = path.join(standalonePath, '.next', 'static');

// Copy public
if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, publicTarget, { recursive: true });
}

// Copy static
fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
if (fs.existsSync(staticSource)) {
  fs.cpSync(staticSource, staticTarget, { recursive: true });
}

console.log('🤐 3. Creating deploy.zip archive...');
const zipOutput = path.join(__dirname, '..', 'deploy.zip');

if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

try {
  // Try PowerShell Compress-Archive on Windows
  execSync(`powershell -Command "Compress-Archive -Path '${standalonePath}\\*' -DestinationPath '${zipOutput}' -Force"`, { stdio: 'inherit' });
  console.log('\n✅ SUCCESS: deploy.zip created successfully in project root with .env.production!');
  console.log('👉 Upload deploy.zip to DomaiNesia File Manager and extract it.');
} catch (err) {
  console.error('Error compressing with PowerShell:', err.message);
}
