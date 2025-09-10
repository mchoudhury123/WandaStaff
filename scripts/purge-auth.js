#!/usr/bin/env node

/**
 * Firebase Auth Purge Script
 * 
 * ⚠️  OPTIONAL: This script will PERMANENTLY DELETE all users from Firebase Auth!
 * ⚠️  This action CANNOT be undone!
 * ⚠️  Make sure you have backed up your user data before running this script!
 * 
 * This script safely deletes all users from Firebase Authentication.
 * Use this only if you want to completely reset user authentication.
 * 
 * Usage: node scripts/purge-auth.js [--dry-run] [--confirm]
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const auth = admin.auth();

// Batch size for user deletion (Firebase Auth limit is 1000 users per batch)
const BATCH_SIZE = 1000;

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

async function listAllUsers(dryRun = false) {
  console.log(`\n${dryRun ? '🔍 DRY RUN' : '📋 Listing all users...'}`);
  
  try {
    const listUsersResult = await auth.listUsers();
    const users = listUsersResult.users;
    
    if (users.length === 0) {
      console.log('   ✅ No users found in Firebase Auth');
      return [];
    }
    
    console.log(`   Found ${users.length} users:`);
    
    // Show user details (first 10 users)
    users.slice(0, 10).forEach(user => {
      const email = user.email || 'No email';
      const displayName = user.displayName || 'No name';
      const provider = user.providerData.length > 0 ? user.providerData[0].providerId : 'No provider';
      const createdAt = user.metadata.creationTime;
      
      console.log(`   👤 ${email} (${displayName}) - ${provider} - Created: ${createdAt}`);
    });
    
    if (users.length > 10) {
      console.log(`   ... and ${users.length - 10} more users`);
    }
    
    return users;
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    return [];
  }
}

async function purgeAllUsers(users, dryRun = false) {
  if (users.length === 0) {
    console.log('✅ No users to delete');
    return { deleted: 0, errors: 0 };
  }
  
  console.log(`\n${dryRun ? '🔍 DRY RUN' : '🗑️  Deleting users...'}`);
  
  let deletedCount = 0;
  let errorCount = 0;
  
  // Process users in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    
    if (dryRun) {
      console.log(`   🔍 DRY RUN: Would delete batch ${batchNumber} (${batch.length} users)`);
      deletedCount += batch.length;
    } else {
      try {
        const uids = batch.map(user => user.uid);
        await auth.deleteUsers(uids);
        console.log(`   📦 Deleted batch ${batchNumber}: ${batch.length} users`);
        deletedCount += batch.length;
      } catch (error) {
        console.error(`   ❌ Error deleting batch ${batchNumber}:`, error.message);
        errorCount += batch.length;
      }
    }
  }
  
  return { deleted: deletedCount, errors: errorCount };
}

async function purgeUsersByEmail(emails, dryRun = false) {
  console.log(`\n${dryRun ? '🔍 DRY RUN' : '🗑️  Deleting users by email...'}`);
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email);
      
      if (dryRun) {
        console.log(`   🔍 DRY RUN: Would delete user ${email}`);
        deletedCount++;
      } else {
        await auth.deleteUser(user.uid);
        console.log(`   ✅ Deleted user: ${email}`);
        deletedCount++;
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`   ⚠️  User not found: ${email}`);
      } else {
        console.error(`   ❌ Error deleting user ${email}:`, error.message);
        errorCount++;
      }
    }
  }
  
  return { deleted: deletedCount, errors: errorCount };
}

async function verifyUsersDeleted() {
  console.log('\n🔍 Verifying users are deleted...');
  
  try {
    const listUsersResult = await auth.listUsers();
    const remainingUsers = listUsersResult.users.length;
    
    console.log(`   Remaining users: ${remainingUsers}`);
    
    if (remainingUsers === 0) {
      console.log('✅ All users have been deleted');
    } else {
      console.log(`⚠️  ${remainingUsers} users still remain`);
    }
    
    return remainingUsers;
    
  } catch (error) {
    console.error('❌ Error verifying user deletion:', error.message);
    return -1;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const autoConfirm = args.includes('--confirm');
  const purgeAll = args.includes('--all');
  
  console.log('🚀 Firebase Auth Purge Script');
  console.log('==============================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No users will be deleted\n');
  } else {
    console.log('⚠️  ⚠️  ⚠️  DANGER: This will PERMANENTLY DELETE users! ⚠️  ⚠️  ⚠️');
    console.log('⚠️  Make sure you have backed up your user data first!');
    console.log('⚠️  This action CANNOT be undone!');
    console.log('⚠️  Users will need to re-register after this operation!\n');
  }
  
  // List all users first
  const allUsers = await listAllUsers(dryRun);
  
  if (allUsers.length === 0) {
    console.log('\n✅ No users found. Nothing to purge.');
    process.exit(0);
  }
  
  if (!dryRun && !autoConfirm) {
    const rl = createReadlineInterface();
    
    console.log('\n⚠️  CONFIRMATION REQUIRED ⚠️');
    
    if (purgeAll) {
      const confirmation = await askQuestion(rl, `Delete ALL ${allUsers.length} users? Type "DELETE ALL USERS" to confirm: `);
      
      if (confirmation !== 'DELETE ALL USERS') {
        console.log('❌ Confirmation failed. Operation cancelled.');
        rl.close();
        process.exit(0);
      }
    } else {
      console.log('📧 You can specify specific emails to delete, or use --all to delete everyone');
      const emailInput = await askQuestion(rl, 'Enter email addresses to delete (comma-separated) or "ALL" for all users: ');
      
      if (emailInput.toLowerCase() === 'all') {
        const confirmation = await askQuestion(rl, `Delete ALL ${allUsers.length} users? Type "DELETE ALL USERS" to confirm: `);
        
        if (confirmation !== 'DELETE ALL USERS') {
          console.log('❌ Confirmation failed. Operation cancelled.');
          rl.close();
          process.exit(0);
        }
      } else {
        const emails = emailInput.split(',').map(email => email.trim()).filter(email => email);
        
        if (emails.length === 0) {
          console.log('❌ No valid emails provided. Operation cancelled.');
          rl.close();
          process.exit(0);
        }
        
        console.log(`📧 Will delete ${emails.length} users:`);
        emails.forEach(email => console.log(`   - ${email}`));
        
        const confirmation = await askQuestion(rl, 'Type "DELETE USERS" to confirm: ');
        
        if (confirmation !== 'DELETE USERS') {
          console.log('❌ Confirmation failed. Operation cancelled.');
          rl.close();
          process.exit(0);
        }
        
        // Delete specific users
        const result = await purgeUsersByEmail(emails, dryRun);
        
        console.log('\n📋 Auth Purge Summary:');
        console.log(`   Users ${dryRun ? 'would be deleted' : 'deleted'}: ${result.deleted}`);
        
        if (result.errors > 0) {
          console.log(`   Errors: ${result.errors}`);
        }
        
        console.log(`\n${dryRun ? '🔍 Dry run completed!' : '✅ Auth purge completed!'}`);
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
  console.log(`\n${dryRun ? '🔍 Starting dry run...' : '🗑️  Starting purge process...'}`);
  
  const result = await purgeAllUsers(allUsers, dryRun);
  
  // Summary
  console.log('\n📋 Auth Purge Summary:');
  console.log(`   Users ${dryRun ? 'would be deleted' : 'deleted'}: ${result.deleted}`);
  
  if (result.errors > 0) {
    console.log(`   Errors: ${result.errors}`);
  }
  
  if (!dryRun) {
    await verifyUsersDeleted();
  }
  
  console.log(`\n${dryRun ? '🔍 Dry run completed!' : '✅ Auth purge completed!'}`);
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
