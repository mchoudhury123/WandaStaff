#!/usr/bin/env node

/**
 * Firebase Configuration Verification Script
 * 
 * This script verifies that Firebase is properly configured for both
 * staging and production environments across Android and iOS platforms.
 */

const fs = require('fs');
const path = require('path');

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

// Environment configurations to check
const environments = ['staging', 'production'];

// File paths
const paths = {
  envExample: path.join(projectRoot, '.env.example'),
  envStaging: path.join(projectRoot, '.env.staging'),
  envProduction: path.join(projectRoot, '.env.production'),
  appConfig: path.join(projectRoot, 'app.config.ts'),
  firebaseService: path.join(projectRoot, 'src', 'services', 'firebase.ts'),
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
  'ENVIRONMENT'
];

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

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
 * Check Firebase configuration files for an environment
 */
function checkFirebaseFiles(environment) {
  const firebaseDir = path.join(projectRoot, 'firebase', environment);
  const androidConfigPath = path.join(firebaseDir, 'google-services.json');
  const iosConfigPath = path.join(firebaseDir, 'GoogleService-Info.plist');
  
  let androidConfigValid = false;
  let iosConfigValid = false;
  
  // Check Android configuration
  if (fileExists(androidConfigPath)) {
    try {
      const androidConfig = JSON.parse(fs.readFileSync(androidConfigPath, 'utf8'));
      if (androidConfig.project_info && androidConfig.client && androidConfig.client.length > 0) {
        success(`Android config file exists and is valid for ${environment}`);
        androidConfigValid = true;
        
        // Check if it's still using placeholder values
        if (androidConfig.project_info.project_id === 'your-project-id') {
          warning(`Android config for ${environment} contains placeholder values`);
          info(`   Update firebase/${environment}/google-services.json with real Firebase project data`);
        }
      } else {
        error(`Android config file for ${environment} is malformed`);
      }
    } catch (err) {
      error(`Android config file for ${environment} is not valid JSON`);
    }
  } else {
    error(`Android config file missing: firebase/${environment}/google-services.json`);
  }
  
  // Check iOS configuration
  if (fileExists(iosConfigPath)) {
    try {
      const iosConfigContent = fs.readFileSync(iosConfigPath, 'utf8');
      if (iosConfigContent.includes('<plist') && iosConfigContent.includes('CLIENT_ID')) {
        success(`iOS config file exists and is valid for ${environment}`);
        iosConfigValid = true;
        
        // Check if it's still using placeholder values
        if (iosConfigContent.includes('your-api-key')) {
          warning(`iOS config for ${environment} contains placeholder values`);
          info(`   Update firebase/${environment}/GoogleService-Info.plist with real Firebase project data`);
        }
      } else {
        error(`iOS config file for ${environment} is malformed`);
      }
    } catch (err) {
      error(`iOS config file for ${environment} could not be read`);
    }
  } else {
    error(`iOS config file missing: firebase/${environment}/GoogleService-Info.plist`);
  }
  
  return { androidConfigValid, iosConfigValid };
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables(environment) {
  const envFilePath = environment === 'staging' ? paths.envStaging : paths.envProduction;
  
  if (!fileExists(envFilePath)) {
    error(`Environment file missing: .env.${environment}`);
    return false;
  }
  
  const envVars = readEnvFile(envFilePath);
  if (!envVars) {
    error(`Could not read environment file: .env.${environment}`);
    return false;
  }
  
  let allValid = true;
  
  success(`Environment file exists: .env.${environment}`);
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!envVars[varName]) {
      error(`Missing required environment variable: ${varName}`);
      allValid = false;
    } else if (envVars[varName].startsWith('your_') || envVars[varName].includes('your-project')) {
      warning(`Environment variable ${varName} contains placeholder value: ${envVars[varName]}`);
      info(`   Update .env.${environment} with real Firebase project values`);
    } else {
      success(`✓ ${varName}`);
    }
  });
  
  // Check environment-specific values
  if (envVars.ENVIRONMENT !== environment) {
    warning(`ENVIRONMENT variable is "${envVars.ENVIRONMENT}" but should be "${environment}"`);
  }
  
  return allValid;
}

/**
 * Check app configuration
 */
function checkAppConfig() {
  if (!fileExists(paths.appConfig)) {
    error('app.config.ts file missing');
    return false;
  }
  
  try {
    const appConfigContent = fs.readFileSync(paths.appConfig, 'utf8');
    
    // Check for environment-aware Firebase file paths
    if (appConfigContent.includes('firebase/${environment}')) {
      success('app.config.ts uses environment-aware Firebase file paths');
    } else {
      warning('app.config.ts may not be using environment-aware Firebase file paths');
    }
    
    // Check for iOS and Android config references
    if (appConfigContent.includes('GoogleService-Info.plist') && appConfigContent.includes('google-services.json')) {
      success('app.config.ts references both iOS and Android Firebase config files');
    } else {
      error('app.config.ts missing proper Firebase config file references');
    }
    
    return true;
  } catch (err) {
    error('Could not read app.config.ts');
    return false;
  }
}

/**
 * Check Firebase service configuration
 */
function checkFirebaseService() {
  if (!fileExists(paths.firebaseService)) {
    error('Firebase service file missing: src/services/firebase.ts');
    return false;
  }
  
  try {
    const serviceContent = fs.readFileSync(paths.firebaseService, 'utf8');
    
    // Check for proper imports
    if (serviceContent.includes('initializeApp') && serviceContent.includes('getAuth') && serviceContent.includes('getFirestore')) {
      success('Firebase service has proper imports');
    } else {
      warning('Firebase service may be missing some imports');
    }
    
    // Check for configuration validation
    if (serviceContent.includes('validateConfig')) {
      success('Firebase service includes configuration validation');
    } else {
      warning('Firebase service missing configuration validation');
    }
    
    return true;
  } catch (err) {
    error('Could not read Firebase service file');
    return false;
  }
}

/**
 * Main verification function
 */
function main() {
  header('Firebase Configuration Verification');
  
  log('Checking WandaStaff Firebase configuration...\n');
  
  let overallSuccess = true;
  
  // Check app configuration
  header('App Configuration');
  if (!checkAppConfig()) {
    overallSuccess = false;
  }
  
  // Check Firebase service
  header('Firebase Service');
  if (!checkFirebaseService()) {
    overallSuccess = false;
  }
  
  // Check each environment
  environments.forEach(environment => {
    header(`${environment.toUpperCase()} Environment`);
    
    // Check environment variables
    if (!checkEnvironmentVariables(environment)) {
      overallSuccess = false;
    }
    
    // Check Firebase configuration files
    const { androidConfigValid, iosConfigValid } = checkFirebaseFiles(environment);
    if (!androidConfigValid || !iosConfigValid) {
      overallSuccess = false;
    }
  });
  
  // Final report
  header('Verification Summary');
  
  if (overallSuccess) {
    success('🎉 All Firebase configurations are properly set up!');
    info('You can now build your app for staging and production environments.');
    info('');
    info('Next steps:');
    info('1. For staging: npm run env:staging && npm run build:staging:android');
    info('2. For production: npm run env:production && npm run build:production:android');
  } else {
    error('❌ Some Firebase configurations need attention.');
    info('');
    info('Please review the errors above and:');
    info('1. Download proper Firebase config files from Firebase Console');
    info('2. Update environment variables with real project values');
    info('3. Run this script again to verify fixes');
    info('');
    info('See FIREBASE-SETUP.md for detailed instructions.');
  }
  
  process.exit(overallSuccess ? 0 : 1);
}

// Run the verification
main();