/**
 * Feature Flags Configuration
 * 
 * This file can be updated via Expo Updates (hot updates) to enable/disable features
 * without requiring a new App Store build. Simply change the values below and publish
 * an update using: eas update --branch production
 */

export const FEATURE_FLAGS = {
  // Push Notifications
  PUSH_NOTIFICATIONS_ENABLED: false,
  PUSH_NOTIFICATIONS_SOUND_ENABLED: false,
  PUSH_NOTIFICATIONS_BADGE_ENABLED: false,
  
  // Apple Pay & In-App Purchases
  APPLE_PAY_ENABLED: false,
  APPLE_SIGN_IN_ENABLED: false,
  IN_APP_PURCHASES_ENABLED: false,
  
  // ShopKit / Commerce
  SHOPKIT_ENABLED: false,
  SHOPKIT_APPLE_PAY_ENABLED: false,
  
  // Development/Debug flags
  DEBUG_PUSH_NOTIFICATIONS: false,
  DEBUG_PAYMENT_FLOWS: false,
  
  // Product IDs for In-App Purchases
  IAP_PRODUCT_IDS: [
    // Uncomment and modify when ready to use
    // 'com.getelevenapp.mobile.premium_monthly',
    // 'com.getelevenapp.mobile.premium_yearly',
    // 'com.getelevenapp.mobile.pro_features',
  ],
  
  // Apple Pay Merchant ID
  APPLE_PAY_MERCHANT_ID: 'merchant.com.getelevenapp.mobile',
  
  // Push notification configuration
  PUSH_NOTIFICATION_CONFIG: {
    channelId: 'default',
    channelName: 'Default',
    importance: 'max', // max, high, default, low, min
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  },
};

/**
 * Helper function to check if a feature is enabled
 * @param {string} featureName - The feature flag name
 * @returns {boolean}
 */
export const isFeatureEnabled = (featureName) => {
  try {
    return FEATURE_FLAGS[featureName] === true;
  } catch (error) {
    console.warn(`Feature flag '${featureName}' could not be accessed:`, error);
    return false;
  }
};

/**
 * Helper function to get feature configuration
 * @param {string} configName - The configuration name
 * @returns {any}
 */
export const getFeatureConfig = (configName) => {
  return FEATURE_FLAGS[configName];
};

/**
 * Helper function to check if we're in development mode
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return __DEV__;
};

/**
 * Helper function to log feature flag states (for debugging)
 */
export const logFeatureFlags = () => {
  if (isDevelopment()) {
    console.log('Feature Flags:', FEATURE_FLAGS);
  }
};
