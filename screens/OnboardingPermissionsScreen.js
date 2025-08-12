import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'

// Import the SVG images
import MicrophoneSvg from '../assets/images/svg/microphone.svg'
import PermissionErrorSvg from '../assets/images/svg/permission-error.svg'

export default function OnboardingPermissionsScreen ({ navigation }) {
  const [permissionStatus, setPermissionStatus] = useState('unknown') // 'unknown', 'granted', 'denied'
  const [loading, setLoading] = useState(false)

  const handleRequestPermission = async () => {
    setLoading(true)

    try {
      const { status } = await Audio.requestPermissionsAsync()
      
      if (status === 'granted') {
        setPermissionStatus('granted')
      } else {
        setPermissionStatus('denied')
      }
    } catch (error) {
      console.error('Error requesting microphone permission:', error)
      setPermissionStatus('denied')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    navigation.navigate('OnboardingTour')
  }

  const handleSkip = () => {
    // Show alert explaining why permission is needed
    Alert.alert(
      'Microphone Permission Required',
      "Eleven requires microphone access to send voice messages. Without this permission, you won't be able to record and send messages to your connections.",
      [
        {
          text: 'Try Again',
          onPress: handleRequestPermission
        },
        {
          text: 'Continue Anyway',
          style: 'destructive',
          onPress: handleContinue
        }
      ]
    )
  }

  // Check if we already have permission on screen load
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { status } = await Audio.getPermissionsAsync()
        
        if (status === 'granted') {
          setPermissionStatus('granted')
        } else {
          // Don't immediately show error state - let user try to grant permission first
          // Only show error after they've attempted to grant and it was denied
          setPermissionStatus('unknown')
        }
      } catch (error) {
        console.error('Error checking microphone permission:', error)
        setPermissionStatus('unknown')
      }
    }

    checkPermission()
  }, [])

  const imageSize = getImageSize(280)

  return (
    <SafeAreaView style={styles.container}>
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
                <MicrophoneSvg
                  width={imageSize}
                  height={imageSize}
                  color={Colors.copy}
                />
              </View>
              <Text style={styles.title}>Permissions, please!</Text>
              <Text style={styles.subtitle}>
                Before we can send voice messages, we need permission to use
                your microphone. Click the button below to grant permission.
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
                  {loading ? 'Requesting...' : 'Grant Permission'}
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
                <MicrophoneSvg
                  width={imageSize}
                  height={imageSize}
                  color={Colors.copy}
                />
              </View>
              <Text style={styles.title}>Permissions look great!</Text>
              <Text style={styles.subtitle}>
                Huzzah! have permission to access your microphone. You're all
                set to send messages to your connections.
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
              <Text style={styles.title}>
                Uh oh! Something isn't quite right.
              </Text>
              <Text style={styles.subtitle}>
                It looks like microphone permission was denied. To send voice
                messages, you'll need to enable microphone access in your device
                settings.
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
                <Text style={styles.lightButtonText}>Continue Anyway</Text>
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
    textAlign: 'left',
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
