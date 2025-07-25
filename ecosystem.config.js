module.exports = {
  apps: [{
    name: 'flip-forge',
    script: 'pnpm',
    args: 'start',
    cwd: './services/flip-forge',
    env: {
      NODE_ENV: 'production',
      PORT: 4002
    },
    max_memory_restart: '500M',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: './logs/flip-forge-error.log',
    out_file: './logs/flip-forge-out.log',
    log_file: './logs/flip-forge.log',
    time: true
  }]
} 