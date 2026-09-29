module.exports = {
  apps: [
    {
      name: "decorjoy-api",
      script: "server.js",
      instances: 2,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "decorjoy-worker",
      script: "worker.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
