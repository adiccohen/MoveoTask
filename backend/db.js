// db.js
const { Pool } = require('pg');

// Get database connection details from environment variables
const pool = new Pool({
  user: process.env.PG_USER, // PostgreSQL username
  host: process.env.PG_HOST, // PostgreSQL host URL
  database: process.env.PG_DATABASE, // PostgreSQL database name
  password: process.env.PG_PASSWORD, // PostgreSQL password
  port: process.env.PG_PORT || 5432, // PostgreSQL port (default is 5432)
});

module.exports = pool;