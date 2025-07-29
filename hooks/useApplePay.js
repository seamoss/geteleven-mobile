import { useState, useEffect } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';
import { isFeatureEnabled, getFeatureConfig } from '../lib/featureFlags';

export default function useApplePay() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      console.log('Apple Pay is only available on iOS');
      return;
    }

    // Check Apple Pay availability
    if (isFeatureEnabled('APPLE_PAY_ENABLED')) {
      // This would check if Apple Pay is set up on the device
      setIsAvailable(true); // Placeholder - actual implementation would check device capability
    }

    // Check Apple Sign In availability
    AppleAuthentication.isAvailableAsync().then(setIsAppleSignInAvailable);

    // Initialize In-App Purchases
    if (isFeatureEnabled('IN_APP_PURCHASES_ENABLED')) {
      initializeInAppPurchases();
    }

    return () => {
      if (isFeatureEnabled('IN_APP_PURCHASES_ENABLED')) {
        InAppPurchases.disconnectAsync();
      }
    };
  }, []);

  const initializeInAppPurchases = async () => {
    try {
      await InAppPurchases.connectAsync();
      
      // Get available products (you'll need to define your product IDs)
      const productIds = [
        // 'com.getelevenapp.premium_monthly',
        // 'com.getelevenapp.premium_yearly',
      ];
      
      if (productIds.length > 0) {
        const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          setProducts(results);
        }
      }

      // Get purchase history
      const history = await InAppPurchases.getPurchaseHistoryAsync();
      if (history.responseCode === InAppPurchases.IAPResponseCode.OK) {
        setPurchaseHistory(history.results);
      }
    } catch (error) {
      console.error('Error initializing In-App Purchases:', error);
    }
  };

  const signInWithApple = async () => {
    if (!isFeatureEnabled('APPLE_SIGN_IN_ENABLED') || !isAppleSignInAvailable) {
      console.log('Apple Sign In is disabled or not available');
      return null;
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('Apple Sign In successful:', credential);
      // TODO: Send credential to your backend
      return credential;
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        console.log('User canceled Apple Sign In');
      } else {
        console.error('Apple Sign In error:', error);
      }
      return null;
    }
  };

  const purchaseProduct = async (productId) => {
    if (!isFeatureEnabled('IN_APP_PURCHASES_ENABLED')) {
      console.log('In-App Purchases are disabled via feature flag');
      return null;
    }

    try {
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        const purchase = results[0];
        console.log('Purchase successful:', purchase);
        
        // TODO: Verify purchase with your backend
        // TODO: Finalize transaction
        await InAppPurchases.finishTransactionAsync(purchase, true);
        
        return purchase;
      } else {
        console.log('Purchase failed with response code:', responseCode);
        return null;
      }
    } catch (error) {
      console.error('Purchase error:', error);
      return null;
    }
  };

  const restorePurchases = async () => {
    if (!isFeatureEnabled('IN_APP_PURCHASES_ENABLED')) {
      console.log('In-App Purchases are disabled via feature flag');
      return [];
    }

    try {
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        setPurchaseHistory(results);
        console.log('Purchases restored:', results);
        return results;
      }
      
      return [];
    } catch (error) {
      console.error('Restore purchases error:', error);
      return [];
    }
  };

  return {
    // Apple Pay / Apple Sign In
    isAvailable,
    isAppleSignInAvailable,
    signInWithApple,
    
    // In-App Purchases
    products,
    purchaseHistory,
    purchaseProduct,
    restorePurchases,
    
    // Feature flags
    isApplePayEnabled: isFeatureEnabled('APPLE_PAY_ENABLED'),
    isInAppPurchasesEnabled: isFeatureEnabled('IN_APP_PURCHASES_ENABLED'),
  };
}
