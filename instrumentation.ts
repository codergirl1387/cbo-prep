export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('./src/lib/db/migrations');
    const { initScheduler } = await import('./src/lib/scheduler/cron');
    runMigrations();
    initScheduler();
  }
}
