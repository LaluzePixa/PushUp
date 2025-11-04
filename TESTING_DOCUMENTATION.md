# Jest Testing Setup Documentation

## Overview

This document describes the comprehensive Jest testing setup for the PushSaaS application, covering both frontend (Next.js) and backend (Node.js/Express) testing infrastructure.

## Project Structure

```
pushsaas/
├── server/
│   ├── jest.config.js          # Backend Jest configuration
│   ├── tests/
│   │   ├── setup.js            # Global test setup
│   │   ├── globalSetup.js      # Database setup
│   │   ├── factories/          # Test data factories
│   │   └── utils/              # Test utilities
│   └── __tests__/              # Backend test files
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── utils/
└── frontend/
    ├── jest.config.ts          # Frontend Jest configuration
    ├── tests/
    │   ├── setup.ts            # React Testing Library setup
    │   └── __mocks__/          # Frontend mocks
    └── __tests__/              # Frontend test files
        ├── components/
        ├── contexts/
        ├── hooks/
        ├── services/
        └── pages/
```

## Backend Testing (Server)

### Configuration

**File: `server/jest.config.js`**
- Environment: Node.js
- Test database: PostgreSQL (test environment)
- Mocks: web-push, external APIs
- Global setup: Database migration and seeding

### Test Categories

1. **Middleware Tests** (`__tests__/middleware/`)
   - Authentication middleware
   - Authorization checks
   - Error handling
   - Request validation

2. **Route Tests** (`__tests__/routes/`)
   - Authentication endpoints
   - Sites management
   - Campaigns CRUD
   - Users management
   - Push notifications
   - Segments management

3. **Service Tests** (`__tests__/services/`)
   - Campaign scheduler
   - Push notification service
   - Database operations
   - External API integrations

4. **Utility Tests** (`__tests__/utils/`)
   - Pagination helpers
   - Validation functions
   - Data transformers

### Test Utilities

**Test Database Setup:**
```javascript
// tests/globalSetup.js
- Creates test database
- Runs migrations
- Seeds initial data
- Configures environment variables
```

**Test Factories:**
```javascript
// tests/factories/
- User factory
- Site factory
- Campaign factory
- Subscription factory
```

**Authentication Helpers:**
```javascript
// tests/utils/auth.js
- Generate test JWT tokens
- Create authenticated requests
- Mock user sessions
```

### Example Test Structure

```javascript
describe('Auth Routes', () => {
  beforeEach(() => {
    // Setup test data
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Test implementation
    });
    
    it('should reject invalid credentials', async () => {
      // Test implementation
    });
  });
});
```

## Frontend Testing (React/Next.js)

### Configuration

**File: `frontend/jest.config.ts`**
- Environment: jsdom
- Framework: React Testing Library
- Module mapping: TypeScript paths
- Mocks: Next.js router, API clients

### Test Categories

1. **Component Tests** (`__tests__/components/`)
   - Login/Register components
   - Dashboard components
   - Site selector
   - Campaign forms
   - UI components

2. **Context Tests** (`__tests__/contexts/`)
   - AuthContext
   - SiteContext
   - Theme provider
   - State management

3. **Hook Tests** (`__tests__/hooks/`)
   - usePushNotifications
   - Custom hooks
   - API hooks
   - Form hooks

4. **Service Tests** (`__tests__/services/`)
   - API client
   - Authentication service
   - Data fetching
   - Error handling

5. **Page Tests** (`__tests__/pages/`)
   - Login page
   - Dashboard page
   - Site selection
   - Campaign management

### Test Utilities

**React Testing Setup:**
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
// Global test configuration
```

**Component Wrappers:**
```typescript
// Provider wrappers for testing
const renderWithProviders = (component) => {
  return render(
    <AuthProvider>
      <SiteProvider>
        {component}
      </SiteProvider>
    </AuthProvider>
  );
};
```

**Mock Factories:**
```typescript
// Mock user data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  role: 'user',
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z'
};
```

### Example Test Structure

```typescript
describe('LoginComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form elements', () => {
    render(<LoginComponent />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    // Test implementation
  });
});
```

## Test Files Created

### Backend Tests

1. **`auth.middleware.test.js`**
   - JWT token validation
   - Password hashing
   - Authorization middleware
   - Error handling

2. **`auth.routes.test.js`**
   - User registration
   - User login
   - Password change
   - Profile updates

3. **`sites.routes.test.js`**
   - Site CRUD operations
   - Site pagination
   - Authorization checks
   - Subscription management

4. **`campaigns.routes.test.js`**
   - Campaign creation
   - Campaign scheduling
   - Push notification sending
   - Action buttons
   - Validation

### Frontend Tests

1. **`LoginComponent.test.tsx`**
   - Form rendering
   - Validation
   - Submission
   - Error handling
   - Loading states

2. **`AuthContext.test.tsx`**
   - Authentication state
   - Login/logout flow
   - Token management
   - User persistence

3. **`api-client.test.ts`**
   - HTTP methods
   - Token handling
   - Error responses
   - Public endpoints

4. **`usePushNotifications.test.ts`**
   - Permission requests
   - Subscription management
   - Browser compatibility
   - Error states

5. **`select-site.test.tsx`**
   - Site listing
   - Site selection
   - Navigation
   - Loading states

## Running Tests

### Backend Tests

```bash
# Run all backend tests
cd server
npm test

# Run specific test file
npm test -- auth.routes.test.js

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend
npm test

# Run specific test
npm test -- LoginComponent.test.tsx

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Coverage Goals

- **Minimum Coverage**: 70% for all metrics
- **Target Areas**:
  - Authentication flows: 90%+
  - API endpoints: 85%+
  - Core components: 80%+
  - Business logic: 90%+

## Mock Strategy

### Backend Mocks
- **Database**: Test database with migrations
- **External APIs**: Web-push service, VAPID
- **Environment**: Test-specific configuration

### Frontend Mocks
- **Next.js Router**: Navigation mocking
- **API Calls**: Service layer mocking
- **Browser APIs**: Notification, ServiceWorker
- **LocalStorage**: Window object mocking

## Best Practices

1. **Test Structure**
   - Use describe blocks for grouping
   - Clear, descriptive test names
   - One assertion per test when possible

2. **Setup/Teardown**
   - Clean state between tests
   - Use beforeEach for common setup
   - Clear mocks after each test

3. **Assertions**
   - Use specific matchers
   - Test user interactions
   - Verify side effects

4. **Mocking**
   - Mock at the boundary
   - Keep mocks simple
   - Reset mocks between tests

## CI/CD Integration

```yaml
# GitHub Actions example
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Module Resolution**
   - Check TypeScript paths
   - Verify Jest moduleNameMapping
   - Ensure babel configuration

2. **Async Tests**
   - Use waitFor for async operations
   - Properly await user interactions
   - Handle promise rejections

3. **Mocking Issues**
   - Clear mocks between tests
   - Use proper mock implementations
   - Verify mock call order

4. **Environment Issues**
   - Check test database connection
   - Verify environment variables
   - Ensure proper cleanup

## Next Steps

1. **Database Testing Setup**
   - Configure test database
   - Create migration scripts
   - Add data seeding

2. **CI/CD Integration**
   - Add test scripts
   - Configure coverage reporting
   - Set up automated testing

3. **Advanced Testing**
   - End-to-end tests
   - Performance tests
   - Integration tests

4. **Documentation**
   - Test writing guidelines
   - Mock strategy documentation
   - Troubleshooting guides

## Dependencies

### Backend
- `jest` - Testing framework
- `supertest` - HTTP testing
- `@jest/globals` - Jest globals

### Frontend
- `jest` - Testing framework
- `@testing-library/react` - React testing utilities
- `@testing-library/user-event` - User interaction testing
- `@testing-library/jest-dom` - DOM matchers
- `jest-environment-jsdom` - Browser environment