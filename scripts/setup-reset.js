#!/usr/bin/env node

/**
 * Data Reset Setup Script
 * 
 * This script helps you set up the data reset environment by:
 * - Checking for required dependencies
 * - Verifying Firebase configuration
 * - Creating necessary directories
 * - Providing setup instructions
 * 
 * Usage: node scripts/setup-reset.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function checkDependencies() {
  console.log('📦 Checking dependencies...\n');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!checkFileExists(packageJsonPath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = ['firebase-admin'];
    const missingDeps = [];
    
    requiredDeps.forEach(dep => {
      if (!dependencies[dep]) {
        missingDeps.push(dep);
      }
    });
    
    if (missingDeps.length > 0) {
      console.log('❌ Missing required dependencies:');
      missingDeps.forEach(dep => console.log(`   - ${dep}`));
      console.log('\n💡 Install missing dependencies:');
      console.log(`   npm install ${missingDeps.join(' ')}`);
      return false;
    }
    
    console.log('✅ All required dependencies are installed');
    return true;
    
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
    return false;
  }
}

function checkFirebaseConfig() {
  console.log('\n🔥 Checking Firebase configuration...\n');
  
  const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
  
  if (!checkFileExists(serviceAccountPath)) {
    console.log('❌ Firebase service account key not found');
    console.log('   Expected location: service-account-key.json');
    console.log('\n💡 To get your service account key:');
    console.log('   1. Go to Firebase Console > Project Settings');
    console.log('   2. Click "Service Accounts" tab');
    console.log('   3. Click "Generate New Private Key"');
    console.log('   4. Save the JSON file as "service-account-key.json" in the project root');
    return false;
  }
  
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    if (!serviceAccount.project_id) {
      console.log('❌ Invalid service account key: missing project_id');
      return false;
    }
    
    console.log('✅ Firebase service account key found');
    console.log(`   Project ID: ${serviceAccount.project_id}`);
    return true;
    
  } catch (error) {
    console.log('❌ Error reading service account key:', error.message);
    return false;
  }
}

function createDirectories() {
  console.log('\n📁 Creating necessary directories...\n');
  
  const directories = [
    path.join(__dirname, '..', 'backups'),
    path.join(__dirname, '..', 'scripts')
  ];
  
  directories.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${path.relative(process.cwd(), dir)}`);
      } else {
        console.log(`⚪ Directory already exists: ${path.relative(process.cwd(), dir)}`);
      }
    } catch (error) {
      console.log(`❌ Error creating directory ${dir}:`, error.message);
    }
  });
}

function checkScripts() {
  console.log('\n📜 Checking reset scripts...\n');
  
  const scripts = [
    'backup-firestore.js',
    'purge-firestore.js',
    'purge-storage.js',
    'purge-auth.js',
    'seed-data.js',
    'verify-reset.js'
  ];
  
  let allScriptsExist = true;
  
  scripts.forEach(script => {
    const scriptPath = path.join(__dirname, script);
    if (checkFileExists(scriptPath)) {
      console.log(`✅ ${script}`);
    } else {
      console.log(`❌ ${script} - Missing!`);
      allScriptsExist = false;
    }
  });
  
  return allScriptsExist;
}

function showNextSteps() {
  console.log('\n🚀 Setup Complete! Next Steps:');
  console.log('==============================\n');
  
  console.log('1. 📦 Backup your current data:');
  console.log('   node scripts/backup-firestore.js\n');
  
  console.log('2. 🔍 Test the purge operation (dry run):');
  console.log('   node scripts/purge-firestore.js --dry-run\n');
  
  console.log('3. 🗑️  Execute the data purge:');
  console.log('   node scripts/purge-firestore.js\n');
  
  console.log('4. ✅ Verify the reset was successful:');
  console.log('   node scripts/verify-reset.js\n');
  
  console.log('5. 🌱 Optionally seed with test data:');
  console.log('   node scripts/seed-data.js --confirm\n');
  
  console.log('📖 For detailed instructions, see: DATA-RESET-GUIDE.md');
}

function showSafetyWarning() {
  console.log('⚠️  ⚠️  ⚠️  SAFETY WARNING ⚠️  ⚠️  ⚠️');
  console.log('=====================================');
  console.log('These scripts will PERMANENTLY DELETE data!');
  console.log('Always backup your data before running purge scripts!');
  console.log('Test in development environment first!');
  console.log('=====================================\n');
}

async function main() {
  console.log('🚀 Data Reset Setup Script');
  console.log('==========================\n');
  
  showSafetyWarning();
  
  let setupComplete = true;
  
  // Check dependencies
  if (!checkDependencies()) {
    setupComplete = false;
  }
  
  // Check Firebase configuration
  if (!checkFirebaseConfig()) {
    setupComplete = false;
  }
  
  // Create directories
  createDirectories();
  
  // Check scripts
  if (!checkScripts()) {
    setupComplete = false;
  }
  
  if (setupComplete) {
    showNextSteps();
  } else {
    console.log('\n❌ Setup incomplete. Please resolve the issues above.');
    process.exit(1);
  }
}

main().catch(console.error);
