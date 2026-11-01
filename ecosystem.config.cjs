/**
 * Woobi - PM2 Production Process Management Configuration
 * Troyz Solutions - Monorepo Runtime Architecture
 */

module.exports = {
  apps: [
    {
      name: 'woobi-backend',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
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
