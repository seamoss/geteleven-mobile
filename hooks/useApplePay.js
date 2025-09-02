import { useState, useEffect } from 'react'
import * as AppleAuthentication from 'expo-apple-authentication'
import { Platform } from 'react-native'
import { isFeatureEnabled } from '../lib/featureFlags'

/**
 * Hook for Apple Sign In authentication
 * Note: In-App Purchases are handled by RevenueCat - see useSubscription hook
 */
export default function useApplePay () {
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      console.log('Apple services are only available on iOS')
      return
    }

    // Apple Pay functionality has been removed - use RevenueCat for payments

    // Check Apple Sign In availability
    AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable)
  }, [])

  const signInWithApple = async () => {
    if (!isFeatureEnabled('APPLE_SIGN_IN_ENABLED') || !isAppleSignInAvailable) {
      console.log('Apple Sign In is disabled or not available')
      return null
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      })

      console.log('Apple Sign In successful:', credential)
      // TODO: Send credential to your backend
      return credential
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        console.log('User canceled Apple Sign In')
      } else {
        console.error('Apple Sign In error:', error)
      }
      return null
    }
  }


  return {
    // Apple Sign In
    isAppleSignInAvailable,
    signInWithApple,

    // Feature flags (kept for backward compatibility)
    isApplePayEnabled: isFeatureEnabled('APPLE_PAY_ENABLED')
  }
}
