#!/usr/bin/env node

/**
 * Environment Setup Script
 * 
 * This script helps you set up environment variables for different deployment environments.
 * It provides an interactive way to configure Firebase credentials and business settings.
 * 
 * Usage: node scripts/setup-env.js [staging|production]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupEnvironment(environment) {
  const rl = createReadlineInterface();
  
  console.log(`🚀 Setting up ${environment} environment...\n`);
  
  try {
    // Firebase Configuration
    console.log('🔥 Firebase Configuration:');
    const firebaseApiKey = await askQuestion(rl, 'Firebase API Key: ');
    const firebaseAuthDomain = await askQuestion(rl, 'Firebase Auth Domain: ');
    const firebaseProjectId = await askQuestion(rl, 'Firebase Project ID: ');
    const firebaseStorageBucket = await askQuestion(rl, 'Firebase Storage Bucket: ');
    const firebaseMessagingSenderId = await askQuestion(rl, 'Firebase Messaging Sender ID: ');
    const firebaseAppId = await askQuestion(rl, 'Firebase App ID: ');
    
    console.log('\n📱 App Configuration:');
    const appName = await askQuestion(rl, `App Name (default: WandaStaff${environment === 'staging' ? ' Staging' : ''}): `) || 
                   `WandaStaff${environment === 'staging' ? ' Staging' : ''}`;
    const appVersion = await askQuestion(rl, 'App Version (default: 1.0.0): ') || '1.0.0';
    
    console.log('\n🏢 Business Settings:');
    const clockRadius = await askQuestion(rl, 'Default Clock Radius (meters, default: 500): ') || '500';
    const holidayAllowance = await askQuestion(rl, 'Holiday Allowance (days, default: 21): ') || '21';
    
    // Create environment file content
    const envContent = `# Firebase Configuration - ${environment.charAt(0).toUpperCase() + environment.slice(1)} Environment
FIREBASE_API_KEY=${firebaseApiKey}
FIREBASE_AUTH_DOMAIN=${firebaseAuthDomain}
FIREBASE_PROJECT_ID=${firebaseProjectId}
FIREBASE_STORAGE_BUCKET=${firebaseStorageBucket}
FIREBASE_MESSAGING_SENDER_ID=${firebaseMessagingSenderId}
FIREBASE_APP_ID=${firebaseAppId}

# App Configuration - ${environment.charAt(0).toUpperCase() + environment.slice(1)}
APP_NAME=${appName}
APP_VERSION=${appVersion}
ENVIRONMENT=${environment}

# Business Settings - ${environment.charAt(0).toUpperCase() + environment.slice(1)}
DEFAULT_CLOCK_RADIUS_METERS=${clockRadius}
HOLIDAY_ALLOWANCE_DAYS=${holidayAllowance}
`;
    
    // Write environment file
    const envFileName = `.env.${environment}`;
    const envFilePath = path.join(__dirname, '..', envFileName);
    
    fs.writeFileSync(envFilePath, envContent);
    
    console.log(`\n✅ Environment file created: ${envFileName}`);
    console.log(`📁 Location: ${envFilePath}`);
    
    // Ask if they want to set it as current environment
    const setCurrent = await askQuestion(rl, `\nSet as current environment? (y/N): `);
    
    if (setCurrent.toLowerCase() === 'y' || setCurrent.toLowerCase() === 'yes') {
      const currentEnvPath = path.join(__dirname, '..', '.env');
      fs.writeFileSync(currentEnvPath, envContent);
      console.log('✅ Current environment updated');
    }
    
    console.log('\n🎉 Environment setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test your configuration: npm run start');
    console.log('   2. Build for this environment: npm run build:staging:android (or build:production:android)');
    console.log('   3. See ENVIRONMENT-SETUP.md for detailed instructions');
    
  } catch (error) {
    console.error('❌ Error setting up environment:', error.message);
  } finally {
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'staging';
  
  if (!['staging', 'production'].includes(environment)) {
    console.log('❌ Invalid environment. Use "staging" or "production"');
    console.log('Usage: node scripts/setup-env.js [staging|production]');
    process.exit(1);
  }
  
  console.log('🚀 Environment Setup Script');
  console.log('============================\n');
  
  console.log('This script will help you configure environment variables for your app.');
  console.log('You can get Firebase credentials from Firebase Console > Project Settings.\n');
  
  await setupEnvironment(environment);
}

main().catch(console.error);
