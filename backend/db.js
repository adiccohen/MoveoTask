const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://postgres:YCoAcnLoFwRXGjlUuKPcTjlCRfmdbAnh@postgres.railway.internal:5432/railway",
  ssl: {
    rejectUnauthorized: false,  // Ensure SSL is enabled for secure connections
  }
});

module.exports = pool;