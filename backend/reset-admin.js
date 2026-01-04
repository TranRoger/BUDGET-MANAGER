require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function resetAdminUser() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to database');
    
    // Delete existing admin user
    console.log('Deleting existing admin user...');
    await client.query("DELETE FROM users WHERE email = 'admin@budget.com'");
    
    // Hash password (using sync version to avoid hanging)
    console.log('Hashing password...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    console.log('Hash generated successfully');
    
    // Insert new admin user
    console.log('Creating new admin user...');
    const result = await client.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role`,
      ['admin@budget.com', hashedPassword, 'Admin User', 'admin']
    );
    
    console.log('✅ Admin user created successfully:');
    console.log(result.rows[0]);
    console.log('\n📧 Email: admin@budget.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAdminUser();
