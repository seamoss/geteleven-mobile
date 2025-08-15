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
  Send
} from 'lucide-react-native'
import { Colors } from '../styles/fonts'
import useTransition from '../hooks/transition'
import { authCheck } from '../lib/auth'
import { api } from '../lib/api'
import PushNotificationService from '../services/PushNotificationService'

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
          message = 'Microphone permission granted! You can now use voice features.'
          break
        case 'denied':
          message = 'Microphone permission denied. Some features may not work properly.'
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
      const newToken = await PushNotificationService.registerForPushNotifications()
      
      if (newToken) {
        setPushToken(newToken)
        
        if (authToken) {
          await PushNotificationService.updatePushTokenOnServer(authToken, newToken)
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

      Alert.alert('Success', 'Test notification sent! You should receive it shortly.')
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleString()
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

          <DebugRow
            Icon={RotateCcw}
            label='Clear All App Data'
            tip='Clear all stored data including auth tokens.'
            onPress={clearAllAppData}
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
              <ActivityIndicator size="small" color={Colors.copy} style={styles.loader} />
            ) : tokenInfo && tokenInfo.length > 0 ? (
              <View style={styles.serverTokensContainer}>
                {tokenInfo.map((token, index) => (
                  <View key={token.id} style={styles.tokenInfoCard}>
                    <Text style={styles.tokenInfoText}>
                      #{index + 1} • {token.platform || 'Unknown'} • {token.is_active ? '✅' : '❌'}
                    </Text>
                    <Text style={styles.tokenInfoSubtext}>
                      Created: {formatDate(token.created_at)}
                    </Text>
                  </View>
                ))}
                <Text style={styles.tokenSummary}>
                  Total: {tokenInfo.length} • Active: {tokenInfo.filter(t => t.is_active).length}
                </Text>
              </View>
            ) : (
              <Text style={styles.noTokenText}>No tokens registered on server</Text>
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
