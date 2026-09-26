import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

const databaseUrl = process.env['DIRECT_DATABASE_URL'] || process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Set the direct Neon connection string in the environment.');
}

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: databaseUrl,
    },
  }),
});
