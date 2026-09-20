// Prisma config for CLI: load env from backend/.env and export datasource at top-level
const dotenv = require('dotenv');
const path = require('path');

// Ensure we load the backend .env (this config file lives in backend/prisma)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
