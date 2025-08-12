import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

import PhoneInput from '../components/PhoneInput'
import OTPInput from '../components/OTPInput'
import useOTP from '../hooks/useOTP'
import User from '../hooks/user'
import { authCheck } from '../lib/auth'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'

// Import the SVG images
import SigninSvg from '../assets/images/svg/signin.svg'
import LockupSvg from '../assets/images/svg/lockup.svg'

export default function SigninScreen ({ navigation, route }) {
  const { countries, sendOTP, verifyOTP, checkUser } = useOTP()
  const { isAuthenticated, checkingAuth } = authCheck()

  // Get redirect params from route
  const { redirectTo, redirectParams } = route.params || {}

  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [phone, setPhone] = useState('')
  const [selectedCountry] = useState('US') // Defaulting to US only
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('send') // 'send' or 'verify'

  useEffect(() => {
    if (checkingAuth) return

    if (isAuthenticated) {
      // Handle redirect from deep link
      if (redirectTo && redirectParams) {
        navigation.navigate(redirectTo, redirectParams)
      } else {
        navigation.navigate('Connections')
      }
    }
  }, [isAuthenticated, checkingAuth, navigation, redirectTo, redirectParams])

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number')
      return
    }

    try {
      setHasError(false)
      setLoading(true)

      // Clean phone number (remove formatting)
      const cleanPhone = phone.replace(/\D/g, '')
      const countryCode = countries[selectedCountry].secondary

      // Check if user exists (for signin, we want existing users)
      const userCheck = await checkUser(countryCode, cleanPhone)

      if (userCheck.error) {
        throw new Error(userCheck.error)
      }

      if (!userCheck.data?.exists) {
        Alert.alert('Error', 'Account not found. Please sign up first.')
        setLoading(false)
        return
      }

      // Send OTP
      const otpResponse = await sendOTP(countryCode, cleanPhone)

      if (otpResponse.error) {
        throw new Error(otpResponse.error)
      }

      setStep('verify')
      setLoading(false)
    } catch (error) {
      setHasError(true)
      setLoading(false)
      Alert.alert(
        'Error',
        error.message || 'Failed to send verification code. Please try again.'
      )
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter all 4 digits of the verification code')
      return
    }

    try {
      setHasError(false)
      setLoading(true)

      const cleanPhone = phone.replace(/\D/g, '')
      const countryCode = countries[selectedCountry].secondary

      const result = await verifyOTP({
        countryCode,
        phone: cleanPhone,
        otp,
        createManager: false // Signing in existing users
      })

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.data?.authToken) {
        // Store auth token
        await AsyncStorage.setItem('authToken', result.data.authToken)

        // Check if user profile is complete
        try {
          const { me } = User(result.data.authToken)
          const userResponse = await me()
          const userData = userResponse.data

          // Check if user has first name, last name, and avatar
          const hasFirstName =
            userData?.first_name && userData.first_name.trim() !== ''
          const hasLastName =
            userData?.last_name && userData.last_name.trim() !== ''
          const hasAvatar =
            userData?.avatar_url && userData.avatar_url.trim() !== ''

          // If coming from deep link, go to recording first regardless of profile status
          if (redirectTo && redirectParams) {
            // Mark user as needing onboarding if profile incomplete
            if (!hasFirstName || !hasLastName || !hasAvatar) {
              await AsyncStorage.setItem('needsOnboarding', 'true')
              navigation.navigate(redirectTo, {
                ...redirectParams,
                isNewUser: true
              })
            } else {
              // Complete profile, just navigate to recording
              navigation.navigate(redirectTo, redirectParams)
            }
          } else {
            // Not from deep link - handle normal flow
            if (!hasFirstName || !hasLastName || !hasAvatar) {
              // Navigate to onboarding profile step for incomplete profiles
              navigation.navigate('OnboardingProfile')
            } else {
              // Navigate to main app for users with complete profiles
              navigation.navigate('Connections')
            }
          }
        } catch (profileError) {
          // If we can't check the profile, handle redirect or default to connections
          if (redirectTo && redirectParams) {
            navigation.navigate(redirectTo, redirectParams)
          } else {
            navigation.navigate('Connections')
          }
        }
      } else {
        Alert.alert('Error', 'Invalid verification code')
      }

      setLoading(false)
    } catch (error) {
      setHasError(true)
      setLoading(false)
      Alert.alert(
        'Error',
        error.message || 'Invalid verification code. Please try again.'
      )
    }
  }

  const handleBack = () => {
    setLoading(false)
    setHasError(false)
    setStep('send')
    setOtp('')
  }

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#020617' />
      </SafeAreaView>
    )
  }

  const imageSize = getImageSize(300)

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.content}>
          {step === 'send' ? (
            <>
              {/* Scrollable content area */}
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='handled'
                keyboardDismissMode='on-drag'
              >
                <View style={styles.imageContainer}>
                  <SigninSvg
                    width={imageSize}
                    height={imageSize}
                    color={Colors.copy}
                  />
                </View>

                <Text style={styles.title}>Welcome back!</Text>
                <Text style={styles.subtitle}>
                  Let's get you signed back in.
                </Text>

                <View style={styles.inputContainer}>
                  <PhoneInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder='Enter your phone number'
                    hasError={hasError}
                    countryCode={selectedCountry}
                    prefix='+1'
                  />
                </View>
              </ScrollView>

              {/* Fixed buttons at bottom */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.darkButton,
                    (!phone || loading) && styles.disabledButton
                  ]}
                  onPress={handleSendOTP}
                  disabled={!phone || loading}
                >
                  {loading ? (
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <Text style={styles.darkButtonText}>Send my code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.lightButton]}
                  onPress={() =>
                    navigation.navigate('Home', {
                      animation: 'slide_from_left'
                    })
                  }
                >
                  <Text style={styles.lightButtonText}>Go back</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Scrollable content area */}
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps='handled'
                keyboardDismissMode='on-drag'
              >
                <View style={styles.imageContainer}>
                  <LockupSvg
                    width={imageSize}
                    height={imageSize}
                    color={Colors.copy}
                  />
                </View>

                <Text style={styles.title}>
                  Check your phone! We just sent you a code to verify your phone
                  number.
                </Text>

                <OTPInput
                  value={otp}
                  onChangeText={setOtp}
                  hasError={hasError}
                />
              </ScrollView>

              {/* Fixed buttons at bottom */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.darkButton,
                    (otp.length !== 4 || loading) && styles.disabledButton
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={otp.length !== 4 || loading}
                >
                  {loading ? (
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <Text style={styles.darkButtonText}>Verify code</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.lightButton]}
                  onPress={handleBack}
                >
                  <Text style={styles.lightButtonText}>Go back</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: ComponentStyles.container,

  keyboardAvoidingView: {
    flex: 1
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

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white
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
    marginBottom: getResponsiveSpacing.titleMarginBottom * 0.53 // Slightly less than signup screen
  },

  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing.elementSpacing * 1.5
  },

  inputContainer: {
    marginBottom: getResponsiveSpacing.titleMarginBottom,
    width: '100%'
  },

  buttonGroup: ComponentStyles.buttonGroup,

  button: ComponentStyles.button,

  darkButton: ComponentStyles.buttonDark,

  lightButton: ComponentStyles.buttonLight,

  darkButtonText: TextStyles.buttonDark,

  lightButtonText: TextStyles.buttonLight,

  disabledButton: {
    backgroundColor: Colors.border
  }
})
