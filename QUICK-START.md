# Quick Start Guide

## 🚀 Environment-Aware Builds

### Staging Build
```bash
npm run env:staging
npm run build:staging:android
```

### Production Build
```bash
npm run env:production
npm run build:production:android
```

## 🔧 Setup

### 1. Configure Environment
```bash
npm run env:setup staging
```

### 2. Add Firebase Files
- Download `google-services.json` from Firebase Console
- Download `GoogleService-Info.plist` from Firebase Console
- Place both files in project root

### 3. Build & Deploy
```bash
npm run build:production:android
```

## 📱 What Changes Per Environment

| Setting | Staging | Production |
|---------|---------|------------|
| App Name | "WandaStaff Staging" | "WandaStaff" |
| Bundle ID | `com.wandasalon.staff.staging` | `com.wandasalon.staff` |
| Environment | "staging" | "production" |
| Firebase Project | Staging project | Production project |

## 📖 Full Documentation

- **Environment Setup**: `ENVIRONMENT-SETUP.md`
- **App Configuration**: `APP-CONFIG-GUIDE.md`
- **Data Reset**: `DATA-RESET-GUIDE.md`
