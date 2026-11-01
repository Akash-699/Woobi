/**
 * Woobi - PM2 Production Process Management Configuration
 * Troyz Solutions - Monorepo Runtime Architecture
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Single-Instance Writer Architecture (instances: 1, exec_mode: 'fork'):
 *    The Woobi backend utilizes a local-first JSON file storage engine (DatabaseService)
 *    with OS directory locks (.oslock) and temporary-file atomic swaps.
 *    PM2 multi-worker cluster mode (instances: 'max') is strictly PROHIBITED for this
 *    storage engine, as concurrent worker processes will race on in-memory caches and
 *    file replacements.
 * 2. To horizontally scale across multi-worker clusters or multiple nodes, the storage
 *    layer must first be migrated to a true client-server transactional database
 *    (e.g., PostgreSQL or SQLite with WAL mode).
 */

module.exports = {
  apps: [
    {
      name: 'woobi-backend',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      combine_logs: true,
      kill_timeout: 5000,
      listen_timeout: 8000,
      restart_delay: 2000
    }
  ]
};
