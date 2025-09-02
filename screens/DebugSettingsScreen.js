import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  ScrollView
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import {
  X,
  Bug,
  Mic,
  RotateCcw,
  Settings,
  Smartphone,
  PlayCircle,
  Bell,
  Copy,
  RefreshCw,
  Send,
  DollarSign,
  LogOut,
  ShieldAlert,
  Trash2,
  Activity,
  Globe,
  ShoppingCart,
  Zap
} from 'lucide-react-native'
import { Colors } from '../styles/fonts'
import useTransition from '../hooks/transition'
import { authCheck } from '../lib/auth'
import { api } from '../lib/api'
import PushNotificationService from '../services/PushNotificationService'
import debugRevenueCat from '../utils/revenueCatDebugger'
import AuthService from '../services/AuthService'
import APIHealthCheck from '../utils/apiHealthCheck'
import RevenueCatService from '../services/RevenueCatService'
import { API_BASE_URL } from '../lib/config'

const DebugRow = ({
  Icon,
  size = 24,
  color = '#64748B',
  stroke = 1.5,
  label = null,
  tip = null,
  onPress = () => {},
  disabled = false
}) => {
  return (
    <TouchableOpacity
      style={[styles.debugRow, disabled && styles.debugRowDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.debugIcon}>
        {Icon && (
          <Icon
            size={size}
            color={disabled ? '#cbd5e1' : color}
            strokeWidth={stroke}
          />
        )}
      </View>
      <View style={styles.debugContent}>
        <Text
          style={[styles.debugLabel, disabled && styles.debugLabelDisabled]}
        >
          {label}
        </Text>
        <Text style={[styles.debugTip, disabled && styles.debugTipDisabled]}>
          {tip}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export default function DebugSettingsScreen () {
  const { navigate } = useTransition()
  const { authToken } = authCheck()
  const [loading, setLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('unknown')

  // Push notification state
  const [pushToken, setPushToken] = useState(null)
  const [tokenInfo, setTokenInfo] = useState(null)
  const [pushLoading, setPushLoading] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadPushToken()
    fetchTokenInfo()
  }, [])

  const checkMicrophonePermission = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync()
      setPermissionStatus(status)

      Alert.alert(
        'Microphone Permission Status',
        `Current status: ${status.toUpperCase()}`,
        [{ text: 'OK' }]
      )
    } catch (error) {
      console.error('Error checking microphone permission:', error)
      Alert.alert('Error', 'Failed to check microphone permission')
    }
  }

  const requestMicrophonePermission = async () => {
    setLoading(true)

    try {
      const { status } = await Audio.requestPermissionsAsync()

      let message
      switch (status) {
        case 'granted':
          message =
            'Microphone permission granted! You can now use voice features.'
          break
        case 'denied':
          message =
            'Microphone permission denied. Some features may not work properly.'
          break
        default:
          message = 'Unable to determine microphone permission status.'
      }

      setPermissionStatus(status)

      Alert.alert('Permission Request Result', message, [{ text: 'OK' }])
    } catch (error) {
      console.error('Error requesting microphone permission:', error)
      Alert.alert('Error', 'Failed to request microphone permission')
    } finally {
      setLoading(false)
    }
  }

  const resetOnboardingState = async () => {
    Alert.alert(
      'Reset Onboarding',
      "This will clear your onboarding progress and you'll see the welcome screens again. Continue?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear any onboarding-related storage keys
              await AsyncStorage.multiRemove([
                'onboarding_completed',
                'onboarding_step',
                'onboarding_tour_completed',
                'permissions_requested',
                'user_preferences'
              ])

              Alert.alert(
                'Onboarding Reset',
                'Onboarding state has been cleared. Restart the app to see the welcome screens again.',
                [{ text: 'OK' }]
              )
            } catch (error) {
              console.error('Error resetting onboarding state:', error)
              Alert.alert('Error', 'Failed to reset onboarding state')
            }
          }
        }
      ]
    )
  }

  const clearAllAppData = async () => {
    Alert.alert(
      'Clear All App Data',
      'This will clear ALL stored app data including login state, preferences, and cache. You will need to sign in again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear()

              Alert.alert(
                'App Data Cleared',
                'All app data has been cleared. Please restart the app.',
                [{ text: 'OK' }]
              )
            } catch (error) {
              console.error('Error clearing app data:', error)
              Alert.alert('Error', 'Failed to clear app data')
            }
          }
        }
      ]
    )
  }

  const forceLogout = async () => {
    Alert.alert(
      'Force Logout',
      'This will clear your authentication and force you to sign in again. This is useful if you are stuck in an authentication loop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AuthService.forceLogout()

              if (result.success) {
                Alert.alert(
                  'Logged Out',
                  'You have been forcefully logged out. The app will now restart.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate to auth screen
                        navigate('Auth', { mode: 'signin' })
                      }
                    }
                  ]
                )
              } else {
                Alert.alert(
                  'Error',
                  'Failed to force logout. Try clearing all app data.'
                )
              }
            } catch (error) {
              console.error('Error forcing logout:', error)
              Alert.alert('Error', 'Failed to force logout')
            }
          }
        }
      ]
    )
  }

  const validateAuthToken = async () => {
    try {
      setLoading(true)
      const isValid = await AuthService.validateToken(authToken)

      Alert.alert(
        'Auth Token Status',
        isValid
          ? 'Your auth token is valid and working properly.'
          : 'Your auth token is invalid or expired. You should force logout.',
        [{ text: 'OK' }]
      )
    } catch (error) {
      Alert.alert('Error', 'Failed to validate auth token')
    } finally {
      setLoading(false)
    }
  }

  const openDeviceSettings = () => {
    Linking.openSettings().catch(() => {
      Alert.alert('Error', 'Unable to open device settings')
    })
  }

  const testOnboardingFlow = () => {
    Alert.alert(
      'Test Onboarding',
      'This will take you to the onboarding permissions screen to test the flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Permissions',
          onPress: () => navigate('OnboardingPermissions')
        }
      ]
    )
  }

  const testTourModal = () => {
    Alert.alert(
      'Test Tour Modal',
      'This will take you to the Connections page and show the tour modal.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Tour',
          onPress: () => navigate('Connections', { showTour: true })
        }
      ]
    )
  }

  // Push notification functions
  const loadPushToken = async () => {
    try {
      const token = await AsyncStorage.getItem('expoPushToken')
      setPushToken(token)
    } catch (error) {
      console.error('Error loading push token:', error)
    }
  }

  const fetchTokenInfo = async () => {
    if (!authToken) return

    setPushLoading(true)
    try {
      const response = await api('GET', '/users/me', {}, authToken)
      if (response.data?.expo_push_tokens) {
        setTokenInfo(response.data.expo_push_tokens)
      }
    } catch (error) {
      console.error('Error fetching token info:', error)
    } finally {
      setPushLoading(false)
    }
  }

  const handleCopyToken = async () => {
    if (pushToken) {
      await Clipboard.setStringAsync(pushToken)
      Alert.alert('Copied', 'Push token copied to clipboard')
    }
  }

  const handleRefreshToken = async () => {
    setRefreshing(true)
    try {
      const newToken =
        await PushNotificationService.registerForPushNotifications()

      if (newToken) {
        setPushToken(newToken)

        if (authToken) {
          await PushNotificationService.updatePushTokenOnServer(
            authToken,
            newToken
          )
          await fetchTokenInfo()
        }

        Alert.alert('Success', 'Push token refreshed successfully')
      } else {
        Alert.alert('Error', 'Failed to refresh push token')
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      Alert.alert('Error', 'Failed to refresh push token')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSendTestNotification = async () => {
    if (!authToken) {
      Alert.alert('Error', 'Not authenticated')
      return
    }

    setSendingTest(true)
    try {
      const response = await api(
        'POST',
        '/debug/push-notification-test',
        {
          title: 'Test Notification',
          body: `Test from Eleven Debug at ${new Date().toLocaleTimeString()}`,
          data: {
            type: 'debug_test',
            timestamp: Date.now()
          }
        },
        authToken
      )

      if (response.error) {
        throw new Error(response.error)
      }

      Alert.alert(
        'Success',
        'Test notification sent! You should receive it shortly.'
      )
    } catch (error) {
      console.error('Error sending test notification:', error)
      Alert.alert('Error', `Failed to send test notification: ${error.message}`)
    } finally {
      setSendingTest(false)
    }
  }

  const handleRequestPushPermission = async () => {
    const token = await PushNotificationService.registerForPushNotifications()
    if (token) {
      setPushToken(token)
      if (authToken) {
        await PushNotificationService.updatePushTokenOnServer(authToken, token)
        await fetchTokenInfo()
      }
      Alert.alert('Success', 'Push notifications enabled')
    } else {
      Alert.alert(
        'Push Notifications Not Available',
        'Push notifications require an EAS development build or production build. They are not supported in Expo Go or basic dev builds.\n\nTo test:\n• Build with: eas build --profile development\n• Or run: npx expo run:ios'
      )
    }
  }

  const formatDate = dateString => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const runAPIHealthCheck = async () => {
    Alert.alert(
      'Run API Health Check',
      'This will test API connectivity and diagnose any issues. Check console for detailed output.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Check',
          onPress: async () => {
            try {
              setLoading(true)
              Alert.alert(
                'Running...',
                `Testing API at:\n${API_BASE_URL}\n\nCheck console for details`
              )

              // Run the health check
              const results = await APIHealthCheck.runHealthCheck(authToken)

              // Count issues
              const errors = results.filter(r => r.status === 'error').length
              const warnings = results.filter(
                r => r.status === 'warning'
              ).length

              // Show summary
              setTimeout(() => {
                let title = 'API Healthy'
                let message =
                  'API is functioning properly. Check console for details.'

                if (errors > 0) {
                  title = 'API Issues Found'
                  message = `Found ${errors} errors and ${warnings} warnings. Check console for details.`
                } else if (warnings > 0) {
                  title = 'API Has Warnings'
                  message = `Found ${warnings} warnings. API is partially working. Check console for details.`
                }

                Alert.alert(title, message, [{ text: 'OK' }])
              }, 2000)
            } catch (error) {
              console.error('Error running API health check:', error)
              Alert.alert('Error', 'Failed to run API health check')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const testAppStoreConnect = async () => {
    Alert.alert(
      'Test App Store Connect',
      'This will test direct communication with App Store Connect to see if products are available.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test Products',
          onPress: async () => {
            try {
              setLoading(true)
              Alert.alert(
                'Testing...',
                'Checking App Store Connect directly...'
              )

              console.log('Direct App Store Connect Test')
              console.log('=====================================')

              // Import Purchases directly
              const Purchases = require('react-native-purchases').default

              // Test product IDs from feature flags
              const { getFeatureConfig } = require('../lib/featureFlags')
              const productIds = [
                getFeatureConfig('REVENUECAT_MONTHLY_PRODUCT_ID'),
                getFeatureConfig('REVENUECAT_YEARLY_PRODUCT_ID')
              ].filter(Boolean)

              console.log(`Testing product IDs: [${productIds.join(', ')}]`)

              // Direct call to App Store Connect
              const products = await Purchases.getProducts(productIds)

              console.log(
                `App Store Connect returned ${products.length} products`
              )

              if (products.length === 0) {
                console.error('No products returned from App Store Connect')
                console.log(
                  'This confirms the issue is with App Store Connect configuration'
                )
                Alert.alert(
                  'App Store Connect Issue',
                  'No products returned from App Store Connect. The issue is definitely with App Store Connect or product configuration, not RevenueCat.',
                  [{ text: 'OK' }]
                )
              } else {
                console.log('Products found in App Store Connect:')
                products.forEach((product, i) => {
                  console.log(
                    `${i + 1}. ${product.identifier} - ${product.priceString}`
                  )
                })
                Alert.alert(
                  'App Store Connect OK',
                  `Found ${products.length} products in App Store Connect. The issue might be with RevenueCat configuration.`,
                  [{ text: 'OK' }]
                )
              }
            } catch (error) {
              console.error('Error testing App Store Connect:', error)
              Alert.alert(
                'Error',
                `App Store Connect test failed: ${error.message}`
              )
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const forceInitializeRevenueCat = async () => {
    Alert.alert(
      'Force Initialize RevenueCat',
      'This will force RevenueCat to re-initialize and load products. Check console for product ID logs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Initialize',
          onPress: async () => {
            try {
              setLoading(true)
              Alert.alert(
                'Initializing...',
                'Check console for product ID loading logs'
              )

              console.log('[Debug] Force initializing RevenueCat...')

              // Force re-initialization
              RevenueCatService.isInitialized = false
              const result = await RevenueCatService.initialize()

              console.log('[Debug] Initialization result:', result)

              if (result) {
                console.log('[Debug] Loading offerings to see product IDs...')
                const offerings = await RevenueCatService.getOfferings()

                if (offerings) {
                  console.log('[Debug] Offerings loaded successfully')
                } else {
                  console.error('[Debug] Failed to load offerings')
                }

                Alert.alert(
                  'Initialization Complete',
                  'RevenueCat re-initialized. Check console for product ID logs and offerings details.',
                  [{ text: 'OK' }]
                )
              } else {
                Alert.alert(
                  'Initialization Failed',
                  'RevenueCat initialization failed. Check console for errors.'
                )
              }
            } catch (error) {
              console.error(
                '[Debug] Error force initializing RevenueCat:',
                error
              )
              Alert.alert('Error', `Initialization failed: ${error.message}`)
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  const runRevenueCatDebug = async () => {
    Alert.alert(
      'Run RevenueCat Debugger',
      'This will run a comprehensive diagnostic check. Check the console logs for detailed output.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Debug',
          onPress: async () => {
            try {
              setLoading(true)
              Alert.alert(
                'Running...',
                'Check console for detailed debug output'
              )

              // Run the enhanced debugger
              await debugRevenueCat()

              // Alert when complete
              setTimeout(() => {
                Alert.alert(
                  'Debug Complete',
                  'Enhanced RevenueCat debug completed. Check console for:\n\n• Feature flag config\n• App Store Connect test\n• Individual product loading\n• RevenueCat offerings\n• Detailed error analysis',
                  [{ text: 'OK' }]
                )
              }, 3000)
            } catch (error) {
              console.error('Error running RevenueCat debug:', error)
              Alert.alert('Error', 'Failed to run RevenueCat debugger')
            } finally {
              setLoading(false)
            }
          }
        }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header with Debug Settings title and floating X */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Debug Settings</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() =>
              navigate('Settings', { animation: 'slide_from_left' })
            }
          >
            <X size={20} color={Colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Bug size={16} color='#f59e0b' strokeWidth={2} />
          <Text style={styles.warningText}>
            This screen is for development and testing purposes only.
          </Text>
        </View>

        {/* API Health Check Section */}
        <View style={styles.debugGroup}>
          <Text style={styles.sectionTitle}>API Diagnostics</Text>

          <DebugRow
            Icon={Activity}
            label='Run API Health Check'
            tip='Test API connectivity and diagnose 404 errors.'
            onPress={runAPIHealthCheck}
            disabled={loading}
          />

          <DebugRow
            Icon={Globe}
            label='View API Configuration'
            tip={`Current: ${API_BASE_URL}`}
            onPress={() => {
              Alert.alert(
                'API Configuration',
                `Base URL: ${API_BASE_URL}\n\nEnvironment: ${
                  __DEV__ ? 'Development' : 'Production'
                }\n\nIf you're seeing 404s, check:\n1. Is your local API running?\n2. Is the URL correct?\n3. Are you on the right network?`,
                [{ text: 'OK' }]
              )
            }}
          />
        </View>

        {/* Authentication Debug Section */}
        <View style={styles.debugGroup}>
          <Text style={styles.sectionTitle}>Authentication Debug</Text>

          <DebugRow
            Icon={ShieldAlert}
            label='Validate Auth Token'
            tip='Check if your current auth token is valid.'
            onPress={validateAuthToken}
            disabled={loading || !authToken}
          />

          <DebugRow
            Icon={LogOut}
            label='Force Logout'
            tip='Clear auth and force sign in. Use if stuck in auth loop.'
            onPress={forceLogout}
            color='#f59e0b'
          />

          <DebugRow
            Icon={Trash2}
            label='Clear All App Data'
            tip='Nuclear option - clears everything and resets the app.'
            onPress={clearAllAppData}
            color='#ef4444'
          />
        </View>

        {/* Debug Options */}
        <View style={styles.debugGroup}>
          <Text style={styles.sectionTitle}>General Debug</Text>
          <DebugRow
            Icon={Mic}
            label='Check Microphone Permission'
            tip='Check the current microphone permission status.'
            onPress={checkMicrophonePermission}
          />

          <DebugRow
            Icon={Mic}
            label='Request Microphone Permission'
            tip='Manually request microphone permission.'
            onPress={requestMicrophonePermission}
            disabled={loading}
          />

          <DebugRow
            Icon={Settings}
            label='Open Device Settings'
            tip='Open device settings to manually change permissions.'
            onPress={openDeviceSettings}
          />

          <DebugRow
            Icon={Smartphone}
            label='Test Onboarding Permissions'
            tip='Navigate to the onboarding permissions screen.'
            onPress={testOnboardingFlow}
          />

          <DebugRow
            Icon={PlayCircle}
            label='Test Tour Modal'
            tip='Show the tour modal on the Connections page.'
            onPress={testTourModal}
          />

          <DebugRow
            Icon={RotateCcw}
            label='Reset Onboarding State'
            tip='Clear onboarding progress to test welcome screens.'
            onPress={resetOnboardingState}
          />
        </View>

        {/* RevenueCat / In-App Purchases Section */}
        <View style={styles.debugGroup}>
          <Text style={styles.sectionTitle}>RevenueCat / In-App Purchases</Text>

          <DebugRow
            Icon={Zap}
            label='Force Initialize RevenueCat'
            tip='Force re-initialize RevenueCat and show product ID loading logs.'
            onPress={forceInitializeRevenueCat}
            disabled={loading}
            color='#f59e0b'
          />

          <DebugRow
            Icon={ShoppingCart}
            label='Test App Store Connect'
            tip='Test direct connection to App Store Connect products.'
            onPress={testAppStoreConnect}
            disabled={loading}
          />

          <DebugRow
            Icon={DollarSign}
            label='Run Full RevenueCat Debug'
            tip='Comprehensive RevenueCat diagnostics with verbose logging.'
            onPress={runRevenueCatDebug}
            disabled={loading}
          />
        </View>

        {/* Push Notifications Section */}
        <View style={styles.debugGroup}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>

          {/* Current Token Display */}
          <View style={styles.tokenSection}>
            <Text style={styles.tokenLabel}>Current Push Token</Text>
            <View style={styles.tokenContainer}>
              {pushToken ? (
                <>
                  <Text style={styles.tokenText} numberOfLines={2}>
                    {pushToken}
                  </Text>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={handleCopyToken}
                  >
                    <Copy size={16} color={Colors.copy} />
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.noTokenText}>No push token found</Text>
              )}
            </View>
          </View>

          {/* Server Tokens Info */}
          <View style={styles.tokenSection}>
            <Text style={styles.tokenLabel}>Server-Side Tokens</Text>
            {pushLoading ? (
              <ActivityIndicator
                size='small'
                color={Colors.copy}
                style={styles.loader}
              />
            ) : tokenInfo && tokenInfo.length > 0 ? (
              <View style={styles.serverTokensContainer}>
                {tokenInfo.map((token, index) => (
                  <View key={token.id} style={styles.tokenInfoCard}>
                    <Text style={styles.tokenInfoText}>
                      #{index + 1} - {token.platform || 'Unknown'} •{' '}
                      {token.is_active ? '✅' : '❌'}
                    </Text>
                    <Text style={styles.tokenInfoSubtext}>
                      Created: {formatDate(token.created_at)}
                    </Text>
                  </View>
                ))}
                <Text style={styles.tokenSummary}>
                  Total: {tokenInfo.length} - Active:{' '}
                  {tokenInfo.filter(t => t.is_active).length}
                </Text>
              </View>
            ) : (
              <Text style={styles.noTokenText}>
                No tokens registered on server
              </Text>
            )}
          </View>

          {/* Push Actions */}
          {!pushToken ? (
            <DebugRow
              Icon={Bell}
              label='Request Push Permission'
              tip='Enable push notifications for this device.'
              onPress={handleRequestPushPermission}
            />
          ) : (
            <>
              <DebugRow
                Icon={RefreshCw}
                label='Refresh Push Token'
                tip='Generate new token and update server.'
                onPress={handleRefreshToken}
                disabled={refreshing}
              />
              <DebugRow
                Icon={Send}
                label='Send Test Notification'
                tip='Send test push notification to this device.'
                onPress={handleSendTestNotification}
                disabled={sendingTest || !pushToken}
              />
            </>
          )}
        </View>

        {/* Current Status */}
        {permissionStatus !== 'unknown' && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Current Microphone Status:</Text>
            <View
              style={[
                styles.statusBadge,
                permissionStatus === 'granted'
                  ? styles.statusGranted
                  : permissionStatus === 'blocked'
                  ? styles.statusBlocked
                  : styles.statusDenied
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  permissionStatus === 'granted'
                    ? styles.statusTextGranted
                    : permissionStatus === 'blocked'
                    ? styles.statusTextBlocked
                    : styles.statusTextDenied
                ]}
              >
                {permissionStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 15
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  header: {
    fontSize: 24,
    fontWeight: '500',
    color: '#020617',
    fontFamily: 'Poppins_500Medium'
  },
  closeButton: {
    padding: 8
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 30
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 8,
    flex: 1
  },
  debugGroup: {
    width: '100%'
  },
  debugRow: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 25,
    opacity: 1
  },
  debugRowDisabled: {
    opacity: 0.5
  },
  debugIcon: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    width: 50
  },
  debugContent: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    width: '100%',
    flex: 1
  },
  debugLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'left',
    width: '100%',
    color: Colors.copy
  },
  debugLabelDisabled: {
    color: '#cbd5e1'
  },
  debugTip: {
    padding: 0,
    fontSize: 12,
    textAlign: 'left',
    width: '100%',
    color: Colors.placeholder
  },
  debugTipDisabled: {
    color: '#cbd5e1'
  },
  statusContainer: {
    marginTop: 30,
    alignItems: 'center'
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.copy,
    marginBottom: 8
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1
  },
  statusGranted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e'
  },
  statusDenied: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444'
  },
  statusBlocked: {
    backgroundColor: '#fef2f2',
    borderColor: '#dc2626'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  statusTextGranted: {
    color: '#22c55e'
  },
  statusTextDenied: {
    color: '#ef4444'
  },
  statusTextBlocked: {
    color: '#dc2626'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.copy,
    marginBottom: 15,
    marginTop: 10
  },
  tokenSection: {
    marginBottom: 20
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.copy,
    marginBottom: 8
  },
  tokenContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44
  },
  tokenText: {
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 8,
    color: Colors.copy
  },
  noTokenText: {
    fontSize: 12,
    color: Colors.placeholder,
    fontStyle: 'italic'
  },
  iconButton: {
    padding: 4
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: 8
  },
  serverTokensContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8
  },
  tokenInfoCard: {
    marginBottom: 8
  },
  tokenInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.copy,
    marginBottom: 2
  },
  tokenInfoSubtext: {
    fontSize: 10,
    color: Colors.placeholder
  },
  tokenSummary: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.placeholder,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  }
})
