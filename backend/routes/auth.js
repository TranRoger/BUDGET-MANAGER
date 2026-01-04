const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // Changed from bcrypt to bcryptjs
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Admin middleware
const requireAdmin = asyncHandler(async (req, res, next) => {
  const result = await db.query(
    'SELECT role FROM users WHERE id = $1',
    [req.userId]
  );
  
  if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ admin mới có quyền truy cập' });
  }
  
  next();
});

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  validateRequest
];

// Login
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  console.log('===== LOGIN REQUEST START =====');
  console.log('Body:', req.body);
  
  const { email, password } = req.body;
  console.log('Email:', email);

  // Find user
  console.log('Querying database for user...');
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  console.log('Query result rows:', result.rows.length);
  
  if (result.rows.length === 0) {
    console.log('User not found');
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = result.rows[0];
  console.log('User found:', user.email, 'Role:', user.role);

  // Check password
  console.log('Comparing password...');
  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Password match:', isMatch);
  
  if (!isMatch) {
    console.log('Password mismatch');
    throw new UnauthorizedError('Invalid credentials');
  }

  // Create JWT token
  console.log('Creating JWT token...');
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  console.log('Token created');

  console.log('Sending response...');
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    }
  });
  console.log('===== LOGIN REQUEST END =====');
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [req.userId]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('User not found');
  }

  res.json({ user: result.rows[0] });
}));

// Admin: Create new user
router.post('/admin/users', authenticate, requireAdmin, createUserValidation, asyncHandler(async (req, res) => {
  const { email, password, name, role = 'user' } = req.body;

  // Check if user exists
  const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (userExists.rows.length > 0) {
    throw new ConflictError('Email đã tồn tại');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const result = await db.query(
    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
    [email, hashedPassword, name, role]
  );

  res.status(201).json({
    success: true,
    user: result.rows[0]
  });
}));

// Admin: Get all users
router.get('/admin/users', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users: result.rows });
}));

// Admin: Update user
router.put('/admin/users/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, name, role, password } = req.body;

  let query = 'UPDATE users SET ';
  const values = [];
  const updates = [];
  let paramCount = 1;

  if (email) {
    updates.push(`email = $${paramCount}`);
    values.push(email);
    paramCount++;
  }

  if (name) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (role && ['user', 'admin'].includes(role)) {
    updates.push(`role = $${paramCount}`);
    values.push(role);
    paramCount++;
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updates.push(`password = $${paramCount}`);
    values.push(hashedPassword);
    paramCount++;
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'Không có gì để cập nhật' });
  }

  query += updates.join(', ');
  query += ` WHERE id = $${paramCount} RETURNING id, email, name, role, created_at`;
  values.push(id);

  const result = await db.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  }

  res.json({ success: true, user: result.rows[0] });
}));

// Admin: Delete user
router.delete('/admin/users/:id', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent deleting self
  if (parseInt(id) === req.userId) {
    return res.status(400).json({ message: 'Không thể xóa tài khoản của chính mình' });
  }

  const result = await db.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  }

  res.json({ success: true, message: 'Đã xóa người dùng' });
}));

module.exports = router;
