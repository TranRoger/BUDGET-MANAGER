# Contributing to Budget Manager

Thank you for your interest in contributing to Budget Manager! This document provides guidelines and instructions for contributing.

## Development Setup

Please refer to [SETUP.md](SETUP.md) for detailed setup instructions.

## Project Structure

```
BUDGET-MANAGER/
├── backend/           # Node.js/Express API server
├── frontend/          # React TypeScript application
├── database/          # PostgreSQL schemas and migrations
├── ai-service/        # AI service configurations
├── credentials/       # Google Cloud credentials (git-ignored)
└── docker-compose.yml # Docker orchestration
```

## Development Workflow

### 1. Fork and Clone

```bash
git fork https://github.com/yourusername/budget-manager
git clone https://github.com/yourusername/budget-manager
cd budget-manager
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Make Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation as needed

### 4. Test Your Changes

#### Backend Tests
```bash
cd backend
npm test
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### 5. Commit Your Changes

Use clear, descriptive commit messages:

```bash
git add .
git commit -m "feat: add transaction filtering by date range"
# or
git commit -m "fix: resolve budget calculation issue"
```

#### Commit Message Convention

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new frontend code
- Use ES6+ features
- Use async/await instead of callbacks
- Use meaningful variable and function names
- Keep functions small and focused

```typescript
// Good
async function fetchUserTransactions(userId: number): Promise<Transaction[]> {
  const response = await api.get(`/users/${userId}/transactions`);
  return response.data;
}

// Avoid
function gut(u) {
  return api.get(`/users/${u}/transactions`).then(r => r.data);
}
```

### React Components

- Use functional components with hooks
- Keep components focused and reusable
- Use TypeScript interfaces for props

```typescript
interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onEdit, 
  onDelete 
}) => {
  // Component logic
};
```

### Backend API

- Use async/await
- Implement proper error handling
- Validate all inputs
- Use middleware for authentication

```javascript
// Good
router.post('/transactions', authenticate, async (req, res) => {
  try {
    const { amount, type, category_id } = req.body;
    
    // Validation
    if (!amount || !type || !category_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const transaction = await createTransaction(req.userId, req.body);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

## Database Changes

### Creating Migrations

1. Create a new SQL file in `database/migrations/`
2. Name it with timestamp: `YYYYMMDD_description.sql`
3. Include both UP and DOWN migrations

```sql
-- UP
CREATE TABLE new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- DOWN
DROP TABLE new_table;
```

## Testing

### Writing Tests

- Write tests for new features
- Update tests when changing existing code
- Aim for good test coverage

#### Backend Test Example

```javascript
describe('Transaction Service', () => {
  it('should create a new transaction', async () => {
    const data = {
      amount: 100,
      type: 'expense',
      category_id: 1
    };
    
    const transaction = await transactionService.create(userId, data);
    
    expect(transaction).toHaveProperty('id');
    expect(transaction.amount).toBe(100);
  });
});
```

#### Frontend Test Example

```typescript
describe('TransactionList', () => {
  it('renders transaction items', () => {
    const transactions = [
      { id: 1, amount: 100, type: 'expense' }
    ];
    
    render(<TransactionList transactions={transactions} />);
    
    expect(screen.getByText('$100')).toBeInTheDocument();
  });
});
```

## Documentation

- Update README.md if adding new features
- Add JSDoc comments for functions
- Update API.md for API changes
- Include examples in documentation

```typescript
/**
 * Fetches all transactions for a user with optional filters
 * @param userId - The user's ID
 * @param filters - Optional filters (date range, category, type)
 * @returns Promise<Transaction[]>
 */
async function getTransactions(
  userId: number, 
  filters?: TransactionFilters
): Promise<Transaction[]> {
  // Implementation
}
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] Commits are clean and well-described

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Screenshots (if applicable)

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes
```

## Review Process

1. Submit PR with clear description
2. Wait for automated tests to pass
3. Respond to review comments
4. Make requested changes
5. PR will be merged once approved

## Getting Help

- Create an issue for bugs or feature requests
- Ask questions in discussions
- Check existing issues and documentation first

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on the code, not the person

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to Budget Manager! 🎉
