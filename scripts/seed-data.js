#!/usr/bin/env node

/**
 * Firestore Seed Data Script
 * 
 * This script creates initial seed data for a fresh deployment.
 * It creates a single business settings document and one HR test user.
 * 
 * ⚠️  This script is DISABLED by default and requires explicit confirmation!
 * 
 * Usage: node scripts/seed-data.js [--confirm]
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
const auth = admin.auth();

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

async function createBusinessSettings() {
  console.log('🏢 Creating business settings document...');
  
  try {
    const businessData = {
      name: 'Demo Salon',
      location: {
        lat: 25.2854, // Doha, Qatar coordinates
        lng: 51.5310
      },
      address: '123 Demo Street, Doha, Qatar',
      commissionStructure: {
        commissionBrackets: [
          { minQAR: 0, maxQAR: 5000, ratePercent: 5 },
          { minQAR: 5001, maxQAR: 10000, ratePercent: 7 },
          { minQAR: 10001, maxQAR: 20000, ratePercent: 10 },
          { minQAR: 20001, maxQAR: 999999, ratePercent: 12 }
        ],
        bonusStructure: {
          salesPercent: 2,
          salaryPercent: 5
        }
      },
      settings: {
        clockInRadius: 500, // meters
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        breakDuration: 30, // minutes
        overtimeThreshold: 8 // hours
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const businessRef = await db.collection('businesses').add(businessData);
    console.log(`✅ Business settings created with ID: ${businessRef.id}`);
    
    return businessRef.id;
    
  } catch (error) {
    console.error('❌ Error creating business settings:', error.message);
    throw error;
  }
}

async function createHRTestUser(businessId) {
  console.log('👤 Creating HR test user...');
  
  try {
    const email = 'hr@demosalon.com';
    const password = 'DemoHR123!';
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: 'HR Manager',
      emailVerified: true
    });
    
    console.log(`✅ Auth user created with UID: ${userRecord.uid}`);
    
    // Create staff document in Firestore
    const staffData = {
      firstName: 'HR',
      lastName: 'Manager',
      email: email,
      role: 'manager',
      businessId: businessId,
      phone: '+97412345678',
      specialties: ['Management', 'HR', 'Administration'],
      salary: {
        basicSalary: 8000,
        allowance: 1000,
        transportation: 500,
        housing: 2000,
        totalGross: 11500
      },
      permissions: {
        canManageStaff: true,
        canViewReports: true,
        canApproveLeave: true,
        canManageSchedule: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const staffRef = await db.collection('staff').add(staffData);
    console.log(`✅ Staff document created with ID: ${staffRef.id}`);
    
    return {
      authUid: userRecord.uid,
      staffId: staffRef.id,
      email: email,
      password: password
    };
    
  } catch (error) {
    console.error('❌ Error creating HR test user:', error.message);
    throw error;
  }
}

async function createSampleServices(businessId) {
  console.log('💅 Creating sample services...');
  
  try {
    const services = [
      {
        name: 'Manicure',
        description: 'Basic manicure service',
        duration: 60, // minutes
        price: 50,
        category: 'Nails',
        businessId: businessId,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Pedicure',
        description: 'Basic pedicure service',
        duration: 90,
        price: 80,
        category: 'Nails',
        businessId: businessId,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Hair Cut',
        description: 'Professional hair cutting service',
        duration: 45,
        price: 120,
        category: 'Hair',
        businessId: businessId,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Hair Color',
        description: 'Hair coloring service',
        duration: 120,
        price: 200,
        category: 'Hair',
        businessId: businessId,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    const serviceIds = [];
    for (const service of services) {
      const serviceRef = await db.collection('services').add(service);
      serviceIds.push(serviceRef.id);
      console.log(`   ✅ Created service: ${service.name}`);
    }
    
    return serviceIds;
    
  } catch (error) {
    console.error('❌ Error creating sample services:', error.message);
    throw error;
  }
}

async function createSampleCommissionPlan(businessId) {
  console.log('💰 Creating sample commission plan...');
  
  try {
    const commissionPlan = {
      name: 'Standard Commission Plan',
      businessId: businessId,
      isActive: true,
      brackets: [
        { minQAR: 0, maxQAR: 5000, ratePercent: 5 },
        { minQAR: 5001, maxQAR: 10000, ratePercent: 7 },
        { minQAR: 10001, maxQAR: 20000, ratePercent: 10 },
        { minQAR: 20001, maxQAR: 999999, ratePercent: 12 }
      ],
      bonusStructure: {
        salesPercent: 2,
        salaryPercent: 5
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const planRef = await db.collection('commissionPlans').add(commissionPlan);
    console.log(`✅ Commission plan created with ID: ${planRef.id}`);
    
    return planRef.id;
    
  } catch (error) {
    console.error('❌ Error creating commission plan:', error.message);
    throw error;
  }
}

async function verifySeedData() {
  console.log('\n🔍 Verifying seed data...');
  
  try {
    // Check businesses
    const businessesSnapshot = await db.collection('businesses').get();
    console.log(`   Businesses: ${businessesSnapshot.size} documents`);
    
    // Check staff
    const staffSnapshot = await db.collection('staff').get();
    console.log(`   Staff: ${staffSnapshot.size} documents`);
    
    // Check services
    const servicesSnapshot = await db.collection('services').get();
    console.log(`   Services: ${servicesSnapshot.size} documents`);
    
    // Check commission plans
    const plansSnapshot = await db.collection('commissionPlans').get();
    console.log(`   Commission Plans: ${plansSnapshot.size} documents`);
    
    console.log('✅ Seed data verification completed');
    
  } catch (error) {
    console.error('❌ Error verifying seed data:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const autoConfirm = args.includes('--confirm');
  
  console.log('🚀 Firestore Seed Data Script');
  console.log('==============================\n');
  
  console.log('📋 This script will create:');
  console.log('   🏢 One business settings document');
  console.log('   👤 One HR test user (hr@demosalon.com)');
  console.log('   💅 Sample services (Manicure, Pedicure, Hair Cut, Hair Color)');
  console.log('   💰 Sample commission plan');
  console.log('   🔐 Firebase Auth user for the HR manager\n');
  
  if (!autoConfirm) {
    const rl = createReadlineInterface();
    
    console.log('⚠️  CONFIRMATION REQUIRED ⚠️');
    const confirmation = await askQuestion(rl, 'Create seed data? Type "CREATE SEED DATA" to confirm: ');
    
    if (confirmation !== 'CREATE SEED DATA') {
      console.log('❌ Confirmation failed. Operation cancelled.');
      rl.close();
      process.exit(0);
    }
    
    const doubleCheck = await askQuestion(rl, 'Are you sure? Type "YES" to proceed: ');
    
    if (doubleCheck !== 'YES') {
      console.log('❌ Double-check failed. Operation cancelled.');
      rl.close();
      process.exit(0);
    }
    
    rl.close();
  }
  
  console.log('\n🌱 Starting seed data creation...\n');
  
  try {
    // Create business settings
    const businessId = await createBusinessSettings();
    
    // Create HR test user
    const hrUser = await createHRTestUser(businessId);
    
    // Create sample services
    const serviceIds = await createSampleServices(businessId);
    
    // Create sample commission plan
    const planId = await createSampleCommissionPlan(businessId);
    
    // Verify seed data
    await verifySeedData();
    
    // Summary
    console.log('\n📋 Seed Data Summary:');
    console.log('   ✅ Business settings created');
    console.log('   ✅ HR test user created');
    console.log(`   ✅ ${serviceIds.length} sample services created`);
    console.log('   ✅ Commission plan created');
    
    console.log('\n🔐 Test User Credentials:');
    console.log(`   Email: ${hrUser.email}`);
    console.log(`   Password: ${hrUser.password}`);
    console.log(`   Auth UID: ${hrUser.authUid}`);
    console.log(`   Staff ID: ${hrUser.staffId}`);
    
    console.log('\n✅ Seed data creation completed successfully!');
    console.log('🎉 Your app is now ready for testing with sample data.');
    
  } catch (error) {
    console.error('\n❌ Seed data creation failed:', error.message);
    console.log('💡 Please check your Firebase configuration and try again.');
    process.exit(1);
  }
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

main().catch(console.error);
