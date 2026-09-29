import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

const databaseUrl = process.env['DATABASE_URL_UNPOOLED'] || process.env['DIRECT_DATABASE_URL'] || process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL_UNPOOLED is not set. Configure the Neon direct connection string for Prisma CLI verification.');
}

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: databaseUrl,
    },
  }),
});
