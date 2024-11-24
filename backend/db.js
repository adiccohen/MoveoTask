const { Pool } = require("pg");
//conecting to mu postgresql database in the railway server
const pool = new Pool({
  user: "postgres",           
  host: "autorack.proxy.rlwy.net",         
  database: "railway", 
  password: "DEIxBjZAAWMqQySAWyZKSaSbudoShNuY",   
  port: 38532,                  
});

module.exports = pool;