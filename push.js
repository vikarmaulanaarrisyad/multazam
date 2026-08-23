const fs = require('fs');
const cp = require('child_process');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (match && match[1]) {
  const dbUrl = match[1].replace('6543', '5432').replace('pgbouncer=true', 'pgbouncer=false');
  console.log('🚀 Pushing schema to database...');
  try {
    cp.execSync('npx prisma db push', {
      env: Object.assign({}, process.env, { DATABASE_URL: dbUrl, DIRECT_URL: dbUrl }),
      stdio: 'inherit'
    });
    console.log('✅ Schema pushed successfully!');
  } catch (e) {
    console.error('Failed to push schema:', e.message);
  }
} else {
  console.log('DATABASE_URL not found in .env file');
}
