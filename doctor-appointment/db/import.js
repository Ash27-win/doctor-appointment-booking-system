const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from the server directory .env file
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function run() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3307', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'root';

  console.log(`Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let connection;
  try {
    // Connect without selecting a database first (since doctor_appointment does not exist yet)
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log('Connected to MySQL server successfully.');
  } catch (err) {
    console.error('Failed to connect to MySQL server:', err.message);
    console.error('Please verify that your database credentials in server/.env are correct.');
    process.exit(1);
  }

  try {
    const sqlFilePath = path.join(__dirname, 'schema.sql');
    console.log(`Reading SQL schema file from: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL queries by semicolon followed by a newline
    const statements = sql
      .split(/;(?:\r?\n|\n)/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL operations...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      // Skip commented lines or empty statements
      if (!stmt) continue;
      
      try {
        await connection.query(stmt);
      } catch (err) {
        console.error(`\nError executing Statement #${i + 1}:`);
        console.error(stmt);
        console.error(`Error message: ${err.message}`);
        process.exit(1);
      }
    }

    console.log('\nDatabase "doctor_appointment" created and 5 sample doctors seeded successfully!');
  } catch (err) {
    console.error('An error occurred during database import:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run().catch(console.error);
