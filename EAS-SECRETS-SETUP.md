# EAS Secrets Setup Guide for WandaStaff

This guide explains how to configure EAS Secrets for secure environment variable management in Expo Application Services (EAS) builds, while maintaining local development flexibility.

## 📋 Overview

**EAS Secrets** allow you to securely store environment variables in Expo's cloud infrastructure for CI/CD builds, while keeping your local development environment using `.env` files.

### Architecture:
- **Local Development**: Uses `.env`, `.env.staging`, `.env.production` files
- **EAS Builds**: Uses EAS Secrets stored in Expo's secure infrastructure
- **Environment Separation**: Staging and production secrets are completely isolated

## 🛠️ Prerequisites

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Initialize EAS (if not already done)
```bash
eas build:configure
```

## 🔐 Step-by-Step EAS Secrets Configuration

### Step 1: Identify Environment Variables

First, let's confirm all environment variables that need to be stored as secrets:

```bash
# Check current environment variables
cat .env.staging | grep -v '^#' | grep -v '^$'
cat .env.production | grep -v '^#' | grep -v '^$'
```

**Required Variables:**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `APP_NAME`
- `APP_VERSION`
- `ENVIRONMENT`
- `DEFAULT_CLOCK_RADIUS_METERS`
- `HOLIDAY_ALLOWANCE_DAYS`

### Step 2: Create EAS Secrets via CLI

#### For Staging Environment:

```bash
# Firebase Configuration - Staging
eas secret:create --scope project --name FIREBASE_API_KEY_STAGING --value "your_staging_api_key_here"
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN_STAGING --value "wandastaff-staging.firebaseapp.com"
eas secret:create --scope project --name FIREBASE_PROJECT_ID_STAGING --value "wandastaff-staging"
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET_STAGING --value "wandastaff-staging.appspot.com"
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID_STAGING --value "your_staging_sender_id"
eas secret:create --scope project --name FIREBASE_APP_ID_STAGING --value "your_staging_app_id"

# App Configuration - Staging
eas secret:create --scope project --name APP_NAME_STAGING --value "WandaStaff Staging"
eas secret:create --scope project --name APP_VERSION_STAGING --value "1.0.0"
eas secret:create --scope project --name ENVIRONMENT_STAGING --value "staging"

# Business Settings - Staging
eas secret:create --scope project --name DEFAULT_CLOCK_RADIUS_METERS_STAGING --value "500"
eas secret:create --scope project --name HOLIDAY_ALLOWANCE_DAYS_STAGING --value "21"
```

#### For Production Environment:

```bash
# Firebase Configuration - Production
eas secret:create --scope project --name FIREBASE_API_KEY_PRODUCTION --value "your_production_api_key_here"
eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN_PRODUCTION --value "wandastaff-production.firebaseapp.com"
eas secret:create --scope project --name FIREBASE_PROJECT_ID_PRODUCTION --value "wandastaff-production"
eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET_PRODUCTION --value "wandastaff-production.appspot.com"
eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID_PRODUCTION --value "your_production_sender_id"
eas secret:create --scope project --name FIREBASE_APP_ID_PRODUCTION --value "your_production_app_id"

# App Configuration - Production
eas secret:create --scope project --name APP_NAME_PRODUCTION --value "WandaStaff"
eas secret:create --scope project --name APP_VERSION_PRODUCTION --value "1.0.0"
eas secret:create --scope project --name ENVIRONMENT_PRODUCTION --value "production"

# Business Settings - Production
eas secret:create --scope project --name DEFAULT_CLOCK_RADIUS_METERS_PRODUCTION --value "500"
eas secret:create --scope project --name HOLIDAY_ALLOWANCE_DAYS_PRODUCTION --value "21"
```

### Step 3: Verify Secrets via CLI

```bash
# List all secrets
eas secret:list

# Check specific secret (without revealing value)
eas secret:list --name FIREBASE_API_KEY_STAGING
```

## 🌐 EAS Dashboard Method (Alternative)

### Via Expo Dashboard:

1. **Navigate to Your Project**:
   - Go to [expo.dev](https://expo.dev)
   - Select your WandaStaff project

2. **Access Secrets**:
   - Click on "Settings" in the left sidebar
   - Select "Secrets" tab

3. **Add Secrets**:
   - Click "Create a new secret"
   - Enter name (e.g., `FIREBASE_API_KEY_STAGING`)
   - Enter value
   - Click "Save"

4. **Repeat for All Variables**:
   - Add all staging secrets with `_STAGING` suffix
   - Add all production secrets with `_PRODUCTION` suffix

## ⚙️ Update EAS Configuration

### Update `eas.json`:

```json
{
  "cli": {
    "version": ">= 13.2.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "staging": {
      "env": {
        "FIREBASE_API_KEY": "$FIREBASE_API_KEY_STAGING",
        "FIREBASE_AUTH_DOMAIN": "$FIREBASE_AUTH_DOMAIN_STAGING",
        "FIREBASE_PROJECT_ID": "$FIREBASE_PROJECT_ID_STAGING",
        "FIREBASE_STORAGE_BUCKET": "$FIREBASE_STORAGE_BUCKET_STAGING",
        "FIREBASE_MESSAGING_SENDER_ID": "$FIREBASE_MESSAGING_SENDER_ID_STAGING",
        "FIREBASE_APP_ID": "$FIREBASE_APP_ID_STAGING",
        "APP_NAME": "$APP_NAME_STAGING",
        "APP_VERSION": "$APP_VERSION_STAGING",
        "ENVIRONMENT": "$ENVIRONMENT_STAGING",
        "DEFAULT_CLOCK_RADIUS_METERS": "$DEFAULT_CLOCK_RADIUS_METERS_STAGING",
        "HOLIDAY_ALLOWANCE_DAYS": "$HOLIDAY_ALLOWANCE_DAYS_STAGING"
      }
    },
    "production": {
      "env": {
        "FIREBASE_API_KEY": "$FIREBASE_API_KEY_PRODUCTION",
        "FIREBASE_AUTH_DOMAIN": "$FIREBASE_AUTH_DOMAIN_PRODUCTION",
        "FIREBASE_PROJECT_ID": "$FIREBASE_PROJECT_ID_PRODUCTION",
        "FIREBASE_STORAGE_BUCKET": "$FIREBASE_STORAGE_BUCKET_PRODUCTION",
        "FIREBASE_MESSAGING_SENDER_ID": "$FIREBASE_MESSAGING_SENDER_ID_PRODUCTION",
        "FIREBASE_APP_ID": "$FIREBASE_APP_ID_PRODUCTION",
        "APP_NAME": "$APP_NAME_PRODUCTION",
        "APP_VERSION": "$APP_VERSION_PRODUCTION",
        "ENVIRONMENT": "$ENVIRONMENT_PRODUCTION",
        "DEFAULT_CLOCK_RADIUS_METERS": "$DEFAULT_CLOCK_RADIUS_METERS_PRODUCTION",
        "HOLIDAY_ALLOWANCE_DAYS": "$HOLIDAY_ALLOWANCE_DAYS_PRODUCTION"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 🏠 Local Development Configuration

### Ensure Local Development Still Works:

**Local development continues to use `.env` files:**

1. **Keep existing `.env` files**:
   - `.env.staging` - for local staging testing
   - `.env.production` - for local production testing
   - `.env` - created by `npm run env:staging` or `npm run env:production`

2. **Local commands remain the same**:
   ```bash
   npm run env:staging  # Uses .env.staging locally
   npm start           # Uses local .env file
   ```

3. **EAS builds use secrets**:
   ```bash
   eas build --profile staging    # Uses EAS Secrets
   eas build --profile production # Uses EAS Secrets
   ```

## 📦 Update Package.json Scripts

Add EAS build scripts to your `package.json`:

```json
{
  "scripts": {
    "build:eas:staging:android": "eas build --platform android --profile staging",
    "build:eas:staging:ios": "eas build --platform ios --profile staging",
    "build:eas:production:android": "eas build --platform android --profile production",
    "build:eas:production:ios": "eas build --platform ios --profile production",
    "build:eas:all:staging": "eas build --platform all --profile staging",
    "build:eas:all:production": "eas build --platform all --profile production"
  }
}
```

## ✅ Test Checklist

### 1. Verify EAS Secrets Are Set

```bash
# Check all secrets exist
eas secret:list | grep STAGING
eas secret:list | grep PRODUCTION

# Should show all required secrets for both environments
```

### 2. Test Local Development Still Works

```bash
# Test staging locally
npm run env:staging
npm start
# ✅ Should start without errors using .env.staging

# Test production locally  
npm run env:production
npm start
# ✅ Should start without errors using .env.production
```

### 3. Test EAS Builds Use Correct Secrets

#### Staging Build Test:
```bash
eas build --platform android --profile staging --no-wait
```

**Expected Results:**
- ✅ Build starts successfully
- ✅ Uses staging Firebase project ID
- ✅ App name shows "WandaStaff Staging"
- ✅ Bundle ID includes `.staging` suffix

#### Production Build Test:
```bash
eas build --platform android --profile production --no-wait
```

**Expected Results:**
- ✅ Build starts successfully  
- ✅ Uses production Firebase project ID
- ✅ App name shows "WandaStaff"
- ✅ Bundle ID has no suffix

### 4. Verify Build Configuration

Check EAS build logs for confirmation:

```bash
# Monitor build progress
eas build:list

# Check specific build details
eas build:view [BUILD_ID]
```

**Look for in build logs:**
- ✅ `Environment: staging` or `Environment: production`
- ✅ Correct Firebase project ID in configuration
- ✅ No "undefined" or missing environment variables

### 5. Test App Functionality

After builds complete:

**Staging App:**
- ✅ Firebase connects to staging project
- ✅ App name displays as "WandaStaff Staging"
- ✅ Clock radius uses configured value (500m)

**Production App:**
- ✅ Firebase connects to production project
- ✅ App name displays as "WandaStaff"
- ✅ Clock radius uses configured value (500m)

## 🔧 Troubleshooting

### Common Issues:

#### ❌ "Secret not found" during build
**Solution:**
```bash
# Verify secret exists
eas secret:list --name FIREBASE_API_KEY_STAGING

# If missing, create it
eas secret:create --scope project --name FIREBASE_API_KEY_STAGING --value "your_value"
```

#### ❌ Local development breaks
**Solution:**
- Ensure `.env.staging` and `.env.production` files still exist
- Run `npm run env:staging` to recreate `.env` file

#### ❌ Wrong environment in build
**Solution:**
- Check `eas.json` profile configuration
- Verify secret names match exactly (case-sensitive)

#### ❌ Firebase connection fails in built app
**Solution:**
- Verify Firebase config files in correct directories
- Check EAS build logs for configuration errors
- Confirm secret values match Firebase Console

### Useful Commands:

```bash
# Update existing secret
eas secret:create --scope project --name FIREBASE_API_KEY_STAGING --value "new_value" --force

# Delete secret
eas secret:delete --scope project --name SECRET_NAME

# Build with verbose logging
eas build --platform android --profile staging --clear-cache
```

## 🔒 Security Best Practices

- ✅ **Never commit `.env` files with real values**
- ✅ **Use different Firebase projects for staging/production**
- ✅ **Regularly rotate API keys and secrets**
- ✅ **Use project-scoped secrets (not account-scoped)**
- ✅ **Monitor EAS build logs for exposed secrets**

## 📚 Additional Resources

- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Expo CLI Reference](https://docs.expo.dev/workflow/expo-cli/)

---

## 🚀 Quick Start Summary

1. **Set up EAS secrets**: `eas secret:create` for all variables
2. **Update eas.json**: Add staging/production profiles with env mappings
3. **Test locally**: `npm run env:staging && npm start`
4. **Test EAS builds**: `eas build --profile staging`
5. **Verify**: Check build logs and app functionality

Your WandaStaff app now has secure, environment-separated configuration for both local development and cloud builds!