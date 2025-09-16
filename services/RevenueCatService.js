import { Platform } from 'react-native'
import Purchases, { LOG_LEVEL } from 'react-native-purchases'
import { getFeatureConfig, isFeatureEnabled } from '../lib/featureFlags'

class RevenueCatService {
  constructor () {
    this.isInitialized = false
    this.currentUserId = null
    this.debugMode = getFeatureConfig('DEBUG_REVENUECAT') || false
  }

  debug (message, data = null) {
    if (this.debugMode || __DEV__) {
      console.log(`[RevenueCat] ${message}`, data || '')
    }
  }

  async initialize (userId = null) {
    this.debug('Initializing RevenueCat...')

    if (!isFeatureEnabled('IN_APP_PURCHASES_ENABLED')) {
      this.debug('In-app purchases are disabled in feature flags')
      return false
    }

    if (this.isInitialized) {
      this.debug('Already initialized')
      return true
    }

    try {
      // Log expected product IDs from feature flags
      const monthlyProductId = getFeatureConfig('REVENUECAT_MONTHLY_PRODUCT_ID')
      const yearlyProductId = getFeatureConfig('REVENUECAT_YEARLY_PRODUCT_ID')
      const entitlementId = getFeatureConfig('REVENUECAT_ENTITLEMENT_ID')

      this.debug('Expected product configuration:', {
        monthlyProductId,
        yearlyProductId,
        entitlementId,
        hasMonthly: !!monthlyProductId,
        hasYearly: !!yearlyProductId,
        hasEntitlement: !!entitlementId
      })

      const apiKey = Platform.select({
        ios: getFeatureConfig('REVENUECAT_API_KEY_IOS'),
        android: getFeatureConfig('REVENUECAT_API_KEY_ANDROID')
      })

      this.debug('Selected API key for platform:', {
        platform: Platform.OS,
        hasKey: !!apiKey,
        keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
      })

      if (!apiKey || apiKey.includes('YOUR_')) {
        console.warn(
          'RevenueCat API key not configured. Please add your API key to featureFlags.js'
        )
        return false
      }

      // Configure RevenueCat with verbose logging
      if (this.debugMode || __DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE)
        this.debug('Set log level to VERBOSE')
      }

      this.debug('Configuring Purchases...', {
        appUserID: userId,
        observerMode: false,
        platform: Platform.OS,
        expectedProducts: [monthlyProductId, yearlyProductId].filter(Boolean)
      })

      Purchases.configure({
        apiKey,
        appUserID: userId,
        observerMode: false,
        useAmazon: false
      })

      this.isInitialized = true
      this.currentUserId = userId

      this.debug('RevenueCat initialized successfully', {
        userId: this.currentUserId
      })

      return true
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error)
      this.debug('Initialization error:', {
        error: error.message,
        code: error.code,
        userInfo: error.userInfo
      })
      return false
    }
  }

  async login (userId) {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized')
      return false
    }

    try {
      this.debug('Logging in user to RevenueCat:', userId)
      const { customerInfo } = await Purchases.logIn(userId)
      this.currentUserId = userId

      this.debug('Login successful', {
        userId,
        revenueCatUserId: customerInfo.originalAppUserId
      })

      return customerInfo
    } catch (error) {
      console.error('Failed to login to RevenueCat:', error)
      this.debug('Login error:', {
        message: error.message,
        code: error.code
      })
      return null
    }
  }

  async logout () {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized')
      return false
    }

    try {
      const { customerInfo } = await Purchases.logOut()
      this.currentUserId = null
      console.log('Logged out from RevenueCat')
      return customerInfo
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error)
      return null
    }
  }

  async checkStoreKitConfiguration () {
    try {
      this.debug('Checking StoreKit configuration...')

      // Check if we can access the store
      const canMakePayments = await Purchases.canMakePayments()
      this.debug('Can make payments:', canMakePayments)

      if (!canMakePayments) {
        console.warn('[WARNING] Device cannot make payments. Possible reasons:')
        console.warn('1. Parental controls/restrictions enabled')
        console.warn('2. Device restrictions in MDM profile')
        console.warn('3. Not signed in to App Store')
        return false
      }

      return true
    } catch (error) {
      this.debug('Error checking StoreKit:', error)
      return false
    }
  }

  async getOfferings () {
    if (!this.isInitialized) {
      this.debug('Cannot get offerings - not initialized')
      return null
    }

    try {
      // First check if StoreKit is properly configured
      this.debug('Checking StoreKit configuration before fetching offerings...')
      const storeKitOk = await this.checkStoreKitConfiguration()
      if (!storeKitOk) {
        console.warn(
          '[WARNING] StoreKit not properly configured. Please ensure:'
        )
        console.warn(
          '1. You are signed in to a Sandbox Account (Settings > App Store > Sandbox Account)'
        )
        console.warn('2. The app is running on a real device (not simulator)')
        console.warn('3. In-App Purchase capability is enabled in Xcode')
      }

      this.debug('Making Purchases.getOfferings() call...')
      const startTime = Date.now()
      const offerings = await Purchases.getOfferings()
      const duration = Date.now() - startTime

      this.debug(`Offerings API call completed in ${duration}ms`)
      this.debug('Raw offerings response:', {
        hasOfferings: !!offerings,
        isNull: offerings === null,
        isUndefined: offerings === undefined,
        type: typeof offerings,
        keys: offerings ? Object.keys(offerings) : 'N/A'
      })

      if (offerings) {
        this.debug('Offerings structure:', {
          currentOffering:
            offerings?.current?.identifier || 'No current offering',
          allOfferingIds: Object.keys(offerings.all),
          totalOfferingsCount: Object.keys(offerings.all).length,
          packageCount: offerings?.current?.availablePackages?.length || 0
        })

        // Log all offerings
        Object.entries(offerings.all).forEach(([offeringId, offering]) => {
          this.debug(`Offering "${offeringId}":`, {
            identifier: offering.identifier,
            serverDescription: offering.serverDescription,
            packageCount: offering.availablePackages.length,
            isCurrent: offering.identifier === offerings.current?.identifier
          })
        })

        // Detailed package logging
        if (offerings?.current?.availablePackages) {
          this.debug(
            `Logging ${offerings.current.availablePackages.length} packages from current offering:`
          )
          offerings.current.availablePackages.forEach((pkg, index) => {
            this.debug(`--- Package ${index + 1}: ${pkg.identifier} ---`, {
              packageType: pkg.packageType,
              offeringIdentifier: pkg.offeringIdentifier,
              productDetails: {
                identifier: pkg.product.identifier,
                title: pkg.product.title,
                description: pkg.product.description,
                price: pkg.product.price,
                priceString: pkg.product.priceString,
                currencyCode: pkg.product.currencyCode,
                productType: pkg.product.productType,
                subscriptionPeriod: pkg.product.subscriptionPeriod,
                introPrice: pkg.product.introPrice
                  ? {
                      price: pkg.product.introPrice.price,
                      priceString: pkg.product.introPrice.priceString,
                      periodNumberOfUnits:
                        pkg.product.introPrice.periodNumberOfUnits,
                      periodUnit: pkg.product.introPrice.periodUnit
                    }
                  : null
              }
            })
          })
        } else {
          this.debug('No packages found in current offering')
        }
      } else {
        this.debug(
          '[WARNING] Offerings is null/undefined - this usually indicates:'
        )
        this.debug('1. No products configured in App Store Connect')
        this.debug('2. Products exist but are not in correct status')
        this.debug('3. Bundle ID mismatch')
        this.debug('4. No offerings configured in RevenueCat dashboard')
        this.debug('5. Network connectivity issues')
      }

      return offerings
    } catch (error) {
      console.error('Failed to get offerings:', error)
      this.debug('Get offerings error details:', {
        errorMessage: error.message,
        errorCode: error.code,
        errorName: error.name,
        errorStack: error.stack,
        userInfo: error.userInfo,
        underlyingError: error.underlyingError,
        readableErrorCode: error.readableErrorCode
      })

      // Log specific error patterns
      if (error.message.includes('configuration')) {
        this.debug(
          'Configuration error detected - check RevenueCat dashboard setup'
        )
      }
      if (
        error.message.includes('network') ||
        error.message.includes('internet')
      ) {
        this.debug('Network error detected - check internet connectivity')
      }
      if (error.message.includes('store')) {
        this.debug(
          'Store error detected - check App Store Connect configuration'
        )
      }

      return null
    }
  }

  async getProducts () {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized')
      return []
    }

    try {
      const offerings = await this.getOfferings()
      if (!offerings || !offerings.current) {
        console.warn('No current offering available')
        return []
      }

      // Get all available packages from the current offering
      const packages = offerings.current.availablePackages

      // Map packages to a simpler format
      return packages.map(pkg => ({
        identifier: pkg.identifier,
        product: pkg.product,
        offeringIdentifier: pkg.offeringIdentifier,
        packageType: pkg.packageType,
        localizedPriceString: pkg.product.priceString,
        localizedIntroductoryPriceString: pkg.product.introPrice?.priceString
      }))
    } catch (error) {
      console.error('Failed to get products:', error)
      return []
    }
  }

  async purchasePackage (packageToPurchase) {
    if (!this.isInitialized) {
      this.debug('Cannot purchase - not initialized')
      throw new Error('RevenueCat not initialized')
    }

    this.debug('Starting purchase:', {
      packageId: packageToPurchase.identifier,
      productId: packageToPurchase.product.identifier,
      price: packageToPurchase.product.priceString
    })

    try {
      const { customerInfo } = await Purchases.purchasePackage(
        packageToPurchase
      )

      this.debug('Purchase successful!', {
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        activeSubscriptions: customerInfo.activeSubscriptions,
        originalAppUserId: customerInfo.originalAppUserId
      })

      return customerInfo
    } catch (error) {
      if (error.userCancelled) {
        this.debug('User cancelled purchase')
      } else {
        this.debug('Purchase failed with error:', {
          message: error.message,
          code: error.code,
          userCancelled: error.userCancelled,
          underlyingErrorMessage: error.underlyingErrorMessage,
          readableErrorCode: error.readableErrorCode,
          userInfo: error.userInfo
        })
        console.error('Full error object:', error)
      }
      throw error
    }
  }

  async purchaseProduct (productId) {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized')
      throw new Error('RevenueCat not initialized')
    }

    try {
      const products = await Purchases.getProducts([productId])
      if (!products || products.length === 0) {
        throw new Error('Product not found')
      }

      const { customerInfo } = await Purchases.purchaseStoreProduct(products[0])
      console.log('Purchase successful:', customerInfo)
      return customerInfo
    } catch (error) {
      if (error.userCancelled) {
        console.log('User cancelled purchase')
      } else {
        console.error('Purchase failed:', error)
      }
      throw error
    }
  }

  async restorePurchases () {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized')
      throw new Error('RevenueCat not initialized')
    }

    try {
      this.debug('Restoring purchases...')
      const customerInfo = await Purchases.restorePurchases()

      this.debug('Restore successful', {
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        activeSubscriptions: customerInfo.activeSubscriptions
      })

      return customerInfo
    } catch (error) {
      console.error('Restore failed:', error)
      this.debug('Restore error:', {
        message: error.message,
        code: error.code
      })
      throw error
    }
  }

  async getCustomerInfo () {
    if (!this.isInitialized) {
      this.debug('Cannot get customer info - not initialized')
      return null
    }

    try {
      this.debug('Fetching customer info...')
      const customerInfo = await Purchases.getCustomerInfo()

      this.debug('Customer info received:', {
        hasActiveEntitlements:
          Object.keys(customerInfo.entitlements.active).length > 0,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        activeSubscriptions: customerInfo.activeSubscriptions,
        allPurchasedProductIds: customerInfo.allPurchasedProductIdentifiers
      })

      return customerInfo
    } catch (error) {
      console.error('Failed to get customer info:', error)
      this.debug('Get customer info error:', {
        error: error.message,
        code: error.code
      })
      return null
    }
  }

  async checkSubscriptionStatus () {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized')
      return false
    }

    try {
      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo) {
        return false
      }

      // Check if user has the 'Pro' entitlement
      const entitlementId =
        getFeatureConfig('REVENUECAT_ENTITLEMENT_ID') || 'Pro'
      const entitlement = customerInfo.entitlements.active[entitlementId]

      return !!entitlement
    } catch (error) {
      console.error('Failed to check subscription status:', error)
      return false
    }
  }

  async getActiveSubscriptions () {
    if (!this.isInitialized) {
      console.warn('RevenueCat not initialized')
      return []
    }

    try {
      const customerInfo = await this.getCustomerInfo()
      if (!customerInfo) {
        return []
      }

      return Object.values(customerInfo.entitlements.active)
    } catch (error) {
      console.error('Failed to get active subscriptions:', error)
      return []
    }
  }
}

// Export singleton instance
export default new RevenueCatService()
