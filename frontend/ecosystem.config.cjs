const fs = require("fs");
const path = require("path");

const root = __dirname;
const standalone = fs.existsSync(path.join(root, ".next/standalone/server.js"));

module.exports = {
  apps: [
    {
      name: "buydenmed-frontend",
      cwd: standalone ? path.join(root, ".next/standalone") : root,
      script: standalone ? "server.js" : "node_modules/next/dist/bin/next",
      args: standalone ? "" : "start -H 127.0.0.1 -p 33000",
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 33000,
        HOSTNAME: "127.0.0.1"
      }
    }
  ]
};
