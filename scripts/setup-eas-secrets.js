#!/usr/bin/env node

/**
 * EAS Secrets Setup Script for WandaStaff
 * 
 * This script helps set up EAS secrets for both staging and production environments
 * by reading values from local .env files and creating corresponding EAS secrets.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = (message, color = colors.reset) => console.log(`${color}${message}${colors.reset}`);
const success = (message) => log(`✅ ${message}`, colors.green);
const error = (message) => log(`❌ ${message}`, colors.red);
const warning = (message) => log(`⚠️  ${message}`, colors.yellow);
const info = (message) => log(`ℹ️  ${message}`, colors.blue);
const header = (message) => log(`\n${colors.bright}${colors.cyan}=== ${message} ===${colors.reset}`);

// Project root directory
const projectRoot = path.resolve(__dirname, '..');

// Environment configurations
const environments = {
  staging: {
    file: '.env.staging',
    suffix: '_STAGING'
  },
  production: {
    file: '.env.production', 
    suffix: '_PRODUCTION'
  }
};

// Required environment variables
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'APP_NAME',
  'APP_VERSION',
  'ENVIRONMENT',
  'DEFAULT_CLOCK_RADIUS_METERS',
  'HOLIDAY_ALLOWANCE_DAYS'
];

/**
 * Read and parse environment file
 */
function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return envVars;
  } catch (err) {
    return null;
  }
}

/**
 * Check if EAS CLI is installed and user is logged in
 */
function checkEASSetup() {
  try {
    // Check if EAS CLI is installed
    execSync('eas --version', { stdio: 'pipe' });
    info('EAS CLI is installed ✅');
    
    // Check if user is logged in
    try {
      execSync('eas whoami', { stdio: 'pipe' });
      info('EAS authentication verified ✅');
      return true;
    } catch (err) {
      error('Not logged in to EAS. Please run: eas login');
      return false;
    }
  } catch (err) {
    error('EAS CLI not found. Please install: npm install -g @expo/eas-cli');
    return false;
  }
}

/**
 * Create EAS secret
 */
function createEASSecret(name, value, overwrite = false) {
  try {
    const forceFlag = overwrite ? '--force' : '';
    const command = `eas secret:create --scope project --name "${name}" --value "${value}" ${forceFlag}`.trim();
    
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch (err) {
    if (err.message.includes('already exists')) {
      warning(`Secret ${name} already exists. Use --force to overwrite.`);
      return false;
    }
    error(`Failed to create secret ${name}: ${err.message}`);
    return false;
  }
}

/**
 * List existing EAS secrets
 */
function listEASSecrets() {
  try {
    const output = execSync('eas secret:list', { encoding: 'utf8' });
    return output.split('\n').filter(line => line.trim()).slice(1); // Remove header
  } catch (err) {
    return [];
  }
}

/**
 * Set up secrets for a specific environment
 */
function setupEnvironmentSecrets(environment, envConfig, overwrite = false) {
  const envFilePath = path.join(projectRoot, envConfig.file);
  
  if (!fs.existsSync(envFilePath)) {
    error(`Environment file not found: ${envConfig.file}`);
    return false;
  }
  
  const envVars = readEnvFile(envFilePath);
  if (!envVars) {
    error(`Could not read environment file: ${envConfig.file}`);
    return false;
  }
  
  header(`Setting up ${environment.toUpperCase()} secrets`);
  
  let successCount = 0;
  let totalCount = 0;
  
  requiredEnvVars.forEach(varName => {
    if (!envVars[varName]) {
      warning(`Missing ${varName} in ${envConfig.file}`);
      return;
    }
    
    if (envVars[varName].startsWith('your_') || envVars[varName].includes('your-project')) {
      warning(`${varName} contains placeholder value, skipping`);
      return;
    }
    
    const secretName = `${varName}${envConfig.suffix}`;
    const secretValue = envVars[varName];
    
    totalCount++;
    
    if (createEASSecret(secretName, secretValue, overwrite)) {
      success(`Created secret: ${secretName}`);
      successCount++;
    }
  });
  
  info(`Environment ${environment}: ${successCount}/${totalCount} secrets created successfully`);
  return successCount === totalCount;
}

/**
 * Verify secrets are properly set
 */
function verifySecrets() {
  header('Verifying EAS Secrets');
  
  const secrets = listEASSecrets();
  const secretNames = secrets.map(line => {
    const match = line.match(/(\S+)/);
    return match ? match[1] : '';
  }).filter(name => name);
  
  let missingSecrets = [];
  
  Object.entries(environments).forEach(([environment, config]) => {
    requiredEnvVars.forEach(varName => {
      const secretName = `${varName}${config.suffix}`;
      if (!secretNames.includes(secretName)) {
        missingSecrets.push(secretName);
      }
    });
  });
  
  if (missingSecrets.length === 0) {
    success('All required EAS secrets are configured! 🎉');
    return true;
  } else {
    error(`Missing ${missingSecrets.length} secrets:`);
    missingSecrets.forEach(name => log(`  - ${name}`, colors.red));
    return false;
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const overwrite = args.includes('--force') || args.includes('--overwrite');
  const environmentArg = args.find(arg => ['staging', 'production'].includes(arg));
  
  header('EAS Secrets Setup for WandaStaff');
  
  // Check EAS setup
  if (!checkEASSetup()) {
    process.exit(1);
  }
  
  // If specific environment requested
  if (environmentArg) {
    const envConfig = environments[environmentArg];
    if (setupEnvironmentSecrets(environmentArg, envConfig, overwrite)) {
      success(`${environmentArg} secrets setup completed!`);
    } else {
      error(`${environmentArg} secrets setup failed!`);
      process.exit(1);
    }
    return;
  }
  
  // Set up all environments
  let allSuccess = true;
  
  Object.entries(environments).forEach(([environment, config]) => {
    if (!setupEnvironmentSecrets(environment, config, overwrite)) {
      allSuccess = false;
    }
  });
  
  // Verify setup
  if (allSuccess && verifySecrets()) {
    header('Setup Complete! 🚀');
    info('Next steps:');
    info('1. Test staging build: npm run build:eas:staging:android');
    info('2. Test production build: npm run build:eas:production:android');
    info('3. Verify builds use correct environment variables');
  } else {
    header('Setup Incomplete ⚠️');
    info('Please review the errors above and:');
    info('1. Update environment files with real values');
    info('2. Run this script again');
    info('3. Use --force flag to overwrite existing secrets if needed');
    process.exit(1);
  }
}

// Show usage if --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Usage: node scripts/setup-eas-secrets.js [environment] [options]');
  log('');
  log('Arguments:');
  log('  environment   staging|production (optional, defaults to both)');
  log('');
  log('Options:');
  log('  --force       Overwrite existing secrets');
  log('  --help        Show this help message');
  log('');
  log('Examples:');
  log('  node scripts/setup-eas-secrets.js                 # Set up both environments');
  log('  node scripts/setup-eas-secrets.js staging         # Set up staging only');
  log('  node scripts/setup-eas-secrets.js --force         # Overwrite existing secrets');
  process.exit(0);
}

// Run the setup
main();