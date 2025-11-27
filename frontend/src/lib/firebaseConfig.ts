import { FirebaseOptions } from 'firebase/app';

/**
 * Firebase configuration for VibeCheck
 * Uses environment variables for secure configuration
 */
export const getFirebaseConfig = (): FirebaseOptions | null => {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get config from environment variables first
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  // const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  // If all required fields are present, use environment variables
  if (apiKey && authDomain && projectId && appId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket: storageBucket || `${projectId}.appspot.com`,
      messagingSenderId,
      appId,
      // measurementId,
    };
  }

  // Fallback to window config (for backward compatibility or custom setups)
  if (typeof window !== 'undefined' && (window as any).__firebase_config) {
    return (window as any).__firebase_config;
  }

  return null;
};

/**
 * Get the app ID for Firebase
 */
export const getAppId = (): string => {
  if (typeof window !== 'undefined') {
    // Try environment variable first
    const envAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    if (envAppId) {
      return envAppId.split('~')[0] || 'vibecheck';
    }

    // Fallback to window config
    if ((window as any).__app_id) {
      return (window as any).__app_id;
    }
  }

  return 'vibecheck-dev';
};

/**
 * Get initial auth token if available
 */
export const getInitialAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Try environment variable first
    const envToken = process.env.NEXT_PUBLIC_FIREBASE_AUTH_TOKEN;
    if (envToken) {
      return envToken;
    }

    // Fallback to window config
    if ((window as any).__initial_auth_token) {
      return (window as any).__initial_auth_token;
    }
  }

  return null;
};

