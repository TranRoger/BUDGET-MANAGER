const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  validateRequest
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// Register
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  console.log('[AUTH] Register route hit');
  console.log('[AUTH] Body:', JSON.stringify(req.body));
  
  const { email, password, name } = req.body;
  console.log('[AUTH] Extracted fields:', { email, name, hasPassword: !!password });

  // Check if user exists
  console.log('[AUTH] Checking if user exists...');
  const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  console.log('[AUTH] User exists check complete, rows:', userExists.rows.length);
  
  if (userExists.rows.length > 0) {
    console.log('[AUTH] User already exists, throwing ConflictError');
    throw new ConflictError('User already exists');
  }

  // Hash password
  console.log('[AUTH] Hashing password...');
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('[AUTH] Password hashed');

  // Create user
  console.log('[AUTH] Creating user...');
  const result = await db.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
    [email, hashedPassword, name]
  );
  console.log('[AUTH] User created:', result.rows[0]);

  console.log('[AUTH] Sending response...');
  res.status(201).json({ 
    success: true,
    user: result.rows[0] 
  });
  console.log('[AUTH] Response sent');
}));

// Login
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = result.rows[0];

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Create JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
}));

module.exports = router;
