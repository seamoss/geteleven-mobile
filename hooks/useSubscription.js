import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { PACKAGE_TYPE } from 'react-native-purchases'
import RevenueCatService from '../services/RevenueCatService'
import { getFeatureConfig, isFeatureEnabled } from '../lib/featureFlags'
import useSubscriptionConfirmation from './useSubscriptionConfirmation'
import { authCheck } from '../lib/auth'
import api from '../lib/api'

export default function useSubscription (onSubscriptionChange = null) {
  const [isLoading, setIsLoading] = useState(false)
  const [monthlyPackage, setMonthlyPackage] = useState(null)
  const [yearlyPackage, setYearlyPackage] = useState(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [offerings, setOfferings] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})

  const debugMode = getFeatureConfig('DEBUG_PAYMENT_FLOWS') || false
  const { isAuthenticated, authToken } = authCheck()
  const {
    confirmSubscription,
    isConfirming,
    isAuthenticated: isUserAuthenticated
  } = useSubscriptionConfirmation()

  const debug = (message, data = null) => {
    if (debugMode || __DEV__) {
      console.log(`[useSubscription] ${message}`, data || '')
      // Store debug info for display
      setDebugInfo(prev => ({
        ...prev,
        [Date.now()]: { message, data }
      }))
    }
  }

  useEffect(() => {
    // Initialize RevenueCat on first load
    if (!isInitialized) {
      initializeRevenueCat()
    }
  }, [])

  useEffect(() => {
    // Login to RevenueCat when user becomes authenticated
    if (isAuthenticated && authToken && isInitialized) {
      loginToRevenueCat()
    }
  }, [isAuthenticated, authToken, isInitialized])

  const initializeRevenueCat = async () => {
    try {
      debug('Starting RevenueCat initialization...')

      // Initialize RevenueCat without user ID (anonymous)
      const initialized = await RevenueCatService.initialize()

      debug('Initialization result:', { initialized })

      if (initialized) {
        setIsInitialized(true)
        await loadProducts()
        await checkSubscriptionStatus()
      } else {
        debug('RevenueCat failed to initialize')
        Alert.alert(
          'Setup Required',
          'The subscription service is not properly configured. Please ensure RevenueCat API keys are set.'
        )
      }
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error)
      debug('Init error:', {
        message: error.message,
        code: error.code
      })

      // Check for specific StoreKit errors
      if (error.message && error.message.includes('No active account')) {
        Alert.alert(
          'Sandbox Account Required',
          'To test purchases, please sign in to a Sandbox Account:\n\n' +
            '1. Go to Settings → App Store\n' +
            '2. Scroll to "Sandbox Account"\n' +
            '3. Sign in with a test account\n\n' +
            'Create test accounts in App Store Connect.',
          [{ text: 'OK' }]
        )
      }
    }
  }

  const loginToRevenueCat = async () => {
    try {
      // First get the user data to get the user ID
      debug('Fetching user data for RevenueCat login...')
      const userResponse = await api('GET', '/users/me', {}, authToken)

      if (userResponse.error) {
        debug('Failed to fetch user data for RevenueCat login:', userResponse.error)
        return
      }

      const userData = userResponse.data
      debug('Fetched user data:', userData)

      if (!userData?.id) {
        debug('No user ID found in response data')
        return
      }

      const userIdString = userData.id.toString()
      debug('Logging in to RevenueCat with user ID:', userIdString)

      const customerInfo = await RevenueCatService.login(userIdString)
      debug('RevenueCat login result:', {
        success: !!customerInfo,
        revenueCatUserId: customerInfo?.originalAppUserId
      })

      // Update backend with RevenueCat user ID
      if (customerInfo?.originalAppUserId && isUserAuthenticated) {
        try {
          debug('Updating backend with RevenueCat user ID:', customerInfo.originalAppUserId)
          const response = await api('PUT', '/users/me/revenuecat-id', {
            revenuecatUserId: customerInfo.originalAppUserId
          }, authToken)

          if (response.error) {
            debug('Failed to update backend with RevenueCat user ID:', response.error)
          } else {
            debug('Successfully updated backend with RevenueCat user ID')
          }
        } catch (backendError) {
          debug('Error updating backend with RevenueCat user ID:', backendError.message)
        }
      }

      // Refresh subscription status after login
      await checkSubscriptionStatus()
    } catch (error) {
      console.error('Failed to login to RevenueCat:', error)
      debug('RevenueCat login error:', {
        message: error.message,
        code: error.code
      })
    }
  }

  const loadProducts = async () => {
    try {
      debug('Loading products from RevenueCat...')

      const offerings = await RevenueCatService.getOfferings()

      if (offerings && offerings.current) {
        setOfferings(offerings)

        const packages = offerings.current.availablePackages
        debug('Available packages:', {
          count: packages.length,
          packages: packages.map(p => ({
            id: p.identifier,
            type: p.packageType,
            productId: p.product.identifier,
            price: p.product.priceString
          }))
        })

        // RevenueCat has standard package types
        const monthly = packages.find(
          pkg => pkg.packageType === PACKAGE_TYPE.MONTHLY
        )
        const yearly = packages.find(
          pkg => pkg.packageType === PACKAGE_TYPE.ANNUAL
        )

        debug('Standard packages found:', {
          hasMonthly: !!monthly,
          hasYearly: !!yearly
        })

        // If no standard packages, try to match by product ID
        if (!monthly) {
          const monthlyId = getFeatureConfig('REVENUECAT_MONTHLY_PRODUCT_ID')
          const monthlyByID = packages.find(
            pkg => pkg.product.identifier === monthlyId
          )
          debug('Searching for monthly by ID:', {
            monthlyId,
            found: !!monthlyByID
          })
          setMonthlyPackage(monthlyByID)
        } else {
          setMonthlyPackage(monthly)
        }

        if (!yearly) {
          const yearlyId = getFeatureConfig('REVENUECAT_YEARLY_PRODUCT_ID')
          const yearlyByID = packages.find(
            pkg => pkg.product.identifier === yearlyId
          )
          debug('Searching for yearly by ID:', {
            yearlyId,
            found: !!yearlyByID
          })
          setYearlyPackage(yearlyByID)
        } else {
          setYearlyPackage(yearly)
        }
      } else {
        debug('No offerings or current offering available')
        Alert.alert(
          'Products Not Available',
          'Subscription products are not currently available. Please try again later.'
        )
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      debug('Load products error:', {
        message: error.message,
        code: error.code
      })
    }
  }

  const checkSubscriptionStatus = async () => {
    try {
      const hasSubscription = await RevenueCatService.checkSubscriptionStatus()
      setHasActiveSubscription(hasSubscription)
    } catch (error) {
      console.error('Failed to check subscription status:', error)
    }
  }

  const purchaseSubscription = async planType => {
    debug('Purchase requested:', { planType })

    if (!isFeatureEnabled('IN_APP_PURCHASES_ENABLED')) {
      debug('Purchases disabled in feature flags')
      Alert.alert(
        'Purchases Unavailable',
        'In-app purchases are currently unavailable. Please try again later.'
      )
      return null
    }

    if (!isInitialized) {
      debug('RevenueCat not initialized')
      Alert.alert(
        'Not Ready',
        'The store is still loading. Please try again in a moment.'
      )
      return null
    }

    setIsLoading(true)

    try {
      let packageToPurchase

      if (planType === 'monthly') {
        if (!monthlyPackage) {
          debug('Monthly package not available')
          throw new Error('Monthly subscription not available')
        }
        packageToPurchase = monthlyPackage
      } else if (planType === 'yearly') {
        if (!yearlyPackage) {
          debug('Yearly package not available')
          throw new Error('Yearly subscription not available')
        }
        packageToPurchase = yearlyPackage
      } else {
        throw new Error('Invalid plan type')
      }

      debug('Attempting purchase with package:', {
        identifier: packageToPurchase.identifier,
        productId: packageToPurchase.product.identifier,
        price: packageToPurchase.product.priceString
      })

      const customerInfo = await RevenueCatService.purchasePackage(
        packageToPurchase
      )

      // Check if purchase was successful
      const entitlementId =
        getFeatureConfig('REVENUECAT_ENTITLEMENT_ID') || 'Pro'
      const hasEntitlement = customerInfo.entitlements.active[entitlementId]

      debug('Purchase result:', {
        hasEntitlement,
        entitlementId,
        activeEntitlements: Object.keys(customerInfo.entitlements.active)
      })

      if (hasEntitlement) {
        // Purchase successful - now confirm with backend if user is authenticated
        debug(
          'Purchase successful, checking authentication for backend confirmation...'
        )

        if (isUserAuthenticated) {
          try {
            debug('User authenticated, confirming with backend...')
            const confirmationResult = await confirmSubscription(
              customerInfo,
              packageToPurchase.product
            )

            if (confirmationResult.success) {
              debug('Backend confirmation successful')
              Alert.alert(
                'Success!',
                'Your subscription has been activated. Thank you for upgrading!'
              )
            } else {
              debug('Backend confirmation failed:', confirmationResult.error)
              // Still show success since RevenueCat purchase succeeded
              // Backend will be updated via webhooks
              Alert.alert(
                'Subscription Active',
                'Your subscription is active! If you experience any issues, please contact support.'
              )
            }
          } catch (confirmationError) {
            debug('Confirmation error (non-blocking):', confirmationError)
            // Don't block success flow - webhooks will handle backend sync
            Alert.alert(
              'Subscription Active',
              'Your subscription is active! Account sync may take a moment.'
            )
          }
        } else {
          debug('User not authenticated, skipping backend confirmation')
          // Show success without backend confirmation
          Alert.alert(
            'Subscription Active',
            'Your subscription is active! Please sign in to sync with your account.'
          )
        }

        setHasActiveSubscription(true)
        // Refresh subscription status to ensure UI is in sync
        await checkSubscriptionStatus()
        // Notify parent component that subscription status changed
        if (onSubscriptionChange) {
          onSubscriptionChange(true)
        }
        return customerInfo
      } else {
        // Purchase was processed but entitlement not granted
        debug('Purchase processed but entitlement not granted')
        Alert.alert(
          'Purchase Issue',
          'Your purchase was processed but the subscription was not activated. Please contact support.'
        )
        return null
      }
    } catch (error) {
      if (error.userCancelled) {
        debug('User cancelled purchase')
        console.log('User cancelled purchase')
        // // Show a gentle message for cancellation
        // Alert.alert(
        //   'Purchase Cancelled',
        //   'No worries! You can upgrade anytime from your settings.'
        // )
      } else {
        debug('Purchase error:', {
          message: error.message,
          code: error.code,
          userCancelled: error.userCancelled,
          readableErrorCode: error.readableErrorCode,
          underlyingErrorMessage: error.underlyingErrorMessage
        })
        console.error('Full purchase error:', error)

        // Provide more specific error messages
        let errorMessage = 'There was an error processing your purchase.'

        if (
          error.code === '1' ||
          error.readableErrorCode === 'PURCHASE_CANCELLED'
        ) {
          errorMessage = 'The purchase was cancelled.'
        } else if (
          error.code === '2' ||
          error.readableErrorCode === 'STORE_PROBLEM'
        ) {
          errorMessage =
            'There was a problem with the App Store. Please try again later.'
        } else if (
          error.code === '3' ||
          error.readableErrorCode === 'PURCHASE_NOT_ALLOWED'
        ) {
          errorMessage = 'Purchases are not allowed on this device.'
        } else if (
          error.code === '4' ||
          error.readableErrorCode === 'PURCHASE_INVALID'
        ) {
          errorMessage = 'This purchase is invalid. Please contact support.'
        } else if (
          error.code === '5' ||
          error.readableErrorCode === 'PRODUCT_NOT_AVAILABLE'
        ) {
          errorMessage = 'This product is not available in your region.'
        } else if (error.message) {
          errorMessage = error.message
        }

        Alert.alert('Purchase Failed', errorMessage)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const restoreSubscription = async () => {
    setIsLoading(true)

    try {
      debug('Starting subscription restore...')
      const customerInfo = await RevenueCatService.restorePurchases()

      // Check if user has active subscription
      const entitlementId =
        getFeatureConfig('REVENUECAT_ENTITLEMENT_ID') || 'Pro'
      const hasEntitlement = customerInfo.entitlements.active[entitlementId]

      debug('Initial restore result:', {
        hasEntitlement,
        entitlementId,
        activeEntitlements: Object.keys(customerInfo.entitlements.active)
      })

      if (hasEntitlement) {
        // Set state immediately
        setHasActiveSubscription(true)

        // Wait a bit for backend processes to complete
        debug('Waiting for backend sync after restore...')
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Retry status check multiple times with delays
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
          debug(`Checking subscription status (attempt ${retryCount + 1}/${maxRetries})`)
          await checkSubscriptionStatus()

          // Wait between retries
          if (retryCount < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500))
          }
          retryCount++
        }

        // Notify parent component that subscription status changed
        if (onSubscriptionChange) {
          debug('Notifying parent component of subscription change')
          onSubscriptionChange(true)
        }

        Alert.alert(
          'Subscription Restored',
          'Your subscription has been successfully restored!'
        )
      } else {
        Alert.alert(
          'No Subscription Found',
          'No active subscription was found for your account.'
        )
        setHasActiveSubscription(false)
      }

      return customerInfo
    } catch (error) {
      console.error('Restore subscription error:', error)
      debug('Restore error:', {
        message: error.message,
        code: error.code
      })
      Alert.alert(
        'Restore Failed',
        'There was an error restoring your purchases. Please try again.'
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSubscription = async () => {
    debug('Cancellation requested')

    if (!isInitialized) {
      debug('RevenueCat not initialized')
      Alert.alert(
        'Not Ready',
        'The subscription service is not ready. Please try again in a moment.'
      )
      return false
    }

    setIsLoading(true)

    try {
      // RevenueCat doesn't have a direct cancel API - subscriptions are managed by the stores
      // We need to redirect users to their store subscription management
      const customerInfo = await RevenueCatService.getCustomerInfo()

      debug('Customer info retrieved for cancellation:', {
        hasActiveEntitlements:
          Object.keys(customerInfo.entitlements.active).length > 0
      })

      // Check current platform to provide appropriate instructions
      const Platform = require('react-native').Platform

      if (Platform.OS === 'ios') {
        Alert.alert(
          'Cancel Subscription',
          'To cancel your subscription, you need to manage it through your Apple ID settings:\n\n1. Go to Settings > Apple ID > Subscriptions\n2. Select Eleven\n3. Tap Cancel Subscription',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                const { Linking } = require('react-native')
                Linking.openURL('https://apps.apple.com/account/subscriptions')
              }
            }
          ]
        )
      } else {
        Alert.alert(
          'Cancel Subscription',
          'To cancel your subscription, you need to manage it through Google Play:\n\n1. Open Google Play Store\n2. Go to Menu > Subscriptions\n3. Select Eleven\n4. Tap Cancel',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Play Store',
              onPress: () => {
                const { Linking } = require('react-native')
                Linking.openURL(
                  'https://play.google.com/store/account/subscriptions'
                )
              }
            }
          ]
        )
      }

      // Return true to indicate the process was initiated
      return true
    } catch (error) {
      console.error('Cancel subscription error:', error)
      debug('Cancel subscription error:', {
        message: error.message,
        code: error.code
      })

      Alert.alert(
        'Error',
        'There was an error processing your cancellation request. Please try managing your subscription directly through your device settings or contact support.'
      )
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getFormattedPrice = packageItem => {
    if (!packageItem || !packageItem.product) return null

    // RevenueCat provides localized price string
    return packageItem.product.priceString || null
  }

  return {
    // State
    isLoading: isLoading || isConfirming,
    hasActiveSubscription,
    isInitialized,

    // Products/Packages
    monthlyPackage,
    yearlyPackage,
    offerings,

    // Prices
    monthlyPrice: getFormattedPrice(monthlyPackage),
    yearlyPrice: getFormattedPrice(yearlyPackage),

    // Actions
    purchaseSubscription,
    restoreSubscription,
    cancelSubscription,
    refreshStatus: checkSubscriptionStatus,

    // Feature flag
    isEnabled: isFeatureEnabled('IN_APP_PURCHASES_ENABLED'),

    // Debug info
    debugInfo,
    debugMode
  }
}
