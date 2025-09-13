import { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Expo App Configuration with Environment Variable Support
 * 
 * This configuration file allows the app to read environment variables
 * at build time and configure the app accordingly for different environments.
 * 
 * Usage:
 * - Staging: npm run env:staging && npm run build:staging:android
 * - Production: npm run env:production && npm run build:production:android
 */

export default ({ config }: ConfigContext): ExpoConfig => {
  // Get environment variables directly from process.env
  const environment = process.env.ENVIRONMENT || 'development';
  const appName = process.env.APP_NAME || 'WandaStaff';
  const appVersion = process.env.APP_VERSION || '1.0.0';
  
  // Firebase configuration from environment variables (WANDA CRM defaults)
  const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyAgFCCTja8jE8FgUJuPCm9jDV5z93pq55k',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'nail-salon-crm.firebaseapp.com',
    projectId: process.env.FIREBASE_PROJECT_ID || 'nail-salon-crm',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'nail-salon-crm.firebasestorage.app',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '1084934404328',
    appId: process.env.FIREBASE_APP_ID || '1:1084934404328:web:17b0800ae64bc69ca3b15d'
  };
  
  // Business settings from environment variables
  const businessConfig = {
    defaultClockRadiusMeters: parseInt(process.env.DEFAULT_CLOCK_RADIUS_METERS || '500', 10),
    holidayAllowanceDays: parseInt(process.env.HOLIDAY_ALLOWANCE_DAYS || '21', 10)
  };
  
  // Environment-specific bundle identifier suffix
  const bundleIdSuffix = environment === 'staging' ? '.staging' : '';
  
  // Environment-specific Firebase configuration file paths
  const firebaseBasePath = `./firebase/${environment}`;
  const googleServicesFile = `${firebaseBasePath}/google-services.json`;
  const googleServicesPlist = `${firebaseBasePath}/GoogleService-Info.plist`;
  
  return {
    expo: {
      name: appName,
      slug: 'wanda-staff',
      version: appVersion,
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff'
      },
      assetBundlePatterns: [
        '**/*'
      ],
      
      // iOS Configuration
      ios: {
        supportsTablet: true,
        bundleIdentifier: `com.wandasalon.staff${bundleIdSuffix}`,
        // Firebase configuration files (environment-specific)
        googleServicesFile: googleServicesPlist
      },
      
      // Android Configuration
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
        // Firebase configuration files (environment-specific)
        googleServicesFile: googleServicesFile
      },
      
      // Web Configuration
      web: {
        favicon: './assets/favicon.png',
        template: './web/index.html'
      },
      
      // Plugins Configuration
      plugins: [
        [
          'expo-location',
          {
            locationAlwaysAndWhenInUsePermission: `Allow ${appName} to use your location for clock in/out verification.`
          }
        ],
        [
          'expo-notifications',
          {
            icon: './assets/notification-icon.png',
            color: '#ffffff'
          }
        ]
      ],
      
      // Environment Variables Exposure
      // This section exposes environment variables to the app at build time
      extra: {
        // Environment information
        environment: environment,
        appName: appName,
        appVersion: appVersion,
        
        // Firebase configuration (for runtime access if needed)
        firebase: {
          apiKey: firebaseConfig.apiKey,
          authDomain: firebaseConfig.authDomain,
          projectId: firebaseConfig.projectId,
          storageBucket: firebaseConfig.storageBucket,
          messagingSenderId: firebaseConfig.messagingSenderId,
          appId: firebaseConfig.appId
        },
        
        // Business configuration
        business: {
          defaultClockRadiusMeters: businessConfig.defaultClockRadiusMeters,
          holidayAllowanceDays: businessConfig.holidayAllowanceDays
        },
        
        // Build information
        buildInfo: {
          buildTime: new Date().toISOString(),
          environment: environment,
          version: appVersion
        }
      }
    }
  };
};
