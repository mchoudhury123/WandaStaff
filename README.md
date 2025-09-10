# WandaStaff - Salon Staff Mobile App

A React Native mobile application for salon staff that integrates with an existing Firebase-based salon CRM system.

## Features

- **Authentication**: Login using existing staff credentials
- **Location-based Clock In/Out**: GPS verification within 500m of business location
- **Schedule Management**: View daily and weekly schedules with appointments
- **Annual Leave Requests**: Submit and track holiday requests
- **Payslips**: View and download monthly salary statements
- **Commission Tracking**: Monitor sales performance and commission earnings
- **Push Notifications**: Receive updates about appointments and schedule changes

## Tech Stack

- React Native with TypeScript
- Firebase (Auth, Firestore, Cloud Messaging)
- React Navigation
- React Native Paper (UI Components)
- Expo Location Services
- React Native Maps

## Prerequisites

- Node.js >= 16
- React Native development environment
- Firebase project with existing CRM data
- Android Studio / Xcode for device testing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd WandaStaff
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Update `src/services/firebase.ts` with your Firebase configuration
   - Ensure Firebase collections match the expected structure

4. Install iOS pods (iOS only):
```bash
cd ios && pod install && cd ..
```

5. Run the application:
```bash
# Android
npm run android

# iOS  
npm run ios
```

## Firebase Collections Structure

The app expects the following Firestore collections:

### staff
```javascript
{
  firstName: string,
  lastName: string,
  email: string,
  role: 'stylist' | 'receptionist' | 'manager',
  businessId: string,
  phone: string,
  specialties?: string[],
  salary?: {
    basicSalary: number,
    allowance: number,
    transportation: number,
    housing: number,
    totalGross: number
  }
}
```

### businesses
```javascript
{
  name: string,
  location: { lat: number, lng: number },
  address: string,
  commissionStructure?: CommissionStructure
}
```

### clockRecords
```javascript
{
  userId: string,
  businessId: string,
  type: 'clock-in' | 'clock-out',
  timestamp: Timestamp,
  location: { lat: number, lng: number },
  address: string,
  distanceFromBusiness: number,
  userDetails: { name: string, email: string, role: string },
  businessDetails: { name: string, location: { lat: number, lng: number } }
}
```

### appointments
```javascript
{
  businessId: string,
  staffId: string,
  clientId: string,
  serviceId: string,
  date: string, // 'yyyy-MM-dd'
  time: string, // 'HH:MM'
  duration: number,
  status: string,
  notes?: string
}
```

### holidayRequests
```javascript
{
  staffId: string,
  staffName: string,
  startDate: string, // 'yyyy-MM-dd'
  endDate: string,
  days: number,
  reason: string,
  status: 'pending' | 'approved' | 'rejected' | 'cancelled',
  requestedAt: string
}
```

### rotas
```javascript
{
  staffId: string,
  businessId: string,
  week: number,
  year: number,
  schedules: [{
    day: 'monday' | 'tuesday' | ...,
    isWorking: boolean,
    startTime: string, // 'HH:MM'
    endTime: string
  }]
}
```

## Configuration

### Environment Variables
The app now uses `app.config.ts` for environment-aware builds. See `ENVIRONMENT-SETUP.md` for detailed configuration.

**Quick Setup:**
```bash
# Interactive environment setup
npm run env:setup staging

# Or manual setup
cp .env.staging .env
# Edit .env with your Firebase credentials
```

**Environment Variables:**
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your_app_id
APP_NAME=WandaStaff
APP_VERSION=1.0.0
ENVIRONMENT=staging
DEFAULT_CLOCK_RADIUS_METERS=500
HOLIDAY_ALLOWANCE_DAYS=21
```

### Firebase Configuration Files
1. Configure Firebase Cloud Messaging in your Firebase console
2. Add your Android/iOS app to the Firebase project
3. Download and place configuration files in project root:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS

**Note:** The app now uses `app.config.ts` which automatically references these files.

## Building for Production

### Android
```bash
npm run build:android
```

### iOS
```bash
npm run build:ios
```

## Testing

The app includes location-based clock in/out functionality that requires:
- Location permissions
- GPS accuracy
- Network connectivity for Firebase operations

Test on physical devices for best results, especially for location features.

## Security Considerations

- All Firebase security rules should be properly configured
- Staff authentication is required for all operations
- Location data is only used for clock in/out verification
- No sensitive data is stored locally beyond authentication tokens

## Support

For technical support or feature requests, contact the development team or refer to the project documentation.

## License

Copyright © 2024 Wanda Salon. All rights reserved.