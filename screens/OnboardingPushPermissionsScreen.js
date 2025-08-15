import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'
import PushNotificationService from '../services/PushNotificationService'
import { authCheck } from '../lib/auth'

// Import the SVG images
import MessagesSvg from '../assets/images/svg/messages.svg'
import PermissionErrorSvg from '../assets/images/svg/permission-error.svg'
import LogoSvg from '../assets/images/svg/logo.svg'

export default function OnboardingPushPermissionsScreen ({ navigation }) {
  const { authToken } = authCheck()
  const [permissionStatus, setPermissionStatus] = useState('unknown') // 'unknown', 'granted', 'denied', 'unavailable'
  const [loading, setLoading] = useState(false)

  const handleRequestPermission = async () => {
    setLoading(true)

    try {
      const token = await PushNotificationService.registerForPushNotifications()

      if (token) {
        setPermissionStatus('granted')

        // Update token on server if we have auth
        if (authToken) {
          await PushNotificationService.updatePushTokenOnServer(
            authToken,
            token
          )
        }
      } else {
        // Push notifications not available (likely dev build)
        setPermissionStatus('unavailable')
      }
    } catch (error) {
      console.error('Error requesting push notification permission:', error)
      setPermissionStatus('denied')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    navigation.navigate('OnboardingProfile')
  }

  const handleSkip = () => {
    // Allow skipping since push notifications are optional
    Alert.alert(
      'Skip Push Notifications?',
      'You can always enable push notifications later in your settings.',
      [
        {
          text: 'Enable Now',
          onPress: handleRequestPermission
        },
        {
          text: 'Skip for Now',
          style: 'cancel',
          onPress: handleContinue
        }
      ]
    )
  }

  // Check if we already have permission on screen load
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Try to get existing token from storage
        const existingToken = await PushNotificationService.getStoredToken()

        if (existingToken) {
          setPermissionStatus('granted')
        } else {
          setPermissionStatus('unknown')
        }
      } catch (error) {
        console.error('Error checking push notification permission:', error)
        setPermissionStatus('unknown')
      }
    }

    checkPermission()
  }, [])

  const imageSize = getImageSize(300)

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Header */}
      <View style={styles.logoContainer}>
        <LogoSvg width={80} height={40} />
      </View>

      <View style={styles.content}>
        {permissionStatus === 'unknown' && (
          <>
            {/* Scrollable content area */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imageContainer}>
                <MessagesSvg
                  width={imageSize}
                  height={imageSize}
                  color={Colors.copy}
                />
              </View>
              <Text style={styles.title}>Stay in the loop!</Text>
              <Text style={styles.subtitle}>
                Enable push notifications to recieve notifications like
                reminders or app notices. Don't worry, we will not send messages
                unless you specicially enable them in your settings.
              </Text>
            </ScrollView>

            {/* Fixed buttons at bottom */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.darkButton]}
                onPress={handleRequestPermission}
                disabled={loading}
              >
                <Text style={styles.darkButtonText}>
                  {loading ? 'Enabling...' : 'Enable Notifications'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.lightButton]}
                onPress={handleSkip}
                disabled={loading}
              >
                <Text style={styles.lightButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {permissionStatus === 'granted' && (
          <>
            {/* Scrollable content area */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imageContainer}>
                <MessagesSvg
                  width={imageSize}
                  height={imageSize}
                  color={Colors.copy}
                />
              </View>
              <Text style={styles.title}>You're all set!</Text>
              <Text style={styles.subtitle}>
                Perfect! You'll now receive push notifications for the
                notification types you enable.
              </Text>
            </ScrollView>

            {/* Fixed buttons at bottom */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.darkButton]}
                onPress={handleContinue}
              >
                <Text style={styles.darkButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {permissionStatus === 'denied' && (
          <>
            {/* Scrollable content area */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imageContainer}>
                <PermissionErrorSvg
                  width={imageSize}
                  height={imageSize}
                  color={Colors.copy}
                />
              </View>
              <Text style={styles.title}>Notifications were declined</Text>
              <Text style={styles.subtitle}>
                No worries! You can still use Eleven without push notifications.
                You can enable them later in your device settings if you change
                your mind.
              </Text>
            </ScrollView>

            {/* Fixed buttons at bottom */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.darkButton]}
                onPress={handleRequestPermission}
              >
                <Text style={styles.darkButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.lightButton]}
                onPress={handleContinue}
              >
                <Text style={styles.lightButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {permissionStatus === 'unavailable' && (
          <>
            {/* Scrollable content area */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imageContainer}>
                <MessagesSvg
                  width={imageSize}
                  height={imageSize}
                  color={Colors.copy}
                />
              </View>
              <Text style={styles.title}>Push notifications not available</Text>
              <Text style={styles.subtitle}>
                Push notifications require a production or EAS development
                build. You can continue using Eleven and enable notifications
                when you install the final app.
              </Text>
            </ScrollView>

            {/* Fixed buttons at bottom */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.darkButton]}
                onPress={handleContinue}
              >
                <Text style={styles.darkButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: ComponentStyles.container,

  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40
  },

  content: {
    ...ComponentStyles.content,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },

  scrollContent: {
    flex: 1
  },

  scrollContentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: getResponsiveSpacing.elementSpacing
  },

  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: getResponsiveSpacing.imageMarginVertical
  },

  title: {
    ...TextStyles.title,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing.elementSpacing * 0.5
  },

  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing.titleMarginBottom
  },

  buttonGroup: ComponentStyles.buttonGroup,

  button: ComponentStyles.button,

  darkButton: ComponentStyles.buttonDark,

  lightButton: ComponentStyles.buttonLight,

  darkButtonText: TextStyles.buttonDark,

  lightButtonText: TextStyles.buttonLight
})
