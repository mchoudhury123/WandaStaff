#!/usr/bin/env node

/**
 * EAS Configuration Test Script for WandaStaff
 * 
 * This script validates that EAS build profiles are correctly configured
 * and will use the right environment variables during builds.
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

// Test configurations
const testConfigs = {
  staging: {
    profile: 'staging',
    expectedEnv: 'staging',
    expectedAppName: 'WandaStaff Staging',
    expectedBundleId: 'com.wandasalon.staff.staging',
    expectedFirebaseProject: 'staging'
  },
  production: {
    profile: 'production', 
    expectedEnv: 'production',
    expectedAppName: 'WandaStaff',
    expectedBundleId: 'com.wandasalon.staff',
    expectedFirebaseProject: 'production'
  }
};

// Required environment variables for each profile
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
 * Check if EAS CLI is available and user is authenticated
 */
function checkEASSetup() {
  try {
    execSync('eas --version', { stdio: 'pipe' });
    execSync('eas whoami', { stdio: 'pipe' });
    return true;
  } catch (err) {
    error('EAS CLI not available or not logged in');
    info('Please ensure you have:');
    info('1. Installed EAS CLI: npm install -g @expo/eas-cli');
    info('2. Logged in: eas login');
    return false;
  }
}

/**
 * Read and validate eas.json configuration
 */
function validateEASJson() {
  const easJsonPath = path.join(projectRoot, 'eas.json');
  
  if (!fs.existsSync(easJsonPath)) {
    error('eas.json file not found');
    return false;
  }
  
  try {
    const easConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
    
    if (!easConfig.build) {
      error('eas.json missing build configuration');
      return false;
    }
    
    let allValid = true;
    
    Object.entries(testConfigs).forEach(([environment, config]) => {
      const profile = easConfig.build[config.profile];
      
      if (!profile) {
        error(`Missing ${config.profile} profile in eas.json`);
        allValid = false;
        return;
      }
      
      if (!profile.env) {
        error(`Missing env configuration in ${config.profile} profile`);
        allValid = false;
        return;
      }
      
      // Check that all required env vars are mapped
      requiredEnvVars.forEach(varName => {
        const expectedSecretName = `$${varName}_${environment.toUpperCase()}`;
        if (profile.env[varName] !== expectedSecretName) {
          error(`${config.profile} profile: ${varName} should map to ${expectedSecretName}, but maps to ${profile.env[varName]}`);
          allValid = false;
        }
      });
      
      if (allValid) {
        success(`${config.profile} profile configuration is valid`);
      }
    });
    
    return allValid;
  } catch (err) {
    error(`Invalid eas.json: ${err.message}`);
    return false;
  }
}

/**
 * Check EAS secrets exist
 */
function checkEASSecrets() {
  try {
    const output = execSync('eas secret:list', { encoding: 'utf8' });
    const secretLines = output.split('\n').filter(line => line.trim()).slice(1);
    const secretNames = secretLines.map(line => {
      const match = line.match(/(\S+)/);
      return match ? match[1] : '';
    }).filter(name => name);
    
    let allSecretsExist = true;
    
    Object.entries(testConfigs).forEach(([environment, config]) => {
      header(`Checking ${environment.toUpperCase()} secrets`);
      
      requiredEnvVars.forEach(varName => {
        const secretName = `${varName}_${environment.toUpperCase()}`;
        if (secretNames.includes(secretName)) {
          success(`Secret exists: ${secretName}`);
        } else {
          error(`Missing secret: ${secretName}`);
          allSecretsExist = false;
        }
      });
    });
    
    return allSecretsExist;
  } catch (err) {
    error(`Failed to list EAS secrets: ${err.message}`);
    return false;
  }
}

/**
 * Test local environment configurations
 */
function testLocalConfigurations() {
  header('Testing Local Environment Configurations');
  
  let allValid = true;
  
  Object.entries(testConfigs).forEach(([environment, config]) => {
    const envFile = `.env.${environment}`;
    const envPath = path.join(projectRoot, envFile);
    
    if (!fs.existsSync(envPath)) {
      error(`Missing local environment file: ${envFile}`);
      allValid = false;
      return;
    }
    
    try {
      const content = fs.readFileSync(envPath, 'utf8');
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
      
      // Check key values
      if (envVars.ENVIRONMENT === config.expectedEnv) {
        success(`${envFile}: ENVIRONMENT = ${config.expectedEnv}`);
      } else {
        error(`${envFile}: ENVIRONMENT should be ${config.expectedEnv}, got ${envVars.ENVIRONMENT}`);
        allValid = false;
      }
      
      if (envVars.APP_NAME === config.expectedAppName) {
        success(`${envFile}: APP_NAME = "${config.expectedAppName}"`);
      } else {
        error(`${envFile}: APP_NAME should be "${config.expectedAppName}", got "${envVars.APP_NAME}"`);
        allValid = false;
      }
      
      // Check for placeholder values
      const placeholderVars = [];
      requiredEnvVars.forEach(varName => {
        if (envVars[varName] && (envVars[varName].startsWith('your_') || envVars[varName].includes('your-project'))) {
          placeholderVars.push(varName);
        }
      });
      
      if (placeholderVars.length > 0) {
        warning(`${envFile} contains placeholder values for: ${placeholderVars.join(', ')}`);
      }
      
    } catch (err) {
      error(`Failed to read ${envFile}: ${err.message}`);
      allValid = false;
    }
  });
  
  return allValid;
}

/**
 * Test app.config.ts environment awareness
 */
function testAppConfig() {
  header('Testing app.config.ts Environment Awareness');
  
  const appConfigPath = path.join(projectRoot, 'app.config.ts');
  
  if (!fs.existsSync(appConfigPath)) {
    error('app.config.ts not found');
    return false;
  }
  
  try {
    const content = fs.readFileSync(appConfigPath, 'utf8');
    
    // Check for environment-aware Firebase paths
    if (content.includes('firebase/${environment}')) {
      success('app.config.ts uses environment-aware Firebase file paths');
    } else {
      error('app.config.ts missing environment-aware Firebase file paths');
      return false;
    }
    
    // Check for bundle ID suffix logic
    if (content.includes('staging') && content.includes('.staging')) {
      success('app.config.ts includes staging bundle ID suffix logic');
    } else {
      warning('app.config.ts may be missing staging bundle ID suffix logic');
    }
    
    // Check for Firebase config files
    if (content.includes('GoogleService-Info.plist') && content.includes('google-services.json')) {
      success('app.config.ts references both iOS and Android Firebase config files');
    } else {
      error('app.config.ts missing proper Firebase config file references');
      return false;
    }
    
    return true;
  } catch (err) {
    error(`Failed to read app.config.ts: ${err.message}`);
    return false;
  }
}

/**
 * Test Firebase configuration files exist
 */
function testFirebaseFiles() {
  header('Testing Firebase Configuration Files');
  
  let allFilesExist = true;
  
  Object.entries(testConfigs).forEach(([environment, config]) => {
    const firebaseDir = path.join(projectRoot, 'firebase', environment);
    const androidConfig = path.join(firebaseDir, 'google-services.json');
    const iosConfig = path.join(firebaseDir, 'GoogleService-Info.plist');
    
    if (fs.existsSync(androidConfig)) {
      success(`${environment}: Android config exists`);
    } else {
      error(`${environment}: Missing firebase/${environment}/google-services.json`);
      allFilesExist = false;
    }
    
    if (fs.existsSync(iosConfig)) {
      success(`${environment}: iOS config exists`);
    } else {
      error(`${environment}: Missing firebase/${environment}/GoogleService-Info.plist`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

/**
 * Generate test summary and next steps
 */
function generateTestSummary(results) {
  header('Test Summary');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    success('🎉 All EAS configuration tests passed!');
    info('Your WandaStaff app is ready for EAS builds.');
    info('');
    info('Next steps:');
    info('1. Test staging build: npm run build:eas:staging:android');
    info('2. Test production build: npm run build:eas:production:android');
    info('3. Monitor build logs for correct environment variables');
    info('4. Test apps to verify correct Firebase connections');
  } else {
    error('❌ Some configuration tests failed.');
    info('');
    info('Please review the errors above and:');
    info('1. Fix any missing files or configurations');
    info('2. Update environment variables with real values');
    info('3. Ensure EAS secrets are properly set');
    info('4. Run this test script again');
  }
  
  // Show individual test results
  info('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    log(`  ${status} ${test}`, passed ? colors.green : colors.red);
  });
}

/**
 * Main test function
 */
function main() {
  header('EAS Configuration Test for WandaStaff');
  
  const results = {
    'EAS CLI Setup': checkEASSetup(),
    'eas.json Configuration': validateEASJson(),
    'EAS Secrets': checkEASSecrets(),
    'Local Environment Files': testLocalConfigurations(),
    'app.config.ts Setup': testAppConfig(),
    'Firebase Config Files': testFirebaseFiles()
  };
  
  generateTestSummary(results);
  
  const allPassed = Object.values(results).every(result => result);
  process.exit(allPassed ? 0 : 1);
}

// Show usage if --help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Usage: node scripts/test-eas-configuration.js');
  log('');
  log('This script validates that EAS build profiles are correctly configured');
  log('for both staging and production environments.');
  log('');
  log('Tests performed:');
  log('  - EAS CLI setup and authentication');
  log('  - eas.json build profile configuration');
  log('  - EAS secrets existence');
  log('  - Local environment file validation');
  log('  - app.config.ts environment awareness');
  log('  - Firebase configuration files');
  process.exit(0);
}

// Run the tests
main();