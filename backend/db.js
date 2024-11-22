const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",           // Replace with your PostgreSQL username
  host: "autorack.proxy.rlwy.net",          // Replace with cloud host if using a service
  database: "railway", // Replace with your database name
  password: "DEIxBjZAAWMqQySAWyZKSaSbudoShNuY",   // Replace with your password
  port: 38532,                  // Default PostgreSQL port
});

module.exports = pool;


