#!/usr/bin/env node

/**
 * Firebase Storage Purge Script
 * 
 * ⚠️  OPTIONAL: This script will PERMANENTLY DELETE all files from Firebase Storage!
 * ⚠️  This action CANNOT be undone!
 * ⚠️  Make sure you have backed up your files before running this script!
 * 
 * This script safely deletes all files from Firebase Storage buckets.
 * Typically used to clear profile images and other uploaded files.
 * 
 * Usage: node scripts/purge-storage.js [--dry-run] [--confirm]
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  storageBucket: serviceAccount.project_id + '.appspot.com'
});

const bucket = admin.storage().bucket();

// Common file paths to purge (adjust based on your app's file structure)
const COMMON_PATHS_TO_PURGE = [
  'profile-images/',
  'business-logos/',
  'documents/',
  'uploads/',
  'temp/'
];

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

async function listAllFiles(dryRun = false) {
  console.log(`\n${dryRun ? '🔍 DRY RUN' : '📋 Listing all files in storage...'}`);
  
  try {
    const [files] = await bucket.getFiles();
    
    if (files.length === 0) {
      console.log('   ✅ Storage bucket is already empty');
      return [];
    }
    
    console.log(`   Found ${files.length} files:`);
    
    // Group files by path prefix for better organization
    const fileGroups = {};
    files.forEach(file => {
      const pathParts = file.name.split('/');
      const prefix = pathParts.length > 1 ? pathParts[0] + '/' : 'root/';
      
      if (!fileGroups[prefix]) {
        fileGroups[prefix] = [];
      }
      fileGroups[prefix].push(file);
    });
    
    Object.keys(fileGroups).forEach(prefix => {
      console.log(`   📁 ${prefix}: ${fileGroups[prefix].length} files`);
      if (dryRun) {
        fileGroups[prefix].slice(0, 5).forEach(file => {
          console.log(`      - ${file.name} (${(file.metadata.size / 1024).toFixed(1)} KB)`);
        });
        if (fileGroups[prefix].length > 5) {
          console.log(`      ... and ${fileGroups[prefix].length - 5} more files`);
        }
      }
    });
    
    return files;
    
  } catch (error) {
    console.error('❌ Error listing files:', error.message);
    return [];
  }
}

async function purgeAllFiles(files, dryRun = false) {
  if (files.length === 0) {
    console.log('✅ No files to delete');
    return { deleted: 0, errors: 0 };
  }
  
  console.log(`\n${dryRun ? '🔍 DRY RUN' : '🗑️  Deleting files...'}`);
  
  let deletedCount = 0;
  let errorCount = 0;
  
  // Process files in batches to avoid overwhelming the API
  const batchSize = 50;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    if (dryRun) {
      console.log(`   🔍 DRY RUN: Would delete batch ${Math.floor(i/batchSize) + 1} (${batch.length} files)`);
      deletedCount += batch.length;
    } else {
      try {
        await Promise.all(batch.map(file => file.delete()));
        console.log(`   📦 Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} files`);
        deletedCount += batch.length;
      } catch (error) {
        console.error(`   ❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        errorCount += batch.length;
      }
    }
  }
  
  return { deleted: deletedCount, errors: errorCount };
}

async function purgeSpecificPaths(paths, dryRun = false) {
  console.log(`\n${dryRun ? '🔍 DRY RUN' : '🗑️  Purging specific paths...'}`);
  
  let totalDeleted = 0;
  let totalErrors = 0;
  
  for (const path of paths) {
    console.log(`\n   Processing path: ${path}`);
    
    try {
      const [files] = await bucket.getFiles({ prefix: path });
      
      if (files.length === 0) {
        console.log(`   ✅ Path ${path} is already empty`);
        continue;
      }
      
      console.log(`   Found ${files.length} files in ${path}`);
      
      if (dryRun) {
        console.log(`   🔍 DRY RUN: Would delete ${files.length} files from ${path}`);
        totalDeleted += files.length;
      } else {
        const result = await purgeAllFiles(files, dryRun);
        totalDeleted += result.deleted;
        totalErrors += result.errors;
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing path ${path}:`, error.message);
      totalErrors++;
    }
  }
  
  return { deleted: totalDeleted, errors: totalErrors };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const autoConfirm = args.includes('--confirm');
  const purgeAll = args.includes('--all');
  
  console.log('🚀 Firebase Storage Purge Script');
  console.log('==================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be deleted\n');
  } else {
    console.log('⚠️  ⚠️  ⚠️  DANGER: This will PERMANENTLY DELETE files! ⚠️  ⚠️  ⚠️');
    console.log('⚠️  Make sure you have backed up your files first!');
    console.log('⚠️  This action CANNOT be undone!\n');
  }
  
  // List all files first
  const allFiles = await listAllFiles(dryRun);
  
  if (allFiles.length === 0) {
    console.log('\n✅ Storage bucket is already empty. Nothing to purge.');
    process.exit(0);
  }
  
  if (!dryRun && !autoConfirm) {
    const rl = createReadlineInterface();
    
    console.log('\n⚠️  CONFIRMATION REQUIRED ⚠️');
    
    if (purgeAll) {
      const confirmation = await askQuestion(rl, `Delete ALL ${allFiles.length} files? Type "DELETE ALL FILES" to confirm: `);
      
      if (confirmation !== 'DELETE ALL FILES') {
        console.log('❌ Confirmation failed. Operation cancelled.');
        rl.close();
        process.exit(0);
      }
    } else {
      console.log('📁 Common paths that will be purged:');
      COMMON_PATHS_TO_PURGE.forEach(path => console.log(`   - ${path}`));
      
      const confirmation = await askQuestion(rl, 'Delete files from these paths? Type "DELETE PATHS" to confirm: ');
      
      if (confirmation !== 'DELETE PATHS') {
        console.log('❌ Confirmation failed. Operation cancelled.');
        rl.close();
        process.exit(0);
      }
    }
    
    const doubleCheck = await askQuestion(rl, 'Are you absolutely sure? Type "YES" to proceed: ');
    
    if (doubleCheck !== 'YES') {
      console.log('❌ Double-check failed. Operation cancelled.');
      rl.close();
      process.exit(0);
    }
    
    rl.close();
  }
  
  // Perform the purge
  let result;
  
  if (purgeAll) {
    console.log(`\n${dryRun ? '🔍 Starting dry run for ALL files...' : '🗑️  Starting purge of ALL files...'}`);
    result = await purgeAllFiles(allFiles, dryRun);
  } else {
    console.log(`\n${dryRun ? '🔍 Starting dry run for specific paths...' : '🗑️  Starting purge of specific paths...'}`);
    result = await purgeSpecificPaths(COMMON_PATHS_TO_PURGE, dryRun);
  }
  
  // Summary
  console.log('\n📋 Storage Purge Summary:');
  console.log(`   Files ${dryRun ? 'would be deleted' : 'deleted'}: ${result.deleted}`);
  
  if (result.errors > 0) {
    console.log(`   Errors: ${result.errors}`);
  }
  
  if (!dryRun) {
    // Verify storage is empty
    console.log('\n🔍 Verifying storage is empty...');
    const remainingFiles = await listAllFiles(true);
    
    if (remainingFiles.length === 0) {
      console.log('✅ Storage bucket is now empty');
    } else {
      console.log(`⚠️  ${remainingFiles.length} files still remain in storage`);
    }
  }
  
  console.log(`\n${dryRun ? '🔍 Dry run completed!' : '✅ Storage purge completed!'}`);
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
