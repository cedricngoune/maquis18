import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import './load-env';

/**
 * Runs once before all test files:
 * recreates the test database (maquis18_test) and applies every migration.
 * Prisma creates the database if it does not exist yet.
 */
export default function globalSetup(): void {
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (!databaseUrl.includes('_test')) {
    throw new Error(`Refus de lancer les tests sur une base qui n'est pas une base de test : ${databaseUrl}`);
  }

  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
