const bcrypt = require('bcrypt');
const db = require('./config/database');

async function updateAdminPassword() {
  try {
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('Hash generated:', hashedPassword.substring(0, 20) + '...');
    
    console.log('Updating admin user password...');
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email, name, role',
      [hashedPassword, 'admin@budget.com']
    );
    
    if (result.rows.length > 0) {
      console.log('Password updated successfully for:', result.rows[0]);
    } else {
      console.log('No admin user found with email admin@budget.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAdminPassword();
