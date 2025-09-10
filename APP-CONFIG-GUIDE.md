# App Configuration Guide (app.config.ts)

This guide explains how to use the new `app.config.ts` file for environment-aware builds and configuration management.

## 📋 Overview

The app now uses `app.config.ts` instead of `app.json` to:
- **Read environment variables** at build time
- **Configure platform-specific settings** (iOS/Android)
- **Expose configuration** to the app runtime
- **Support multiple environments** (staging/production)

## 🔧 Configuration Structure

### Environment Variables Integration

The `app.config.ts` file reads from:
1. **Environment variables** (`.env` files)
2. **AppConstants** (centralized configuration)
3. **Build-time configuration** (Expo extra)

### Platform Configuration

#### iOS Configuration
```typescript
ios: {
  supportsTablet: true,
  bundleIdentifier: `com.wandasalon.staff${bundleIdSuffix}`,
  googleServicesFile: './google-services.json'
}
```

#### Android Configuration
```typescript
android: {
  adaptiveIcon: {
    foregroundImage: './assets/adaptive-icon.png',
    backgroundColor: '#FFFFFF'
  },
  package: `com.wandasalon.staff${bundleIdSuffix}`,
  permissions: [
    'ACCESS_FINE_LOCATION',
    'ACCESS_COARSE_LOCATION',
    'RECEIVE_BOOT_COMPLETED',
    'VIBRATE'
  ],
  googleServicesFile: './google-services.json'
}
```

### Environment Exposure

The `extra` section exposes configuration to the app:

```typescript
extra: {
  environment: environment,
  appName: appName,
  appVersion: appVersion,
  firebase: { /* Firebase config */ },
  business: { /* Business settings */ },
  buildInfo: { /* Build metadata */ }
}
```

## 🚀 Usage Instructions

### Staging Builds

```bash
# Set staging environment
npm run env:staging

# Build for staging
npm run build:staging:android
npm run build:staging:ios
```

**Result:**
- App name: "WandaStaff Staging"
- Bundle ID: `com.wandasalon.staff.staging`
- Environment: "staging"

### Production Builds

```bash
# Set production environment
npm run env:production

# Build for production
npm run build:production:android
npm run build:production:ios
```

**Result:**
- App name: "WandaStaff"
- Bundle ID: `com.wandasalon.staff`
- Environment: "production"

## 📱 Firebase Configuration Files

### Required Files

Place these files in the project root:

1. **`google-services.json`** - Android Firebase configuration
2. **`GoogleService-Info.plist`** - iOS Firebase configuration

### File Locations

```
WandaStaff/
├── google-services.json          # Android Firebase config
├── GoogleService-Info.plist      # iOS Firebase config
├── app.config.ts                 # App configuration
└── .env                          # Environment variables
```

### Getting Firebase Files

1. **Go to Firebase Console** > Project Settings
2. **Download configuration files:**
   - Android: `google-services.json`
   - iOS: `GoogleService-Info.plist`
3. **Place in project root** (same level as `app.config.ts`)

## 🔍 Accessing Configuration at Runtime

### Using ExpoConfig Module

```typescript
import { getExpoConfig, getExpoEnvironment } from '../config/ExpoConfig';

// Get full configuration
const config = getExpoConfig();

// Get specific values
const environment = getExpoEnvironment();
const appName = getExpoAppName();
const firebaseConfig = getExpoFirebaseConfig();
```

### Using AppConstants (Recommended)

```typescript
import { AppConstants } from '../config/Constants';

// Access configuration (includes Expo fallbacks)
const environment = AppConstants.app.environment;
const clockRadius = AppConstants.business.defaultClockRadiusMeters;
const holidayAllowance = AppConstants.business.holidayAllowanceDays;
```

## 🛠️ Development Workflow

### 1. Environment Setup

```bash
# Interactive setup
npm run env:setup staging

# Or manual setup
cp .env.staging .env
# Edit .env with your Firebase credentials
```

### 2. Firebase Files Setup

```bash
# Download from Firebase Console and place in root:
# - google-services.json
# - GoogleService-Info.plist
```

### 3. Development

```bash
# Start development server
npm run start
```

### 4. Building

```bash
# Staging build
npm run build:staging:android

# Production build
npm run build:production:android
```

## 🔒 Security Considerations

### Environment Files

- **Never commit** `.env` files to version control
- **Use different Firebase projects** for staging/production
- **Rotate API keys** regularly

### Firebase Files

- **Keep Firebase files secure** - they contain sensitive information
- **Use different projects** for different environments
- **Monitor access** to Firebase projects

## 📋 Configuration Checklist

### Before Building

- [ ] Environment file configured (`.env`)
- [ ] Firebase files in place (`google-services.json`, `GoogleService-Info.plist`)
- [ ] App name and version correct
- [ ] Bundle identifiers appropriate for environment
- [ ] Firebase project matches environment
- [ ] Business settings configured

### Environment-Specific Checklist

**Staging:**
- [ ] Uses staging Firebase project
- [ ] App name includes "Staging"
- [ ] Bundle ID includes `.staging` suffix
- [ ] Environment set to "staging"

**Production:**
- [ ] Uses production Firebase project
- [ ] App name is clean (no "Staging")
- [ ] Bundle ID is clean (no `.staging`)
- [ ] Environment set to "production"

## 🚨 Troubleshooting

### Common Issues

**1. Configuration not loading:**
```bash
# Check environment file exists
ls -la .env

# Check Firebase files exist
ls -la google-services.json GoogleService-Info.plist

# Restart Metro bundler
npm run start -- --reset-cache
```

**2. Build failures:**
```bash
# Check bundle identifiers are unique
# Verify Firebase files are valid JSON/XML
# Ensure environment variables are set
```

**3. Runtime errors:**
```bash
# Check Expo configuration access
import { logExpoConfig } from '../config/ExpoConfig';
logExpoConfig(); // Logs configuration in development
```

### Debug Configuration

```typescript
// Add to your component for debugging
import { AppConstants } from '../config/Constants';
import { logExpoConfig } from '../config/ExpoConfig';

console.log('App Constants:', AppConstants);
logExpoConfig(); // Logs Expo configuration
```

## 🔄 Migration from app.json

### What Changed

1. **File format**: `app.json` → `app.config.ts`
2. **Environment support**: Static → Dynamic
3. **Configuration access**: Build-time → Runtime
4. **Firebase integration**: Manual → Automatic

### Migration Steps

1. **Backup** your current `app.json`
2. **Create** `app.config.ts` (already done)
3. **Add** Firebase configuration files
4. **Update** environment variables
5. **Test** builds with different environments

## 📞 Support

If you encounter issues:

1. **Check environment file** is properly configured
2. **Verify Firebase files** are in the correct location
3. **Ensure bundle identifiers** are unique
4. **Test with different environments**
5. **Check console logs** for configuration errors

---

**Remember: Always test your configuration in staging before deploying to production!**
