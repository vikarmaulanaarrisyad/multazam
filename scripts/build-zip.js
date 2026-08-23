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

// Copy static to .next/static
fs.mkdirSync(path.dirname(staticTarget), { recursive: true });
if (fs.existsSync(staticSource)) {
  fs.cpSync(staticSource, staticTarget, { recursive: true });
}

// ALSO Copy static to public/_next/static to bypass Apache dot-directory (.next) 403 Forbidden blocks on cPanel/LiteSpeed
const publicNextStaticTarget = path.join(standalonePath, 'public', '_next', 'static');
fs.mkdirSync(path.dirname(publicNextStaticTarget), { recursive: true });
if (fs.existsSync(staticSource)) {
  fs.cpSync(staticSource, publicNextStaticTarget, { recursive: true });
}

// Copy prisma folder and config for server prisma support
const prismaSource = path.join(__dirname, '..', 'prisma');
const prismaTarget = path.join(standalonePath, 'prisma');
if (fs.existsSync(prismaSource)) {
  fs.cpSync(prismaSource, prismaTarget, { recursive: true });
}

const prismaConfigSource = path.join(__dirname, '..', 'prisma.config.ts');
const prismaConfigTarget = path.join(standalonePath, 'prisma.config.ts');
if (fs.existsSync(prismaConfigSource)) {
  fs.copyFileSync(prismaConfigSource, prismaConfigTarget);
}

// Copy generated prisma client folder (src/generated/prisma) so standalone build has client code
const generatedPrismaSource = path.join(__dirname, '..', 'src', 'generated', 'prisma');
const generatedPrismaTarget = path.join(standalonePath, 'src', 'generated', 'prisma');
if (fs.existsSync(generatedPrismaSource)) {
  fs.mkdirSync(path.dirname(generatedPrismaTarget), { recursive: true });
  fs.cpSync(generatedPrismaSource, generatedPrismaTarget, { recursive: true });
  console.log('✅ Copied src/generated/prisma to standalone build');
}

// Copy @prisma and .prisma modules to standalone node_modules
const atPrismaSource = path.join(__dirname, '..', 'node_modules', '@prisma');
const atPrismaTarget = path.join(standalonePath, 'node_modules', '@prisma');
if (fs.existsSync(atPrismaSource)) {
  fs.mkdirSync(path.dirname(atPrismaTarget), { recursive: true });
  fs.cpSync(atPrismaSource, atPrismaTarget, { recursive: true });
  console.log('✅ Copied node_modules/@prisma to standalone build');
}

const dotPrismaSource = path.join(__dirname, '..', 'node_modules', '.prisma');
const dotPrismaTarget = path.join(standalonePath, 'node_modules', '.prisma');
if (fs.existsSync(dotPrismaSource)) {
  fs.mkdirSync(path.dirname(dotPrismaTarget), { recursive: true });
  fs.cpSync(dotPrismaSource, dotPrismaTarget, { recursive: true });
  console.log('✅ Copied node_modules/.prisma to standalone build');
}

// Clean up any .env files from standalone folder so env variables can be set manually on hosting
const envFiles = ['.env', '.env.production', '.env.local', '.env.development'];
envFiles.forEach((file) => {
  const filePath = path.join(standalonePath, file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
});

// Duplicate server.js as app.js to overwrite cPanel default sample file
const serverJsPath = path.join(standalonePath, 'server.js');
const appJsPath = path.join(standalonePath, 'app.js');
if (fs.existsSync(serverJsPath)) {
  fs.copyFileSync(serverJsPath, appJsPath);
}

// Remove any standalone .htaccess so deploy.zip never overwrites cPanel's native Passenger .htaccess config
const htaccessPath = path.join(standalonePath, '.htaccess');
if (fs.existsSync(htaccessPath)) {
  fs.unlinkSync(htaccessPath);
}

console.log('🤐 3. Creating deploy.zip archive...');
const zipOutput = path.join(__dirname, '..', 'deploy.zip');

if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

try {
  // Use Get-ChildItem -Force with PowerShell to include hidden dot-folders (.next) and dot-files (.env.production)
  const psCmd = `powershell -Command "Get-ChildItem -Path '${standalonePath}' -Force | Compress-Archive -DestinationPath '${zipOutput}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  console.log('\n✅ SUCCESS: deploy.zip created successfully in project root WITHOUT .env files (Ready for manual .env setup on hosting)!');
  console.log('👉 Upload deploy.zip to DomaiNesia File Manager, extract it, and add your .env.production manually on hosting.');
} catch (err) {
  console.error('Error compressing with PowerShell:', err.message);
}
