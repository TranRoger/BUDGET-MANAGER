const express = require('express');
const bodyParser = require('body-parser');
const { registerValidation } = require('./middleware/validation');
const asyncHandler = require('./utils/asyncHandler');
const bcrypt = require('bcrypt');
const db = require('./config/database');
const { ConflictError } = require('./utils/errors');

const app = express();
app.use(bodyParser.json());

// Test route
app.post('/test-register', registerValidation, asyncHandler(async (req, res) => {
  console.log('Register handler called');
  console.log('Body:', req.body);
  
  const { email, password, name } = req.body;

  // Check if user exists
  console.log('Checking if user exists...');
  const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  console.log('User exists query result:', userExists.rows.length);
  
  if (userExists.rows.length > 0) {
    throw new ConflictError('User already exists');
  }

  // Hash password
  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Password hashed');

  // Create user
  console.log('Creating user...');
  const result = await db.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, hashedPassword, name]
  );
  console.log('User created:', result.rows[0]);

  res.status(201).json({ 
    success: true,
    user: result.rows[0] 
  });
}));

// Error handler
app.use((err, req, res, next) => {
  console.error('ERROR CAUGHT:');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message
  });
});

app.listen(5001, () => {
  console.log('Test server running on port 5001');
});
