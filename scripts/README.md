# Data Reset Scripts

This directory contains scripts for safely resetting your Firestore database while preserving schema, security rules, and indexes.

## 🚨 **CRITICAL WARNING** 🚨

**THESE SCRIPTS WILL PERMANENTLY DELETE DATA!**

- ⚠️ Always backup your data first
- ⚠️ Test in development environment
- ⚠️ Never run in production without proper backup
- ⚠️ These operations cannot be undone

## 📋 Available Scripts

### Setup & Verification
- `setup-reset.js` - Check dependencies and configuration
- `verify-reset.js` - Verify reset was successful

### Data Management
- `backup-firestore.js` - Export all data to JSON files
- `purge-firestore.js` - Delete documents from collections
- `purge-storage.js` - Delete files from Storage (optional)
- `purge-auth.js` - Delete users from Auth (optional)
- `seed-data.js` - Create test data (optional)

## 🚀 Quick Start

### 1. Setup
```bash
npm run reset:setup
```

### 2. Backup
```bash
npm run reset:backup
```

### 3. Test Purge (Dry Run)
```bash
npm run reset:purge:dry
```

### 4. Execute Purge
```bash
npm run reset:purge
```

### 5. Verify
```bash
npm run reset:verify
```

### 6. Seed Data (Optional)
```bash
npm run reset:seed
```

## 📖 Detailed Documentation

See `DATA-RESET-GUIDE.md` for complete instructions and safety procedures.

## 🔧 Prerequisites

1. **Firebase Admin SDK Key**: Download from Firebase Console and save as `service-account-key.json`
2. **Dependencies**: `npm install firebase-admin`
3. **Permissions**: Admin access to your Firebase project

## 🆘 Troubleshooting

- **Permission errors**: Check service account key permissions
- **Collection errors**: Normal for empty collections
- **Index warnings**: Normal for new collections
- **Timeout issues**: Large datasets may take time to process

## 📞 Support

If you encounter issues:
1. Check your backup files first
2. Review error messages carefully
3. Test in development before production
4. Document specific error messages
