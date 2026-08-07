const cp = require('child_process');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const newDbUrl = dbUrl.replace('6543', '5432');
  console.log('Running with DIRECT_URL');
  cp.execSync('npx prisma db push --accept-data-loss --schema=prisma/schema.prisma', { 
    env: Object.assign({}, process.env, { DATABASE_URL: newDbUrl }), 
    stdio: 'inherit' 
  });
} else {
  console.log('No DATABASE_URL found');
}
