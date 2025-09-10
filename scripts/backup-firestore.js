#!/usr/bin/env node

/**
 * Firestore Data Backup Script
 * 
 * This script exports all Firestore collections to local JSON files
 * for backup purposes before performing a data reset.
 * 
 * Usage: node scripts/backup-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// and place it in the project root as 'service-account-key.json'
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

// Collections to backup (based on your app structure)
const COLLECTIONS_TO_BACKUP = [
  'staff',
  'businesses', 
  'clockRecords',
  'appointments',
  'holidayRequests',
  'rotas',
  'payslips',
  'services',
  'commissionPlans',
  'crmSyncLogs'
];

async function backupCollection(collectionName) {
  console.log(`📦 Backing up collection: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const documents = [];
    
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    const backupData = {
      collection: collectionName,
      timestamp: new Date().toISOString(),
      documentCount: documents.length,
      documents: documents
    };
    
    const backupDir = path.join(__dirname, '..', 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const filename = `${collectionName}-backup-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(backupDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ ${collectionName}: ${documents.length} documents backed up to ${filename}`);
    return { collection: collectionName, count: documents.length, filepath };
    
  } catch (error) {
    console.error(`❌ Error backing up ${collectionName}:`, error.message);
    return { collection: collectionName, error: error.message };
  }
}

async function createBackupSummary(results) {
  const summary = {
    backupDate: new Date().toISOString(),
    projectId: serviceAccount.project_id,
    collections: results,
    totalDocuments: results.reduce((sum, result) => sum + (result.count || 0), 0)
  };
  
  const summaryPath = path.join(__dirname, '..', 'backups', 'backup-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log(`\n📋 Backup Summary:`);
  console.log(`   Total Collections: ${results.length}`);
  console.log(`   Total Documents: ${summary.totalDocuments}`);
  console.log(`   Summary saved to: backup-summary.json`);
}

async function main() {
  console.log('🚀 Starting Firestore Backup Process...\n');
  
  const results = [];
  
  for (const collectionName of COLLECTIONS_TO_BACKUP) {
    const result = await backupCollection(collectionName);
    results.push(result);
  }
  
  await createBackupSummary(results);
  
  console.log('\n✅ Backup process completed!');
  console.log('📁 All backup files saved to: ./backups/');
  
  // Close the connection
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
