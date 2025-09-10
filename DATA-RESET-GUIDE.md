# 🚨 Firestore Data Reset Guide

## ⚠️ **CRITICAL WARNING** ⚠️

**THIS GUIDE CONTAINS DESTRUCTIVE OPERATIONS THAT WILL PERMANENTLY DELETE DATA!**

- ⚠️ **NEVER RUN THESE SCRIPTS IN PRODUCTION WITHOUT PROPER BACKUP**
- ⚠️ **THESE OPERATIONS CANNOT BE UNDONE**
- ⚠️ **ALWAYS TEST IN A DEVELOPMENT ENVIRONMENT FIRST**
- ⚠️ **MAKE SURE YOU HAVE ADMIN ACCESS TO YOUR FIREBASE PROJECT**

---

## 📋 Overview

This guide provides a complete procedure for safely resetting your Firestore database while preserving schema, security rules, and indexes. The process includes:

1. **Backup**: Export all current data to local JSON files
2. **Purge**: Delete all documents from specified collections
3. **Verification**: Confirm the reset was successful
4. **Optional**: Clear Storage files and Auth users
5. **Optional**: Seed with fresh test data

---

## 🛠️ Prerequisites

### Required Setup

1. **Firebase Admin SDK Key**:
   ```bash
   # Download your service account key from Firebase Console
   # Go to Project Settings > Service Accounts > Generate New Private Key
   # Save as 'service-account-key.json' in the project root
   ```

2. **Node.js Dependencies**:
   ```bash
   npm install firebase-admin
   ```

3. **Firebase CLI** (for backup):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

---

## 📦 Step 1: Backup Current Data

### Option A: Using Firebase CLI (Recommended)

```bash
# Export all Firestore data to Cloud Storage
firebase firestore:export gs://your-project-id.appspot.com/firestore-backup-$(date +%Y%m%d)

# Download the export to local storage
gsutil -m cp -r gs://your-project-id.appspot.com/firestore-backup-$(date +%Y%m%d) ./backups/
```

### Option B: Using Custom Backup Script

```bash
# Run the custom backup script
node scripts/backup-firestore.js
```

**What this does:**
- Exports all collections to individual JSON files
- Creates a backup summary with document counts
- Saves files to `./backups/` directory
- Includes timestamp for organization

**Backup files created:**
```
backups/
├── staff-backup-2024-01-15.json
├── businesses-backup-2024-01-15.json
├── clockRecords-backup-2024-01-15.json
├── appointments-backup-2024-01-15.json
├── holidayRequests-backup-2024-01-15.json
├── rotas-backup-2024-01-15.json
├── payslips-backup-2024-01-15.json
├── services-backup-2024-01-15.json
└── backup-summary.json
```

---

## 🗑️ Step 2: Purge Firestore Data

### ⚠️ **DANGER ZONE** ⚠️

**Collections that will be purged:**
- `staff` - All staff member records
- `businesses` - Business settings and locations
- `clockRecords` - Clock in/out history
- `appointments` - All appointment bookings
- `holidayRequests` - Leave request history
- `rotas` - Staff schedules and rosters
- `payslips` - Salary and payment records
- `services` - Service catalog and pricing

### Dry Run First (Recommended)

```bash
# Test the purge operation without deleting anything
node scripts/purge-firestore.js --dry-run
```

### Execute the Purge

```bash
# Run the actual purge (requires confirmation)
node scripts/purge-firestore.js
```

**Safety Features:**
- Requires typing "DELETE ALL DATA" to confirm
- Double confirmation with "YES"
- Processes in batches to avoid timeouts
- Shows progress and document counts
- Verifies collections are empty after completion

---

## 🔍 Step 3: Verify Reset Success

```bash
# Run verification script
node scripts/verify-reset.js
```

**Verification checks:**
- ✅ All collections exist but are empty (0 documents)
- ✅ Firestore connection is working
- ✅ Security rules are active
- ✅ Indexes are functional
- ✅ Database is ready for fresh deployment

---

## 🧹 Optional: Clear Storage Files

### ⚠️ **OPTIONAL - Storage Cleanup** ⚠️

**Files that will be deleted:**
- Profile images (`profile-images/`)
- Business logos (`business-logos/`)
- Documents (`documents/`)
- Uploads (`uploads/`)
- Temporary files (`temp/`)

### Dry Run Storage Purge

```bash
# See what files would be deleted
node scripts/purge-storage.js --dry-run
```

### Execute Storage Purge

```bash
# Delete all files from common paths
node scripts/purge-storage.js

# OR delete ALL files from storage
node scripts/purge-storage.js --all
```

---

## 👥 Optional: Clear Auth Users

### ⚠️ **OPTIONAL - Auth Cleanup** ⚠️

**This will delete ALL Firebase Auth users!**

### Dry Run Auth Purge

```bash
# See what users would be deleted
node scripts/purge-auth.js --dry-run
```

### Execute Auth Purge

```bash
# Delete all users (requires confirmation)
node scripts/purge-auth.js --all

# OR delete specific users by email
node scripts/purge-auth.js
```

---

## 🌱 Optional: Seed Fresh Data

### Create Test Data

```bash
# Create initial business and HR user
node scripts/seed-data.js --confirm
```

**Seed data includes:**
- 🏢 One business settings document (Demo Salon)
- 👤 One HR test user (`hr@demosalon.com` / `DemoHR123!`)
- 💅 Sample services (Manicure, Pedicure, Hair Cut, Hair Color)
- 💰 Sample commission plan
- 🔐 Firebase Auth user for the HR manager

---

## ✅ Final Verification Checklist

### 1. Database Status
- [ ] All collections exist but contain 0 documents
- [ ] Security rules are active and working
- [ ] Indexes are functional
- [ ] Firestore connection is stable

### 2. App Testing
- [ ] App boots without errors
- [ ] Login screen displays correctly
- [ ] No Firebase connection errors in console
- [ ] Navigation works properly

### 3. Optional Cleanup
- [ ] Storage files cleared (if applicable)
- [ ] Auth users cleared (if applicable)
- [ ] Seed data created (if applicable)

### 4. Production Readiness
- [ ] All scripts tested in development
- [ ] Backup files safely stored
- [ ] Team notified of reset
- [ ] Deployment plan ready

---

## 🚀 Deployment Steps

### For Fresh Customer Deployment

1. **Complete the reset process** (Steps 1-3)
2. **Run verification** to ensure success
3. **Optionally seed data** for testing
4. **Deploy your app** to the reset database
5. **Test core functionality** with fresh data

### For Development Reset

1. **Run backup** (optional for dev)
2. **Execute purge** with confirmation
3. **Verify reset** completed successfully
4. **Seed test data** for development
5. **Continue development** with clean slate

---

## 🆘 Troubleshooting

### Common Issues

**"Permission denied" errors:**
- Ensure your service account key has proper permissions
- Check that the key file is in the project root
- Verify the project ID matches your Firebase project

**"Collection not found" errors:**
- This is normal for empty collections
- The verification script will confirm collections exist

**"Index not ready" warnings:**
- Normal for new/empty collections
- Indexes will be created automatically when needed

**Script hangs or times out:**
- Large datasets may take time to process
- Scripts use batching to handle large operations
- Check Firebase quotas and limits

### Recovery

**If something goes wrong:**
1. **Stop the script immediately** (Ctrl+C)
2. **Check your backup files** in `./backups/`
3. **Restore from backup** if necessary
4. **Contact support** if data is lost

---

## 📞 Support

If you encounter issues or need assistance:

1. **Check the backup files** first
2. **Review the error messages** carefully
3. **Test in development** before production
4. **Document the issue** with specific error messages

---

## 📝 Script Reference

### Available Scripts

| Script | Purpose | Safety Level |
|--------|---------|--------------|
| `backup-firestore.js` | Export data to JSON | ✅ Safe |
| `purge-firestore.js` | Delete documents | ⚠️ Destructive |
| `purge-storage.js` | Delete files | ⚠️ Destructive |
| `purge-auth.js` | Delete users | ⚠️ Destructive |
| `seed-data.js` | Create test data | ✅ Safe |
| `verify-reset.js` | Check status | ✅ Safe |

### Command Line Options

**Dry Run Mode:**
```bash
node script-name.js --dry-run
```

**Auto Confirm:**
```bash
node script-name.js --confirm
```

**Help:**
```bash
node script-name.js --help
```

---

## 🔒 Security Notes

- **Service account keys** contain sensitive information
- **Never commit** `service-account-key.json` to version control
- **Use environment variables** in production
- **Rotate keys** regularly for security
- **Limit permissions** to only what's needed

---

**Remember: When in doubt, backup first and test in development!**
