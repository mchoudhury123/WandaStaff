/**
 * TypeScript declarations for environment variables
 * This file provides type safety for @env imports
 */

declare module '@env' {
  export const FIREBASE_API_KEY: string;
  export const FIREBASE_AUTH_DOMAIN: string;
  export const FIREBASE_PROJECT_ID: string;
  export const FIREBASE_STORAGE_BUCKET: string;
  export const FIREBASE_MESSAGING_SENDER_ID: string;
  export const FIREBASE_APP_ID: string;
  export const APP_NAME: string;
  export const APP_VERSION: string;
  export const ENVIRONMENT: string;
  export const DEFAULT_CLOCK_RADIUS_METERS: string;
  export const HOLIDAY_ALLOWANCE_DAYS: string;
}
