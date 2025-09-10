/**
 * Expo Configuration Access
 * 
 * This module provides access to environment variables exposed through
 * the app.config.ts file at build time. These values are available
 * through Expo's Constants.expoConfig.extra.
 */

import Constants from 'expo-constants';

// Type definitions for the exposed configuration
export interface ExpoFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface ExpoBusinessConfig {
  defaultClockRadiusMeters: number;
  holidayAllowanceDays: number;
}

export interface ExpoBuildInfo {
  buildTime: string;
  environment: string;
  version: string;
}

export interface ExpoExtraConfig {
  environment: string;
  appName: string;
  appVersion: string;
  firebase: ExpoFirebaseConfig;
  business: ExpoBusinessConfig;
  buildInfo: ExpoBuildInfo;
}

// Access the exposed configuration
export const getExpoConfig = (): ExpoExtraConfig | null => {
  try {
    const extra = Constants.expoConfig?.extra as ExpoExtraConfig;
    return extra || null;
  } catch (error) {
    console.warn('Could not access Expo configuration:', error);
    return null;
  }
};

// Convenience functions to access specific configuration sections
export const getExpoEnvironment = (): string => {
  const config = getExpoConfig();
  return config?.environment || 'development';
};

export const getExpoAppName = (): string => {
  const config = getExpoConfig();
  return config?.appName || 'WandaStaff';
};

export const getExpoAppVersion = (): string => {
  const config = getExpoConfig();
  return config?.appVersion || '1.0.0';
};

export const getExpoFirebaseConfig = (): ExpoFirebaseConfig | null => {
  const config = getExpoConfig();
  return config?.firebase || null;
};

export const getExpoBusinessConfig = (): ExpoBusinessConfig | null => {
  const config = getExpoConfig();
  return config?.business || null;
};

export const getExpoBuildInfo = (): ExpoBuildInfo | null => {
  const config = getExpoConfig();
  return config?.buildInfo || null;
};

// Development helper to log all configuration
export const logExpoConfig = () => {
  const config = getExpoConfig();
  if (config && __DEV__) {
    console.log('🔧 Expo Configuration:');
    console.log(`   Environment: ${config.environment}`);
    console.log(`   App Name: ${config.appName}`);
    console.log(`   Version: ${config.appVersion}`);
    console.log(`   Firebase Project: ${config.firebase.projectId}`);
    console.log(`   Clock Radius: ${config.business.defaultClockRadiusMeters}m`);
    console.log(`   Holiday Allowance: ${config.business.holidayAllowanceDays} days`);
    console.log(`   Build Time: ${config.buildInfo.buildTime}`);
  }
};

export default getExpoConfig;
