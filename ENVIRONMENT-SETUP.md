# Environment Configuration Guide

This guide explains how to configure and use environment variables for different deployment environments (staging vs production).

## 📋 Overview

The app now uses environment variables for:
- **Firebase Configuration**: API keys, project IDs, storage buckets
- **App Settings**: Name, version, environment type
- **Business Settings**: Clock radius, holiday allowance

## 🔧 Environment Files

### Available Environment Files

- `.env.staging` - Staging environment configuration
- `.env.production` - Production environment configuration
- `.env` - Development environment (optional, uses fallbacks)

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `FIREBASE_API_KEY` | Firebase API key | `AIzaSyAgFCCTja8jE8FgUJuPCm9jDV5z93pq55k` |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `your-project.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `your-project-id` |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `your-project.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abcdef123456` |
| `APP_NAME` | Application name | `WandaStaff` |
| `APP_VERSION` | Application version | `1.0.0` |
| `ENVIRONMENT` | Environment type | `staging` or `production` |
| `DEFAULT_CLOCK_RADIUS_METERS` | Clock-in radius in meters | `500` |
| `HOLIDAY_ALLOWANCE_DAYS` | Annual holiday allowance | `21` |

## 🚀 Setup Instructions

### 1. Configure Environment Files

**For Staging:**
```bash
# Copy and edit staging environment
cp .env.staging .env
# Edit .env with your staging Firebase credentials
```

**For Production:**
```bash
# Copy and edit production environment
cp .env.production .env
# Edit .env with your production Firebase credentials
```

### 2. Update Firebase Credentials

Edit the `.env` file with your actual Firebase project credentials:

```bash
# Get these from Firebase Console > Project Settings > General
FIREBASE_API_KEY=your_actual_api_key
FIREBASE_AUTH_DOMAIN=your-actual-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_STORAGE_BUCKET=your-actual-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
FIREBASE_APP_ID=your_actual_app_id
```

### 3. Customize Business Settings

Adjust business-specific settings:

```bash
# Clock-in radius (meters)
DEFAULT_CLOCK_RADIUS_METERS=500

# Annual holiday allowance (days)
HOLIDAY_ALLOWANCE_DAYS=21
```

## 🏗️ Build Process

### Development Build

```bash
# Use staging environment
cp .env.staging .env
npm run start
```

### Staging Build

```bash
# Use staging environment
cp .env.staging .env
npm run build:android  # or build:ios
```

### Production Build

```bash
# Use production environment
cp .env.production .env
npm run build:android  # or build:ios
```

## 📱 Platform-Specific Builds

### Android

```bash
# Staging
cp .env.staging .env
npm run build:android

# Production
cp .env.production .env
npm run build:android
```

### iOS

```bash
# Staging
cp .env.staging .env
npm run build:ios

# Production
cp .env.production .env
npm run build:ios
```

## 🔍 Verification

### Check Configuration

The app will validate configuration on startup and log any issues:

```bash
# Start the app and check console output
npm run start
```

Look for:
- ✅ `Firebase initialized with:`
- ✅ `App Configuration:`
- ❌ Any validation errors

### Test Environment Variables

```bash
# Check if environment variables are loaded
node -e "console.log(require('@env'))"
```

## 🛠️ Development Workflow

### 1. Local Development

```bash
# Use staging environment for development
cp .env.staging .env
npm run start
```

### 2. Testing

```bash
# Test with staging data
cp .env.staging .env
npm run start
```

### 3. Production Deployment

```bash
# Build for production
cp .env.production .env
npm run build:android
```

## 🔒 Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### 2. Use Different Projects

- **Staging**: Use a separate Firebase project for testing
- **Production**: Use your main Firebase project
- **Development**: Use staging project or local Firebase emulator

### 3. Environment-Specific Settings

```bash
# Staging - More permissive for testing
DEFAULT_CLOCK_RADIUS_METERS=1000
HOLIDAY_ALLOWANCE_DAYS=30

# Production - Strict business rules
DEFAULT_CLOCK_RADIUS_METERS=500
HOLIDAY_ALLOWANCE_DAYS=21
```

## 🚨 Troubleshooting

### Common Issues

**1. Environment variables not loading:**
```bash
# Check babel.config.js has react-native-dotenv plugin
# Restart Metro bundler
npm run start -- --reset-cache
```

**2. Firebase connection errors:**
```bash
# Verify Firebase credentials in .env
# Check Firebase project is active
# Ensure API keys are correct
```

**3. Build failures:**
```bash
# Clear cache and rebuild
npm run build:android -- --clear-cache
```

### Debug Configuration

```bash
# Add to your component for debugging
import { AppConstants } from '../config/Constants';
console.log('Config:', AppConstants);
```

## 📋 Checklist

### Before Deployment

- [ ] Environment file configured with correct Firebase credentials
- [ ] Business settings match requirements
- [ ] App name and version are correct
- [ ] Environment type is set correctly
- [ ] All hardcoded values removed from code
- [ ] Configuration validation passes
- [ ] App boots without errors

### Environment-Specific Checklist

**Staging:**
- [ ] Uses staging Firebase project
- [ ] Has test-friendly settings
- [ ] App name includes "Staging"
- [ ] Environment set to "staging"

**Production:**
- [ ] Uses production Firebase project
- [ ] Has business-appropriate settings
- [ ] App name is clean (no "Staging")
- [ ] Environment set to "production"

## 🔄 Migration from Hardcoded Values

If migrating from hardcoded values:

1. **Identify hardcoded values** in your codebase
2. **Add to environment files** with appropriate values
3. **Update code** to use `AppConstants` instead of hardcoded values
4. **Test** with different environments
5. **Deploy** with environment-specific builds

## 📞 Support

If you encounter issues:

1. **Check environment file** is properly configured
2. **Verify Firebase credentials** are correct
3. **Restart Metro bundler** with cache reset
4. **Check console logs** for validation errors
5. **Test with different environment** files

---

**Remember: Always test your configuration in staging before deploying to production!**
