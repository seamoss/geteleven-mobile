import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native'
import { authCheck } from '../lib/auth'
import RevenueCatService from '../services/RevenueCatService'
import useSubscription from '../hooks/useSubscription'
import { scale } from '../utils/responsive'
import { getFeatureConfig } from '../lib/featureFlags'

export default function DebugRevenueCatScreen({ navigation }) {
  const [rcInfo, setRcInfo] = useState({
    isInitialized: false,
    currentUserId: null,
    customerInfo: null,
    offerings: null,
    error: null
  })
  const [isLoading, setIsLoading] = useState(false)

  const { isAuthenticated, userData } = authCheck()
  const {
    isInitialized: hookInitialized,
    hasActiveSubscription,
    monthlyPackage,
    yearlyPackage,
    debugInfo
  } = useSubscription()

  useEffect(() => {
    refreshRevenueCatInfo()
  }, [])

  const refreshRevenueCatInfo = async () => {
    try {
      setIsLoading(true)

      const customerInfo = await RevenueCatService.getCustomerInfo()
      const offerings = await RevenueCatService.getOfferings()

      setRcInfo({
        isInitialized: RevenueCatService.isInitialized,
        currentUserId: RevenueCatService.currentUserId,
        customerInfo,
        offerings,
        error: null
      })
    } catch (error) {
      console.error('Error refreshing RevenueCat info:', error)
      setRcInfo(prev => ({
        ...prev,
        error: error.message
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitialize = async () => {
    try {
      setIsLoading(true)
      Alert.alert('Initializing', 'Initializing RevenueCat...')

      const result = await RevenueCatService.initialize()

      if (result) {
        Alert.alert('Success', 'RevenueCat initialized successfully')
        refreshRevenueCatInfo()
      } else {
        Alert.alert('Failed', 'RevenueCat initialization failed')
      }
    } catch (error) {
      console.error('Initialization error:', error)
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!isAuthenticated || !userData?.id) {
      Alert.alert('Error', 'User not authenticated')
      return
    }

    try {
      setIsLoading(true)
      Alert.alert('Logging In', 'Logging in to RevenueCat...')

      const customerInfo = await RevenueCatService.login(userData.id.toString())

      if (customerInfo) {
        Alert.alert('Success', 'Logged in to RevenueCat successfully')
        refreshRevenueCatInfo()
      } else {
        Alert.alert('Failed', 'RevenueCat login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      Alert.alert('Logging Out', 'Logging out from RevenueCat...')

      const result = await RevenueCatService.logout()

      Alert.alert('Success', 'Logged out from RevenueCat')
      refreshRevenueCatInfo()
    } catch (error) {
      console.error('Logout error:', error)
      Alert.alert('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderButton = (title, onPress, disabled = false) => (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  )

  const renderInfoRow = (label, value, isGood = null) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={[
        styles.infoValue,
        isGood === true && styles.infoValueGood,
        isGood === false && styles.infoValueBad
      ]}>
        {value?.toString() || 'null'}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>RevenueCat Debug</Text>

        {/* Authentication Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          {renderInfoRow('Is Authenticated', isAuthenticated, isAuthenticated)}
          {renderInfoRow('User ID', userData?.id)}
          {renderInfoRow('User Email', userData?.email)}
        </View>

        {/* RevenueCat Service Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RevenueCat Service</Text>
          {renderInfoRow('Service Initialized', rcInfo.isInitialized, rcInfo.isInitialized)}
          {renderInfoRow('Current User ID', rcInfo.currentUserId)}
          {renderInfoRow('Hook Initialized', hookInitialized, hookInitialized)}
          {renderInfoRow('Has Active Sub', hasActiveSubscription, hasActiveSubscription)}
          {renderInfoRow('API Key (iOS)', getFeatureConfig('REVENUECAT_API_KEY_IOS') ? 'Set' : 'Missing', !!getFeatureConfig('REVENUECAT_API_KEY_IOS'))}
          {renderInfoRow('Entitlement ID', getFeatureConfig('REVENUECAT_ENTITLEMENT_ID'))}
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Info</Text>
          {rcInfo.customerInfo ? (
            <>
              {renderInfoRow('Original App User ID', rcInfo.customerInfo.originalAppUserId)}
              {renderInfoRow('Active Entitlements', Object.keys(rcInfo.customerInfo.entitlements.active).length)}
              {renderInfoRow('Active Subscriptions', rcInfo.customerInfo.activeSubscriptions?.length || 0)}
              {Object.keys(rcInfo.customerInfo.entitlements.active).map(entitlement => (
                <View key={entitlement} style={styles.entitlementRow}>
                  <Text style={styles.entitlementText}>✓ {entitlement}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.noDataText}>No customer info available</Text>
          )}
        </View>

        {/* Products/Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Products</Text>
          {renderInfoRow('Monthly Package', monthlyPackage ? `${monthlyPackage.product.identifier} - ${monthlyPackage.product.priceString}` : 'Not loaded')}
          {renderInfoRow('Yearly Package', yearlyPackage ? `${yearlyPackage.product.identifier} - ${yearlyPackage.product.priceString}` : 'Not loaded')}
          {renderInfoRow('Offerings Available', rcInfo.offerings?.current ? 'Yes' : 'No', !!rcInfo.offerings?.current)}
          {rcInfo.offerings?.current && renderInfoRow('Package Count', rcInfo.offerings.current.availablePackages.length)}
        </View>

        {/* Debug Info */}
        {Object.keys(debugInfo).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Log</Text>
            <ScrollView style={styles.debugLog} horizontal>
              <Text style={styles.debugText}>
                {JSON.stringify(debugInfo, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}

        {/* Error */}
        {rcInfo.error && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Error</Text>
            <Text style={styles.errorText}>{rcInfo.error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {renderButton('Refresh Info', refreshRevenueCatInfo)}
          {renderButton('Initialize RevenueCat', handleInitialize, rcInfo.isInitialized)}
          {renderButton('Login to RevenueCat', handleLogin, !isAuthenticated || !rcInfo.isInitialized)}
          {renderButton('Logout from RevenueCat', handleLogout, !rcInfo.isInitialized)}
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: scale(20)
  },
  title: {
    fontSize: scale(24),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: scale(20)
  },
  section: {
    backgroundColor: '#111',
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: scale(16)
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    color: '#fff',
    marginBottom: scale(12)
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  infoLabel: {
    fontSize: scale(14),
    color: '#ccc',
    flex: 1
  },
  infoValue: {
    fontSize: scale(14),
    color: '#fff',
    flex: 1,
    textAlign: 'right'
  },
  infoValueGood: {
    color: '#4CAF50'
  },
  infoValueBad: {
    color: '#F44336'
  },
  entitlementRow: {
    paddingVertical: scale(4)
  },
  entitlementText: {
    fontSize: scale(14),
    color: '#4CAF50',
    fontWeight: '500'
  },
  noDataText: {
    fontSize: scale(14),
    color: '#888',
    fontStyle: 'italic'
  },
  debugLog: {
    maxHeight: scale(200),
    backgroundColor: '#222',
    borderRadius: scale(8),
    padding: scale(12)
  },
  debugText: {
    fontSize: scale(12),
    color: '#ccc',
    fontFamily: 'monospace'
  },
  errorText: {
    fontSize: scale(14),
    color: '#F44336',
    fontStyle: 'italic'
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: scale(8),
    padding: scale(12),
    marginVertical: scale(4)
  },
  buttonDisabled: {
    backgroundColor: '#555'
  },
  buttonText: {
    fontSize: scale(16),
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500'
  },
  buttonTextDisabled: {
    color: '#888'
  },
  spacer: {
    height: scale(40)
  }
})