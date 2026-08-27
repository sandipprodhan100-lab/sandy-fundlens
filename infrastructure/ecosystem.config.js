module.exports = {
  apps: [
    {
      name: "fundlens-backend",
      cwd: "./backend-fastapi",
      script: "python3",
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PYTHONPATH: ".",
        NODE_ENV: "production"
      }
    },
    {
      name: "fundlens-frontend",
      cwd: "./frontend-node",
      script: "node",
      args: ".output/server/index.mjs",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: 3000,
        NODE_ENV: "production"
      }
    }
  ]
};
