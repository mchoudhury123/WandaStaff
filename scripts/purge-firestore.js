#!/usr/bin/env node

/**
 * Firestore Data Purge Script
 * 
 * ⚠️  DANGER: This script will PERMANENTLY DELETE all documents from specified collections!
 * ⚠️  This action CANNOT be undone!
 * ⚠️  Make sure you have backed up your data before running this script!
 * 
 * This script safely deletes all documents from the specified collections while
 * preserving the collection structure, indexes, and security rules.
 * 
 * Usage: node scripts/purge-firestore.js [--dry-run] [--confirm]
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Collections to purge (as specified in requirements)
const COLLECTIONS_TO_PURGE = [
  'staff',
  'businesses',
  'clockRecords', 
  'appointments',
  'holidayRequests',
  'rotas',
  'payslips',
  'services'
];

// Batch size for deletion (Firestore limit is 500 operations per batch)
const BATCH_SIZE = 400;

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

async function getDocumentCount(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.size;
  } catch (error) {
    console.error(`❌ Error counting documents in ${collectionName}:`, error.message);
    return 0;
  }
}

async function purgeCollection(collectionName, dryRun = false) {
  console.log(`\n${dryRun ? '🔍 DRY RUN' : '🗑️  PURGING'}: ${collectionName}`);
  
  try {
    const count = await getDocumentCount(collectionName);
    console.log(`   Documents found: ${count}`);
    
    if (count === 0) {
      console.log(`   ✅ Collection ${collectionName} is already empty`);
      return { collection: collectionName, deleted: 0, status: 'empty' };
    }
    
    if (dryRun) {
      console.log(`   🔍 DRY RUN: Would delete ${count} documents`);
      return { collection: collectionName, deleted: count, status: 'dry-run' };
    }
    
    let deletedCount = 0;
    let batch = db.batch();
    let operationCount = 0;
    
    const snapshot = await db.collection(collectionName).get();
    
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      operationCount++;
      deletedCount++;
      
      // Commit batch when it reaches the limit
      if (operationCount >= BATCH_SIZE) {
        await batch.commit();
        console.log(`   📦 Deleted batch of ${operationCount} documents`);
        batch = db.batch();
        operationCount = 0;
      }
    }
    
    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`   📦 Deleted final batch of ${operationCount} documents`);
    }
    
    console.log(`   ✅ ${collectionName}: ${deletedCount} documents deleted`);
    return { collection: collectionName, deleted: deletedCount, status: 'success' };
    
  } catch (error) {
    console.error(`   ❌ Error purging ${collectionName}:`, error.message);
    return { collection: collectionName, deleted: 0, status: 'error', error: error.message };
  }
}

async function verifyCollectionsEmpty() {
  console.log('\n🔍 Verifying collections are empty...');
  
  const results = [];
  for (const collectionName of COLLECTIONS_TO_PURGE) {
    const count = await getDocumentCount(collectionName);
    results.push({ collection: collectionName, count });
    console.log(`   ${collectionName}: ${count} documents`);
  }
  
  const allEmpty = results.every(result => result.count === 0);
  console.log(`\n${allEmpty ? '✅ All collections are empty' : '❌ Some collections still contain documents'}`);
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const autoConfirm = args.includes('--confirm');
  
  console.log('🚀 Firestore Data Purge Script');
  console.log('================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No data will be deleted\n');
  } else {
    console.log('⚠️  ⚠️  ⚠️  DANGER: This will PERMANENTLY DELETE data! ⚠️  ⚠️  ⚠️');
    console.log('⚠️  Make sure you have backed up your data first!');
    console.log('⚠️  This action CANNOT be undone!\n');
  }
  
  console.log(`📋 Collections to ${dryRun ? 'analyze' : 'purge'}:`);
  COLLECTIONS_TO_PURGE.forEach(name => console.log(`   - ${name}`));
  
  // Show current document counts
  console.log('\n📊 Current document counts:');
  for (const collectionName of COLLECTIONS_TO_PURGE) {
    const count = await getDocumentCount(collectionName);
    console.log(`   ${collectionName}: ${count} documents`);
  }
  
  if (!dryRun && !autoConfirm) {
    const rl = createReadlineInterface();
    
    console.log('\n⚠️  FINAL CONFIRMATION REQUIRED ⚠️');
    const confirmation = await askQuestion(rl, 'Type "DELETE ALL DATA" to confirm: ');
    
    if (confirmation !== 'DELETE ALL DATA') {
      console.log('❌ Confirmation failed. Operation cancelled.');
      rl.close();
      process.exit(0);
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
  console.log(`\n${dryRun ? '🔍 Starting dry run...' : '🗑️  Starting purge process...'}`);
  
  const results = [];
  for (const collectionName of COLLECTIONS_TO_PURGE) {
    const result = await purgeCollection(collectionName, dryRun);
    results.push(result);
  }
  
  // Summary
  console.log('\n📋 Purge Summary:');
  const totalDeleted = results.reduce((sum, result) => sum + result.deleted, 0);
  const successful = results.filter(result => result.status === 'success' || result.status === 'dry-run' || result.status === 'empty');
  const errors = results.filter(result => result.status === 'error');
  
  results.forEach(result => {
    const status = result.status === 'success' ? '✅' : 
                   result.status === 'dry-run' ? '🔍' : 
                   result.status === 'empty' ? '⚪' : '❌';
    console.log(`   ${status} ${result.collection}: ${result.deleted} documents ${dryRun ? 'would be deleted' : 'deleted'}`);
  });
  
  console.log(`\n📊 Total: ${totalDeleted} documents ${dryRun ? 'would be deleted' : 'deleted'}`);
  console.log(`   Successful: ${successful.length}/${results.length} collections`);
  
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.length} collections`);
    errors.forEach(error => {
      console.log(`     ❌ ${error.collection}: ${error.error}`);
    });
  }
  
  if (!dryRun) {
    await verifyCollectionsEmpty();
  }
  
  console.log(`\n${dryRun ? '🔍 Dry run completed!' : '✅ Purge process completed!'}`);
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
