import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native'
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
  PlayCircle
} from 'lucide-react-native'
import { Colors } from '../styles/fonts'
import useTransition from '../hooks/transition'

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
  const [loading, setLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState('unknown')

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
      </View>
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
  }
})
