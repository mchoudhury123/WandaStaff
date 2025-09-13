/**
 * App Configuration Constants
 * 
 * This module provides centralized access to environment variables
 * and app configuration settings. It ensures type safety and
 * provides fallback values for development.
 */

import Constants from 'expo-constants';

// Get values from Expo constants (set by app.config.ts)
const expoExtra = Constants.expoConfig?.extra || {};

// Environment variables with fallbacks from Expo config (WANDA CRM defaults)
const config = {
  // Firebase Configuration
  FIREBASE_API_KEY: expoExtra.firebase?.apiKey || 'AIzaSyAgFCCTja8jE8FgUJuPCm9jDV5z93pq55k',
  FIREBASE_AUTH_DOMAIN: expoExtra.firebase?.authDomain || 'nail-salon-crm.firebaseapp.com',
  FIREBASE_PROJECT_ID: expoExtra.firebase?.projectId || 'nail-salon-crm',
  FIREBASE_STORAGE_BUCKET: expoExtra.firebase?.storageBucket || 'nail-salon-crm.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: expoExtra.firebase?.messagingSenderId || '1084934404328',
  FIREBASE_APP_ID: expoExtra.firebase?.appId || '1:1084934404328:web:17b0800ae64bc69ca3b15d',

  // App Configuration
  APP_NAME: expoExtra.appName || 'WandaStaff',
  APP_VERSION: expoExtra.appVersion || '1.0.0',
  ENVIRONMENT: expoExtra.environment || 'development',

  // Business Settings
  DEFAULT_CLOCK_RADIUS_METERS: expoExtra.business?.defaultClockRadiusMeters || 500,
  HOLIDAY_ALLOWANCE_DAYS: expoExtra.business?.holidayAllowanceDays || 21,
};

// Type definitions for better TypeScript support
export interface AppConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  business: {
    defaultClockRadiusMeters: number;
    holidayAllowanceDays: number;
  };
}

// Structured configuration object
export const AppConstants: AppConfig = {
  firebase: {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_AUTH_DOMAIN,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID,
  },
  app: {
    name: config.APP_NAME,
    version: config.APP_VERSION,
    environment: config.ENVIRONMENT as 'development' | 'staging' | 'production',
  },
  business: {
    defaultClockRadiusMeters: config.DEFAULT_CLOCK_RADIUS_METERS,
    holidayAllowanceDays: config.HOLIDAY_ALLOWANCE_DAYS,
  },
};

// Export individual values for convenience
export const FIREBASE_API_KEY = config.FIREBASE_API_KEY;
export const FIREBASE_AUTH_DOMAIN = config.FIREBASE_AUTH_DOMAIN;
export const FIREBASE_PROJECT_ID = config.FIREBASE_PROJECT_ID;
export const FIREBASE_STORAGE_BUCKET = config.FIREBASE_STORAGE_BUCKET;
export const FIREBASE_MESSAGING_SENDER_ID = config.FIREBASE_MESSAGING_SENDER_ID;
export const FIREBASE_APP_ID = config.FIREBASE_APP_ID;
export const APP_NAME = config.APP_NAME;
export const APP_VERSION = config.APP_VERSION;
export const ENVIRONMENT = config.ENVIRONMENT;
export const DEFAULT_CLOCK_RADIUS_METERS = config.DEFAULT_CLOCK_RADIUS_METERS;
export const HOLIDAY_ALLOWANCE_DAYS = config.HOLIDAY_ALLOWANCE_DAYS;

// Validation function to ensure required values are present
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check Firebase configuration
  if (!config.FIREBASE_API_KEY || config.FIREBASE_API_KEY.length < 10) {
    errors.push('FIREBASE_API_KEY is not properly configured');
  }
  if (!config.FIREBASE_PROJECT_ID || config.FIREBASE_PROJECT_ID.length < 3) {
    errors.push('FIREBASE_PROJECT_ID is not properly configured');
  }
  if (!config.FIREBASE_AUTH_DOMAIN || !config.FIREBASE_AUTH_DOMAIN.includes('.firebaseapp.com')) {
    errors.push('FIREBASE_AUTH_DOMAIN is not properly configured');
  }

  // Check business settings
  if (config.DEFAULT_CLOCK_RADIUS_METERS <= 0) {
    errors.push('DEFAULT_CLOCK_RADIUS_METERS must be greater than 0');
  }
  if (config.HOLIDAY_ALLOWANCE_DAYS <= 0) {
    errors.push('HOLIDAY_ALLOWANCE_DAYS must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Development helper to log configuration
export const logConfig = () => {
  if (config.ENVIRONMENT === 'development') {
    console.log('🔧 App Configuration:');
    console.log(`   Environment: ${config.ENVIRONMENT}`);
    console.log(`   App Name: ${config.APP_NAME}`);
    console.log(`   Version: ${config.APP_VERSION}`);
    console.log(`   Firebase Project: ${config.FIREBASE_PROJECT_ID}`);
    console.log(`   Clock Radius: ${config.DEFAULT_CLOCK_RADIUS_METERS}m`);
    console.log(`   Holiday Allowance: ${config.HOLIDAY_ALLOWANCE_DAYS} days`);
  }
};

export default AppConstants;
