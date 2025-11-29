import { startServer } from './infrastructure/server/bootstrap-memory';

startServer().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
