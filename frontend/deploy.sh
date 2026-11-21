#!/bin/bash
set -e
cd /var/www/techomacecom/frontend
npm install
npm run build
if [ -f .next/standalone/server.js ]; then
  cp -r public .next/standalone/
  cp -r .next/static .next/standalone/.next/
  [ -f .env ] && cp .env .next/standalone/
fi
pm2 startOrRestart ecosystem.config.cjs
pm2 save
