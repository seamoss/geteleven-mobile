import RevenueCatService from '../services/RevenueCatService'
import { Platform } from 'react-native'
import Purchases from 'react-native-purchases'
import { getFeatureConfig } from '../lib/featureFlags'

/**
 * Enhanced RevenueCat Debugger
 * Comprehensive diagnosis of RevenueCat and App Store Connect configuration
 */
export const debugRevenueCat = async () => {
  console.log('========================================')
  console.log('Enhanced RevenueCat Configuration Debugger')
  console.log('========================================')

  // 1. Check platform and bundle ID
  console.log('\nPlatform & Environment Information:')
  console.log(`- Platform: ${Platform.OS}`)
  console.log(`- Bundle ID: com.getelevenapp.mobile`)
  console.log(`- Debug Mode: ${__DEV__}`)
  console.log(`- Platform Version: ${Platform.Version}`)

  // 2. Check feature flags configuration
  console.log('\nFeature Flags Configuration:')
  const inAppEnabled = getFeatureConfig('IN_APP_PURCHASES_ENABLED')
  const apiKeyIOS = getFeatureConfig('REVENUECAT_API_KEY_IOS')
  const apiKeyAndroid = getFeatureConfig('REVENUECAT_API_KEY_ANDROID')
  const entitlementId = getFeatureConfig('REVENUECAT_ENTITLEMENT_ID')
  const monthlyProductId = getFeatureConfig('REVENUECAT_MONTHLY_PRODUCT_ID')
  const yearlyProductId = getFeatureConfig('REVENUECAT_YEARLY_PRODUCT_ID')

  console.log(`- IN_APP_PURCHASES_ENABLED: ${inAppEnabled}`)
  console.log(
    `- iOS API Key: ${
      apiKeyIOS ? `${apiKeyIOS.substring(0, 15)}...` : 'NOT SET'
    }`
  )
  console.log(
    `- Android API Key: ${
      apiKeyAndroid ? `${apiKeyAndroid.substring(0, 15)}...` : 'NOT SET'
    }`
  )
  console.log(`- Entitlement ID: ${entitlementId}`)
  console.log(`- Monthly Product ID: ${monthlyProductId}`)
  console.log(`- Yearly Product ID: ${yearlyProductId}`)

  if (!inAppEnabled) {
    console.error(
      'IN_APP_PURCHASES_ENABLED is false - RevenueCat will not work'
    )
    return
  }

  // 3. Check initialization with detailed logging
  console.log('\nRevenueCat Initialization:')
  console.log('Attempting to initialize RevenueCat...')
  const initialized = await RevenueCatService.initialize()
  console.log(`- Initialization result: ${initialized}`)

  if (!initialized) {
    console.error('Failed to initialize RevenueCat')
    console.log('\nTroubleshooting steps:')
    console.log('1. Check API key configuration in featureFlags.js')
    console.log('2. Verify IN_APP_PURCHASES_ENABLED is true')
    console.log('3. Check for any initialization errors above')
    return
  }

  // 4. App Store Connect / StoreKit Configuration
  console.log('\nApp Store Connect & StoreKit Status:')
  console.log('Checking if device can make payments...')

  try {
    const canMakePayments = await Purchases.canMakePayments()
    console.log(`- Can make payments: ${canMakePayments}`)

    if (!canMakePayments) {
      console.error('Device cannot make payments')
      console.log('Possible reasons:')
      console.log('- Parental controls or restrictions enabled')
      console.log('- Not signed into App Store account')
      console.log('- Running on simulator (use real device)')
      console.log('- Device restrictions (MDM profile)')
      console.log('- Region restrictions')
    } else {
      console.log('Device is capable of making payments')
    }
  } catch (error) {
    console.error('Error checking payment capability:', error)
  }

  // 5. Check App Store account status
  console.log('\nApp Store Account Status:')
  if (Platform.OS === 'ios') {
    console.log('For iOS testing, ensure you are:')
    console.log(
      '• Signed into a Sandbox Account (Settings → App Store → Sandbox Account)'
    )
    console.log('• Using a test account created in App Store Connect')
    console.log('• Running on a physical device (not simulator)')
    console.log('• Products are in "Ready to Submit" or "Approved" status')
  }

  // 6. Detailed product fetching with individual tests
  console.log('\nIndividual Product Testing:')
  const productIds = [monthlyProductId, yearlyProductId].filter(Boolean)

  console.log(`Testing individual products: [${productIds.join(', ')}]`)

  try {
    console.log('Calling Purchases.getProducts() directly...')
    const products = await Purchases.getProducts(productIds)

    console.log(`- Raw getProducts() returned ${products.length} products`)

    if (products.length === 0) {
      console.error('No products returned from App Store Connect')
      console.log('\nThis means:')
      console.log('1. Product IDs do not exist in App Store Connect')
      console.log(
        '2. Products are not in correct status (must be "Ready to Submit" or "Approved")'
      )
      console.log('3. Bundle ID mismatch between app and App Store Connect')
      console.log('4. Paid Applications agreement not signed/active')
      console.log('5. Products not available in current region/storefront')

      console.log('\nVerification Steps:')
      console.log('1. Log into App Store Connect')
      console.log('2. Go to your app → Features → In-App Purchases')
      console.log('3. Verify these EXACT product IDs exist:')
      productIds.forEach(id => console.log(`   • ${id}`))
      console.log(
        '4. Check each product status is "Ready to Submit" or "Approved"'
      )
      console.log(
        '5. Verify Bundle ID matches exactly: com.getelevenapp.mobile'
      )
    } else {
      console.log('Products fetched from App Store Connect:')

      products.forEach((product, index) => {
        console.log(`\n--- Product ${index + 1} ---`)
        console.log(`- ID: ${product.identifier}`)
        console.log(`- Title: ${product.title}`)
        console.log(`- Description: ${product.description}`)
        console.log(`- Price: ${product.price}`)
        console.log(`- Price String: ${product.priceString}`)
        console.log(`- Currency: ${product.currencyCode}`)
        console.log(`- Product Type: ${product.productType}`)

        if (product.introPrice) {
          console.log(
            `• Intro Price: ${product.introPrice.priceString} for ${product.introPrice.periodNumberOfUnits} ${product.introPrice.periodUnit}`
          )
        }

        if (product.discounts && product.discounts.length > 0) {
          console.log(`• Has ${product.discounts.length} promotional offers`)
        }
      })
    }
  } catch (error) {
    console.error('Error fetching individual products:', error)
    console.log(`Error details: ${JSON.stringify(error, null, 2)}`)
  }

  // 7. RevenueCat Offerings (which combines products)
  console.log('\nRevenueCat Offerings:')
  console.log('Fetching offerings from RevenueCat...')

  try {
    const offerings = await RevenueCatService.getOfferings()

    if (!offerings) {
      console.error('No offerings returned from RevenueCat')
      console.log('\nRevenueCat Offering Issues:')
      console.log(
        '1. Products exist in App Store but not configured in RevenueCat dashboard'
      )
      console.log('2. No offerings created in RevenueCat dashboard')
      console.log('3. Network connectivity issues with RevenueCat')
    } else {
      console.log(`Offerings object received`)
      console.log(`- All offerings count: ${Object.keys(offerings.all).length}`)

      if (offerings.current) {
        console.log(`- Current offering ID: ${offerings.current.identifier}`)
        console.log(
          `- Packages in current offering: ${offerings.current.availablePackages.length}`
        )

        offerings.current.availablePackages.forEach((pkg, index) => {
          console.log(`\n--- Package ${index + 1} ---`)
          console.log(`- Package ID: ${pkg.identifier}`)
          console.log(`- Package Type: ${pkg.packageType}`)
          console.log(`- Product ID: ${pkg.product.identifier}`)
          console.log(`- Product Title: ${pkg.product.title}`)
          console.log(`- Price: ${pkg.product.priceString}`)
          console.log(`- Offering ID: ${pkg.offeringIdentifier}`)
        })
      } else {
        console.warn('No current offering set in RevenueCat')
        console.log('Available offerings:', Object.keys(offerings.all))
        console.log('\nTo fix:')
        console.log('1. Go to RevenueCat dashboard → Offerings')
        console.log('2. Set one offering as "Current"')
      }
    }
  } catch (error) {
    console.error('Error fetching RevenueCat offerings:', error)
    console.log(`Error type: ${error.constructor.name}`)
    console.log(`Error code: ${error.code}`)
    console.log(`Error user info: ${JSON.stringify(error.userInfo, null, 2)}`)

    if (error.message.includes('configuration')) {
      console.log('\nRevenueCat Configuration Steps:')
      console.log('1. Products must exist in App Store Connect first')
      console.log('2. Add products to RevenueCat dashboard with EXACT same IDs')
      console.log('3. Create an Offering in RevenueCat dashboard')
      console.log('4. Add products to the offering as packages')
      console.log('5. Set the offering as "Current"')
      console.log('6. Create entitlement and link to offering')
    }
  }

  // 8. Customer info and entitlements
  console.log('\nCustomer Information:')
  try {
    const customerInfo = await RevenueCatService.getCustomerInfo()
    if (customerInfo) {
      console.log('Customer info retrieved successfully')
      console.log(`- Original App User ID: ${customerInfo.originalAppUserId}`)
      console.log(
        `- Active entitlements: ${
          Object.keys(customerInfo.entitlements.active).length
        }`
      )
      console.log(
        `- All purchased product IDs: [${customerInfo.allPurchasedProductIdentifiers.join(
          ', '
        )}]`
      )
      console.log(
        `- Active subscriptions: [${customerInfo.activeSubscriptions.join(
          ', '
        )}]`
      )
      console.log(
        `- Non-subscription purchases: [${customerInfo.nonSubscriptionTransactions
          .map(t => t.productId)
          .join(', ')}]`
      )

      if (Object.keys(customerInfo.entitlements.active).length > 0) {
        console.log('\nActive Entitlements:')
        Object.entries(customerInfo.entitlements.active).forEach(
          ([key, entitlement]) => {
            console.log(
              `• ${key}: expires ${entitlement.expirationDate || 'never'}`
            )
          }
        )
      }
    } else {
      console.log('Could not retrieve customer info')
    }
  } catch (error) {
    console.error('Error getting customer info:', error)
  }

  // 9. Final recommendations
  console.log('\nFinal Recommendations:')
  console.log('If products are still not loading:')
  console.log('1. Double-check product IDs match EXACTLY (case-sensitive)')
  console.log(
    '2. Ensure Paid Applications agreement is signed in App Store Connect'
  )
  console.log(
    "3. Verify you're testing on a physical device with Sandbox account"
  )
  console.log(
    '4. Check RevenueCat dashboard has products added and offering is current'
  )
  console.log(
    '5. Wait up to 24 hours for App Store Connect changes to propagate'
  )
  console.log('6. Try clearing app data and reinstalling')

  console.log('\n========================================')
  console.log('Enhanced Debug Complete')
  console.log('========================================')
}

export default debugRevenueCat
