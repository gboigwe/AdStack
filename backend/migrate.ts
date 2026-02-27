import { testConnection, closePool } from './lib/database';
import { runMigrations, getMigrationStatus } from './lib/migrator';
import { logger } from './lib/logger';

async function main() {
  const command = process.argv[2] || 'run';

  const connected = await testConnection();
  if (!connected) {
    logger.error('Failed to connect to database');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'run': {
        const result = await runMigrations();
        logger.info(`Migrations complete - executed: ${result.executed.length}, skipped: ${result.skipped.length}`);
        break;
      }
      case 'status': {
        const status = await getMigrationStatus();
        logger.info(`Total: ${status.total}, Executed: ${status.executed.length}, Pending: ${status.pending.length}`);
        if (status.pending.length > 0) {
          logger.info(`Pending: ${status.pending.join(', ')}`);
        }
        break;
      }
      default:
        logger.error(`Unknown command: ${command}. Use 'run' or 'status'.`);
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
