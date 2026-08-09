require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log('Connected to DB');

  await client.query('DELETE FROM "Visit"');
  console.log('Visits deleted successfully via pg');

  await client.end();
}

main().catch(console.error);
