import * as fs from 'fs';
import * as path from 'path';
import { query, queryOne } from './database';
import { logger } from './logger';

const MIGRATIONS_DIR = path.resolve(__dirname, '../db/migrations');

async function ensureMigrationsTable(): Promise<void> {
  await query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    []
  );
}

async function getExecutedMigrations(): Promise<string[]> {
  const rows = await query(
    'SELECT filename FROM schema_migrations ORDER BY filename ASC',
    []
  );
  return rows.rows.map((r: any) => r.filename);
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    logger.warn(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

export async function runMigrations(): Promise<{ executed: string[]; skipped: string[] }> {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter((f) => !executed.includes(f));

  const result = { executed: [] as string[], skipped: executed };

  if (pending.length === 0) {
    logger.info('No pending migrations');
    return result;
  }

  logger.info(`Running ${pending.length} pending migration(s)...`);

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    logger.info(`Executing migration: ${file}`);

    try {
      await query('BEGIN', []);
      await query(sql, []);
      await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await query('COMMIT', []);
      result.executed.push(file);
      logger.info(`Migration completed: ${file}`);
    } catch (error) {
      await query('ROLLBACK', []);
      logger.error(`Migration failed: ${file}`, error);
      throw error;
    }
  }

  logger.info(`Executed ${result.executed.length} migration(s)`);
  return result;
}

export async function getMigrationStatus(): Promise<{
  executed: string[];
  pending: string[];
  total: number;
}> {
  await ensureMigrationsTable();

  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter((f) => !executed.includes(f));

  return { executed, pending, total: files.length };
}
