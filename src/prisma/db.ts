import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { existsSync, readFileSync } from 'node:fs';
import type { Contract } from './contract.d';

const contractCandidates = [
  new URL('./contract.json', import.meta.url),
  new URL('../../src/prisma/contract.json', import.meta.url),
];

const contractPath = contractCandidates.find((candidate) =>
  existsSync(candidate),
) ?? contractCandidates[0];

const contractJson: Contract = JSON.parse(
  readFileSync(contractPath, 'utf8'),
);

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Configure the Neon pooled URL for runtime and DATABASE_URL_UNPOOLED for Prisma CLI verification.');
}

export const db = postgres<Contract>({
  contractJson,
  url: databaseUrl,
});
