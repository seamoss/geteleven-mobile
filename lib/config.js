import Constants from 'expo-constants'

/**
 * Environment configuration utility
 * Detects build type and provides appropriate configuration
 */

// Detect if this is a development build
export const isDevelopment =
  __DEV__ || Constants.expoConfig?.extra?.development === true

// Detect if this is a preview/staging build
export const isPreview =
  Constants.expoConfig?.releaseChannel === 'preview' ||
  Constants.expoConfig?.extra?.buildProfile === 'preview'

// Detect if this is a production build
export const isProduction = !isDevelopment && !isPreview

// API Configuration
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (isDevelopment
    ? 'http://localhost:3030/v1'
    : 'https://platform.getelevenapp.com/v1')

// Debug configuration
export const DEBUG_ENABLED = isDevelopment

// Build info for debugging
export const BUILD_INFO = {
  isDevelopment,
  isPreview,
  isProduction,
  releaseChannel: Constants.expoConfig?.releaseChannel,
  buildProfile: Constants.expoConfig?.extra?.buildProfile,
  apiUrl: API_BASE_URL
}

// Log configuration in development
if (isDevelopment) {
  console.log('🔧 Environment Configuration:', BUILD_INFO)
}

export default {
  isDevelopment,
  isPreview,
  isProduction,
  API_BASE_URL,
  DEBUG_ENABLED,
  BUILD_INFO
}
