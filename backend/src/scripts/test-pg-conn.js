// Simple script to test PostgreSQL connectivity using the DATABASE_URL from .env
// Usage: node src/scripts/test-pg-conn.js (run from backend directory or from project root)
const dotenv = require('dotenv');
dotenv.config();
const { Client } = require('pg');

const conn = process.env.DATABASE_URL;
console.log('DATABASE_URL present:', !!conn);
if (!conn) {
  console.error('No DATABASE_URL found in environment');
  process.exit(2);
}

const client = new Client({ connectionString: conn });

client.connect()
  .then(() => {
    console.log('Connected to database successfully');
    return client.end();
  })
  .catch((err) => {
    console.error('Connection error:');
    console.error(err);
    // print some useful fields if present
    if (err.code) console.error('Error code:', err.code);
    if (err.message) console.error('Error message:', err.message);
    process.exit(1);
  });
