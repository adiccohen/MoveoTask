const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",           // Replace with your PostgreSQL username
  host: "localhost",          // Replace with cloud host if using a service
  database: "MoveoTaskDB", // Replace with your database name
  password: "Mta159753!",   // Replace with your password
  port: 5432,                  // Default PostgreSQL port
});

module.exports = pool;