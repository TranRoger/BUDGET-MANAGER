// Authentication disabled - single user mode
// Always use user ID = 1

const authenticate = (req, res, next) => {
  // No authentication needed - default to user ID 1
  req.userId = 1;
  req.userEmail = 'user@budgetmanager.local';
  next();
};

module.exports = { authenticate };
