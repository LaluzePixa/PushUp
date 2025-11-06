/**
 * Environment Variables Validation
 * Validates all required environment variables at startup
 * Fails fast if any critical variable is missing
 */

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
];

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'ALLOWED_ORIGINS',
  'PORT',
  'NODE_ENV',
  'LOG_LEVEL',
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required variable is missing
 */
export function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  const warnings = RECOMMENDED_ENV_VARS.filter(key => !process.env[key]);

  // Check for missing required variables
  if (missing.length > 0) {
    const error = [
      '',
      '❌ CRITICAL ERROR: Missing required environment variables:',
      '',
      ...missing.map(key => `  - ${key}`),
      '',
      'Please check your .env file and compare with .env.example',
      'The application cannot start without these variables.',
      ''
    ].join('\n');

    throw new Error(error);
  }

  // Validate specific formats
  validateDatabaseUrl();
  validateJwtSecret();
  validateVapidKeys();

  // Warn about missing recommended variables
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('⚠️  WARNING: Missing recommended environment variables:');
    warnings.forEach(key => {
      console.warn(`  - ${key}`);
    });
    console.warn('The application will use default values.');
    console.warn('');
  }

  // Success message
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Environment variables validated successfully');
    console.log('');
  }
}

/**
 * Validate DATABASE_URL format
 */
function validateDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    throw new Error(
      '❌ DATABASE_URL must start with postgresql:// or postgres://'
    );
  }

  // Basic format check: postgresql://user:pass@host:port/dbname
  const urlPattern = /^postgres(ql)?:\/\/.+:.+@.+:\d+\/.+$/;
  if (!urlPattern.test(dbUrl)) {
    throw new Error(
      '❌ DATABASE_URL format is invalid.\n' +
      'Expected format: postgresql://username:password@host:port/database'
    );
  }
}

/**
 * Validate JWT_SECRET strength
 */
function validateJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret.length < 32) {
    throw new Error(
      '❌ JWT_SECRET must be at least 32 characters long.\n' +
      'Generate a strong secret with:\n' +
      'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Warn if using example/weak secret
  const weakSecrets = [
    'CHANGE_THIS',
    'your_secret_here',
    'secret',
    'password',
    'pushsaas',
  ];

  if (weakSecrets.some(weak => secret.toLowerCase().includes(weak.toLowerCase()))) {
    console.warn('⚠️  WARNING: JWT_SECRET appears to be weak or a placeholder.');
    console.warn('   Please generate a strong random secret for production.');
    console.warn('');
  }
}

/**
 * Validate VAPID keys format
 */
function validateVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  // Check if using placeholder values
  const placeholders = ['your_vapid', 'change_me', 'example'];

  if (placeholders.some(p => publicKey.toLowerCase().includes(p))) {
    throw new Error(
      '❌ VAPID_PUBLIC_KEY appears to be a placeholder.\n' +
      'Generate VAPID keys with: npx web-push generate-vapid-keys'
    );
  }

  if (placeholders.some(p => privateKey.toLowerCase().includes(p))) {
    throw new Error(
      '❌ VAPID_PRIVATE_KEY appears to be a placeholder.\n' +
      'Generate VAPID keys with: npx web-push generate-vapid-keys'
    );
  }

  // Basic length check (VAPID keys are typically 65-88 characters)
  if (publicKey.length < 60 || privateKey.length < 60) {
    throw new Error(
      '❌ VAPID keys appear to be invalid (too short).\n' +
      'Generate new keys with: npx web-push generate-vapid-keys'
    );
  }
}

/**
 * Get environment info for logging
 */
export function getEnvInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
    hasAllowedOrigins: !!process.env.ALLOWED_ORIGINS,
    dbPoolMax: process.env.DB_POOL_MAX || 20,
    dbPoolMin: process.env.DB_POOL_MIN || 5,
  };
}
