/**
 * PM2 Ecosystem Configuration
 *
 * Production process management for AdStack WebSocket Server
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'adstack-websocket',
      script: './dist/index.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3002,
        LOG_LEVEL: 'debug',
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
        LOG_LEVEL: 'info',
      },

      // Monitoring
      watch: false, // Disable in production
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Restart policies
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      restart_delay: 4000,

      // Memory management
      max_memory_restart: '1G',

      // Advanced features
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,

      // Metrics
      instance_var: 'INSTANCE_ID',

      // Health check
      health_check: {
        enabled: true,
        endpoint: 'http://localhost:3002/health',
        interval: 30000, // 30 seconds
        timeout: 5000,
      },
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server-1.adstack.io', 'production-server-2.adstack.io'],
      ref: 'origin/main',
      repo: 'git@github.com:adstack/adstack.git',
      path: '/var/www/adstack-websocket',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'git config --global core.sshCommand "ssh -i ~/.ssh/deploy_key"',
    },

    staging: {
      user: 'deploy',
      host: 'staging-server.adstack.io',
      ref: 'origin/develop',
      repo: 'git@github.com:adstack/adstack.git',
      path: '/var/www/adstack-websocket-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js',
    },
  },
};
