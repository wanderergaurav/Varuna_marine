import { Pool, PoolConfig } from 'pg';
import { databaseConfig } from '../../shared/config';

const buildPoolConfig = (): PoolConfig => {
  if (databaseConfig.connectionString) {
    return { connectionString: databaseConfig.connectionString };
  }

  return {
    host: databaseConfig.host ?? 'localhost',
    port: databaseConfig.port ?? 5432,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    ssl: databaseConfig.ssl ? { rejectUnauthorized: false } : undefined
  };
};

export const createPostgresPool = (): Pool => {
  const pool = new Pool(buildPoolConfig());
  pool.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('Unexpected Postgres error', error);
  });
  return pool;
};

