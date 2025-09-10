#!/usr/bin/env node

/**
 * Feature Flags Setup Script for WandaStaff
 * 
 * This script initializes feature flags for businesses in Firestore.
 * It can be used during business setup or to reset flags to defaults.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, updateDoc } = require('firebase/firestore');

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

// Default feature flags
const DEFAULT_FEATURE_FLAGS = {
  enforceClockDistance: true,    // Default to enforcing distance for security
  enablePayslipPDF: false,       // Default to disabled until PDF service is ready
  holidayCarryoverMode: 'manual' // Default to manual for business control
};

// Firebase configuration (using environment variables or defaults)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'your-api-key',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.FIREBASE_APP_ID || 'your-app-id'
};

let firestore;

/**
 * Initialize Firebase and Firestore
 */
function initializeFirebase() {
  try {
    const app = initializeApp(firebaseConfig);
    firestore = getFirestore(app);
    success('Firebase initialized successfully');
    return true;
  } catch (err) {
    error(`Failed to initialize Firebase: ${err.message}`);
    return false;
  }
}

/**
 * Check if feature flags document exists for a business
 */
async function featureFlagsExist(businessId) {
  try {
    const docRef = doc(firestore, 'businesses', businessId, 'settings', 'featureFlags');
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (err) {
    error(`Error checking if feature flags exist: ${err.message}`);
    return false;
  }
}

/**
 * Create feature flags document for a business
 */
async function createFeatureFlags(businessId, customFlags = {}) {
  try {
    const flags = {
      ...DEFAULT_FEATURE_FLAGS,
      ...customFlags
    };

    const docRef = doc(firestore, 'businesses', businessId, 'settings', 'featureFlags');
    await setDoc(docRef, flags);
    
    success(`Feature flags created for business: ${businessId}`);
    info(`Flags: ${JSON.stringify(flags, null, 2)}`);
    return true;
  } catch (err) {
    error(`Failed to create feature flags: ${err.message}`);
    return false;
  }
}

/**
 * Update existing feature flags for a business
 */
async function updateFeatureFlags(businessId, updates) {
  try {
    const docRef = doc(firestore, 'businesses', businessId, 'settings', 'featureFlags');
    await updateDoc(docRef, updates);
    
    success(`Feature flags updated for business: ${businessId}`);
    info(`Updates: ${JSON.stringify(updates, null, 2)}`);
    return true;
  } catch (err) {
    error(`Failed to update feature flags: ${err.message}`);
    return false;
  }
}

/**
 * Get current feature flags for a business
 */
async function getFeatureFlags(businessId) {
  try {
    const docRef = doc(firestore, 'businesses', businessId, 'settings', 'featureFlags');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      warning(`No feature flags found for business: ${businessId}`);
      return null;
    }
  } catch (err) {
    error(`Failed to get feature flags: ${err.message}`);
    return null;
  }
}

/**
 * Setup feature flags for a business
 */
async function setupBusinessFlags(businessId, options = {}) {
  header(`Setting up feature flags for business: ${businessId}`);
  
  const exists = await featureFlagsExist(businessId);
  
  if (exists && !options.force) {
    warning(`Feature flags already exist for business: ${businessId}`);
    
    if (options.show) {
      const currentFlags = await getFeatureFlags(businessId);
      if (currentFlags) {
        info('Current feature flags:');
        Object.entries(currentFlags).forEach(([key, value]) => {
          log(`  ${key}: ${value}`, colors.cyan);
        });
      }
    }
    
    info('Use --force to overwrite existing flags');
    return true;
  }
  
  // Custom flags from command line arguments
  const customFlags = {};
  if (options.enforceDistance !== undefined) {
    customFlags.enforceClockDistance = options.enforceDistance;
  }
  if (options.enablePDF !== undefined) {
    customFlags.enablePayslipPDF = options.enablePDF;
  }
  if (options.carryoverMode) {
    customFlags.holidayCarryoverMode = options.carryoverMode;
  }
  
  if (exists && options.force) {
    if (Object.keys(customFlags).length > 0) {
      return await updateFeatureFlags(businessId, customFlags);
    } else {
      return await createFeatureFlags(businessId, {});
    }
  } else {
    return await createFeatureFlags(businessId, customFlags);
  }
}

/**
 * Setup feature flags for multiple businesses
 */
async function setupMultipleBusinesses(businessIds, options = {}) {
  header(`Setting up feature flags for ${businessIds.length} businesses`);
  
  let successCount = 0;
  
  for (const businessId of businessIds) {
    try {
      const result = await setupBusinessFlags(businessId, options);
      if (result) {
        successCount++;
      }
    } catch (err) {
      error(`Failed to setup flags for ${businessId}: ${err.message}`);
    }
  }
  
  info(`Successfully set up feature flags for ${successCount}/${businessIds.length} businesses`);
  return successCount === businessIds.length;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const options = {
    force: args.includes('--force'),
    show: args.includes('--show'),
    enforceDistance: args.includes('--no-enforce-distance') ? false : 
                    args.includes('--enforce-distance') ? true : undefined,
    enablePDF: args.includes('--enable-pdf') ? true : 
               args.includes('--no-enable-pdf') ? false : undefined,
    carryoverMode: args.find(arg => arg.startsWith('--carryover='))?.split('=')[1]
  };
  
  const businessIds = args.filter(arg => 
    !arg.startsWith('--') && 
    !['help', '-h'].includes(arg)
  );
  
  // Show help
  if (args.includes('--help') || args.includes('-h') || businessIds.length === 0) {
    log('Feature Flags Setup Script for WandaStaff\n');
    log('Usage: node scripts/setup-feature-flags.js [businessId...] [options]\n');
    log('Arguments:');
    log('  businessId              Business ID(s) to set up feature flags for\n');
    log('Options:');
    log('  --force                 Overwrite existing feature flags');
    log('  --show                  Show current feature flags (if they exist)');
    log('  --enforce-distance      Enable clock distance enforcement');
    log('  --no-enforce-distance   Disable clock distance enforcement');
    log('  --enable-pdf            Enable payslip PDF downloads');
    log('  --no-enable-pdf         Disable payslip PDF downloads');
    log('  --carryover=MODE        Set holiday carryover mode (manual|auto)');
    log('  --help, -h              Show this help message\n');
    log('Examples:');
    log('  node scripts/setup-feature-flags.js business123');
    log('  node scripts/setup-feature-flags.js business123 --force --enable-pdf');
    log('  node scripts/setup-feature-flags.js business123 business456 --carryover=auto');
    log('  node scripts/setup-feature-flags.js business123 --show');
    process.exit(0);
  }
  
  // Initialize Firebase
  if (!initializeFirebase()) {
    process.exit(1);
  }
  
  try {
    let success;
    
    if (businessIds.length === 1) {
      success = await setupBusinessFlags(businessIds[0], options);
    } else {
      success = await setupMultipleBusinesses(businessIds, options);
    }
    
    if (success) {
      header('Setup Complete! 🎉');
      info('Feature flags are now configured and ready to use.');
      info('');
      info('Next steps:');
      info('1. Start the WandaStaff app');
      info('2. Check console logs for feature flag loading');
      info('3. Test feature flag functionality');
      info('4. Modify flags in Firebase Console to see real-time updates');
    } else {
      header('Setup Failed ❌');
      info('Please check the errors above and try again.');
      process.exit(1);
    }
    
  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the script
main();