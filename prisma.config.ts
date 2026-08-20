import { config } from 'dotenv';

// Prioritize .env.production when building for production
if (process.env.NODE_ENV === 'production') {
  config({ path: '.env.production', override: true });
} else {
  config({ path: ['.env.production', '.env.development', '.env'] });
}

import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || process.env.DIRECT_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
})
