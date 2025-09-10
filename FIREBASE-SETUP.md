# Firebase Setup Guide for WandaStaff

This guide explains how to properly configure Firebase for the WandaStaff React Native application across different environments (staging and production).

## 📋 Complete Setup Checklist

### 1. Firebase Console Setup

#### For Staging Environment:
- [ ] Create a new Firebase project for staging (e.g., "wandastaff-staging")
- [ ] Enable Authentication (Email/Password provider)
- [ ] Create Firestore database in production mode
- [ ] Enable Cloud Messaging
- [ ] Add Android app with package name: `com.wandasalon.staff.staging`
- [ ] Add iOS app with bundle ID: `com.wandasalon.staff.staging`

#### For Production Environment:
- [ ] Create a new Firebase project for production (e.g., "wandastaff-production")
- [ ] Enable Authentication (Email/Password provider)
- [ ] Create Firestore database in production mode
- [ ] Enable Cloud Messaging
- [ ] Add Android app with package name: `com.wandasalon.staff`
- [ ] Add iOS app with bundle ID: `com.wandasalon.staff`

### 2. Download Configuration Files

#### Android Configuration Files:
1. **Staging**: In Firebase Console → Project Settings → Your Apps → Android (staging)
   - [ ] Click "Download google-services.json"
   - [ ] Save as `firebase/staging/google-services.json`

2. **Production**: In Firebase Console → Project Settings → Your Apps → Android (production)
   - [ ] Click "Download google-services.json"
   - [ ] Save as `firebase/production/google-services.json`

#### iOS Configuration Files:
1. **Staging**: In Firebase Console → Project Settings → Your Apps → iOS (staging)
   - [ ] Click "Download GoogleService-Info.plist"
   - [ ] Save as `firebase/staging/GoogleService-Info.plist`

2. **Production**: In Firebase Console → Project Settings → Your Apps → iOS (production)
   - [ ] Click "Download GoogleService-Info.plist"
   - [ ] Save as `firebase/production/GoogleService-Info.plist`

### 3. File Placement

Your project structure should look like this:
```
WandaStaff/
├── firebase/
│   ├── staging/
│   │   ├── google-services.json      ← Android staging config
│   │   └── GoogleService-Info.plist  ← iOS staging config
│   └── production/
│       ├── google-services.json      ← Android production config
│       └── GoogleService-Info.plist  ← iOS production config
├── .env.staging                      ← Staging environment variables
├── .env.production                   ← Production environment variables
└── app.config.ts                     ← Automatically references correct files
```

### 4. Environment Variables Setup

#### Update `.env.staging` with your staging Firebase config:
```bash
# Firebase Configuration - Staging Environment
FIREBASE_API_KEY=your_staging_api_key_here
FIREBASE_AUTH_DOMAIN=wandastaff-staging.firebaseapp.com
FIREBASE_PROJECT_ID=wandastaff-staging
FIREBASE_STORAGE_BUCKET=wandastaff-staging.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_staging_sender_id
FIREBASE_APP_ID=your_staging_app_id

# App Configuration - Staging
APP_NAME=WandaStaff Staging
APP_VERSION=1.0.0
ENVIRONMENT=staging

# Business Settings
DEFAULT_CLOCK_RADIUS_METERS=500
HOLIDAY_ALLOWANCE_DAYS=21
```

#### Update `.env.production` with your production Firebase config:
```bash
# Firebase Configuration - Production Environment
FIREBASE_API_KEY=your_production_api_key_here
FIREBASE_AUTH_DOMAIN=wandastaff-production.firebaseapp.com
FIREBASE_PROJECT_ID=wandastaff-production
FIREBASE_STORAGE_BUCKET=wandastaff-production.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
FIREBASE_APP_ID=your_production_app_id

# App Configuration - Production
APP_NAME=WandaStaff
APP_VERSION=1.0.0
ENVIRONMENT=production

# Business Settings
DEFAULT_CLOCK_RADIUS_METERS=500
HOLIDAY_ALLOWANCE_DAYS=21
```

## 🔍 Where to Find Configuration Values

### In Firebase Console:

1. **Project Settings** → **General** tab:
   - `FIREBASE_PROJECT_ID`: Found under "Project ID"
   - `FIREBASE_STORAGE_BUCKET`: Found under "Storage bucket"

2. **Project Settings** → **General** tab → **Your apps** section:
   - `FIREBASE_APP_ID`: Found under your app's configuration

3. **Project Settings** → **Cloud Messaging** tab:
   - `FIREBASE_MESSAGING_SENDER_ID`: Found under "Sender ID"

4. **Project Settings** → **Service accounts** tab → **Config** snippet:
   - `FIREBASE_API_KEY`: Found in the config object
   - `FIREBASE_AUTH_DOMAIN`: Found in the config object

## 🏗️ Building for Different Environments

### Staging Builds:
```bash
# Android Staging
npm run env:staging
npm run build:staging:android

# iOS Staging
npm run env:staging
npm run build:staging:ios
```

### Production Builds:
```bash
# Android Production
npm run env:production
npm run build:production:android

# iOS Production
npm run env:production
npm run build:production:ios
```

## ✅ Verification Guide

### Quick Verification Steps:

1. **Run the verification script:**
   ```bash
   npm run verify:firebase
   ```

2. **Check environment configuration:**
   ```bash
   npm run env:staging  # or env:production
   npm start
   ```

3. **Look for these logs in the console:**
   ```
   🔧 App Configuration:
      Environment: staging (or production)
      Firebase Project: your-project-id
      App Name: WandaStaff (Staging)
   ```

### Manual Verification:

#### Android Verification:
1. Build the app: `npm run build:staging:android`
2. Check build logs for Firebase initialization
3. Look for: `Firebase app initialized successfully`
4. Verify no configuration errors in logs

#### iOS Verification:
1. Build the app: `npm run build:staging:ios`
2. Check build logs for Firebase initialization
3. Look for: `Firebase app initialized successfully`
4. Verify no configuration errors in logs

### Common Issues & Solutions:

#### ❌ "Firebase app not initialized"
- **Cause**: Missing configuration files
- **Solution**: Ensure files are in correct `firebase/{environment}/` directories

#### ❌ "Invalid API key" or "Project not found"
- **Cause**: Incorrect environment variables
- **Solution**: Double-check `.env.staging` or `.env.production` values match Firebase console

#### ❌ "Bundle ID mismatch" (iOS) or "Package name mismatch" (Android)
- **Cause**: App configuration doesn't match Firebase project setup
- **Solution**: Verify bundle IDs in Firebase console match your app.config.ts settings

#### ❌ "Authentication domain invalid"
- **Cause**: Wrong FIREBASE_AUTH_DOMAIN in environment variables
- **Solution**: Use format: `your-project-id.firebaseapp.com`

## 🔒 Security Best Practices

- ✅ Configuration files are already in `.gitignore`
- ✅ Separate Firebase projects for staging/production
- ✅ Environment-specific API keys
- ✅ No hardcoded credentials in source code

## 📚 Additional Resources

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase React Native Documentation](https://rnfirebase.io/)
- [Expo Firebase Setup Guide](https://docs.expo.dev/guides/using-firebase/)

## 🆘 Getting Help

If you encounter issues:
1. Run the verification script: `npm run verify:firebase`
2. Check the Firebase console for project status
3. Verify all files are in the correct locations
4. Double-check environment variables match Firebase console values