// db.js — MySQL connection pool using mysql2/promise
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillswap',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Initialize DB and verify connection on startup
async function testConnection() {
  try {
    // Step 1: Ensure database and tables exist (handles fresh XAMPP installations)
    const initConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    await initConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await initConn.query(`USE \`${dbConfig.database}\`;`);

    // Create tables if not exists
    await initConn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        department VARCHAR(100),
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await initConn.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('teach','learn') NOT NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    await initConn.query(`
      CREATE TABLE IF NOT EXISTS interests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_user INT NOT NULL,
        to_user INT NOT NULL,
        skill_id INT NOT NULL,
        message TEXT,
        status ENUM('pending','accepted','declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );
    `);

    await initConn.end();

    // Step 2: Test pool connection
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();

    console.log('Database connected and schema verified successfully.');
  } catch (err) {
    console.error('\n======================================================');
    console.error('DATABASE CONNECTION ERROR:');
    console.error(err.message);
    console.error('Make sure MySQL is running in your XAMPP Control Panel.');
    console.error('Default: Host=localhost, Port=3306, User=root, No Password');
    console.error('======================================================\n');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
