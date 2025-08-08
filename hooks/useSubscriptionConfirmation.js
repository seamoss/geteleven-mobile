import { useState } from 'react'
import { getFeatureConfig } from '../lib/featureFlags'
import { authCheck } from '../lib/auth'
import api from '../lib/api'

export default function useSubscriptionConfirmation () {
  const [isConfirming, setIsConfirming] = useState(false)
  const debugMode = getFeatureConfig('DEBUG_PAYMENT_FLOWS') || false
  const { authToken, isAuthenticated } = authCheck()

  const debug = (message, data = null) => {
    if (debugMode || __DEV__) {
      console.log(`[SubscriptionConfirmation] ${message}`, data || '')
    }
  }

  /**
   * Send subscription confirmation to API
   * Creates the relationship between RevenueCat user and database user
   */
  const confirmSubscription = async (customerInfo, purchasedProduct) => {
    setIsConfirming(true)
    debug('Starting subscription confirmation...', {
      revenueCatUserId: customerInfo.originalAppUserId,
      productId: purchasedProduct?.identifier
    })

    try {
      if (!isAuthenticated || !authToken) {
        throw new Error('User not authenticated')
      }

      // Extract subscription details from customerInfo
      const subscriptionData = extractSubscriptionData(
        customerInfo,
        purchasedProduct
      )

      debug('Sending subscription data to API:', subscriptionData)

      const response = await api(
        'POST',
        '/subscriptions',
        subscriptionData,
        authToken
      )

      debug('Subscription confirmation successful:', response)

      return {
        success: true,
        data: response
      }
    } catch (error) {
      console.error('Failed to confirm subscription:', error)
      debug('Confirmation error:', {
        message: error.message,
        response: error.response || null
      })

      return {
        success: false,
        error: error.message || 'Failed to confirm subscription'
      }
    } finally {
      setIsConfirming(false)
    }
  }

  /**
   * Extract relevant subscription data from RevenueCat customerInfo
   */
  const extractSubscriptionData = (customerInfo, purchasedProduct) => {
    // Get the active entitlement (assuming 'Pro' entitlement)
    const entitlementId = getFeatureConfig('REVENUECAT_ENTITLEMENT_ID') || 'Pro'
    const activeEntitlement = customerInfo.entitlements.active[entitlementId]

    // Get the latest subscription from active subscriptions
    const latestSubscription =
      customerInfo.activeSubscriptions[0] || purchasedProduct?.identifier

    return {
      // RevenueCat identifiers
      revenuecat_user_id: customerInfo.originalAppUserId,
      revenuecat_customer_id: customerInfo.originalAppUserId, // Same as user_id in RevenueCat

      // Product information
      product_id: purchasedProduct?.identifier || latestSubscription,
      product_title: purchasedProduct?.title,
      product_description: purchasedProduct?.description,
      product_price: purchasedProduct?.priceString,
      product_currency_code: purchasedProduct?.currencyCode,

      // Subscription details
      purchase_date: activeEntitlement?.purchaseDate,
      original_purchase_date: activeEntitlement?.originalPurchaseDate,
      expiration_date: activeEntitlement?.expirationDate,
      will_renew: activeEntitlement?.willRenew || false,

      // Platform and environment
      store: activeEntitlement?.store?.toLowerCase() || 'app_store',
      is_sandbox: activeEntitlement?.isSandbox || false,
      period_type: activeEntitlement?.periodType, // 'normal', 'trial', 'intro'

      // Status
      is_active: true,
      entitlement_id: entitlementId,

      // Metadata
      confirmation_timestamp: new Date().toISOString(),
      app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0'
    }
  }

  /**
   * Retry confirmation if it failed initially
   * Useful for handling temporary network issues
   */
  const retryConfirmation = async (
    customerInfo,
    purchasedProduct,
    maxRetries = 3
  ) => {
    debug('Retrying subscription confirmation...', { maxRetries })

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      debug(`Confirmation attempt ${attempt}/${maxRetries}`)

      const result = await confirmSubscription(customerInfo, purchasedProduct)

      if (result.success) {
        debug('Retry successful')
        return result
      }

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        debug(`Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    debug('All retry attempts failed')
    return {
      success: false,
      error: 'Failed to confirm subscription after multiple attempts'
    }
  }

  return {
    confirmSubscription,
    retryConfirmation,
    isConfirming,
    isAuthenticated // Export authentication state for conditional usage
  }
}
