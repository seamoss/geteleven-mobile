import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

import CountryPicker from '../components/CountryPicker'
import PhoneInput from '../components/PhoneInput'
import OTPInput from '../components/OTPInput'
import useOTP from '../hooks/useOTP'
import User from '../hooks/user'
import { authCheck } from '../lib/auth'
import PushNotificationService from '../services/PushNotificationService'
import {
  TextStyles,
  ComponentStyles,
  Colors,
  FontFamilies
} from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'

// Import the SVG images
import SignupSvg from '../assets/images/svg/signup.svg'
import SigninSvg from '../assets/images/svg/signin.svg'
import LockupSvg from '../assets/images/svg/lockup.svg'
import LogoSvg from '../assets/images/svg/logo.svg'

export default function AuthScreen ({ navigation, route }) {
  const { countries, sendOTP, verifyOTP, checkUser } = useOTP()
  const { isAuthenticated, checkingAuth } = authCheck()

  // Get auth mode and redirect params from route
  const { mode = 'signup', redirectTo, redirectParams } = route.params || {}
  const isSignup = mode === 'signup'

  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [phone, setPhone] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('US') // Default to US
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

      console.log('Sending OTP request:', {
        countryCode,
        phone: cleanPhone,
        fullNumber: `${countryCode}${cleanPhone}`,
        mode
      })

      // Check if user already exists
      console.log('Checking if user exists...')
      const userCheck = await checkUser(countryCode, cleanPhone)

      console.log('User check response:', userCheck)

      if (userCheck.error) {
        console.error('User check failed:', userCheck.error)
        throw new Error(userCheck.error)
      }

      const userExists = userCheck.data?.exists

      // Handle signup flow
      if (isSignup) {
        if (userExists) {
          console.log('User already exists, redirecting to signin')
          // If user exists during signup, redirect to signin with same params
          navigation.navigate('Auth', {
            mode: 'signin',
            redirectTo,
            redirectParams
          })
          setLoading(false)
          return
        }
      }
      // Handle signin flow
      else {
        if (!userExists) {
          Alert.alert('Error', 'Account not found. Please sign up first.')
          setLoading(false)
          return
        }
      }

      // Send OTP
      console.log('Sending OTP...')
      const otpResponse = await sendOTP(countryCode, cleanPhone)

      console.log('OTP sent successfully:', otpResponse)

      if (otpResponse.error) {
        console.error('OTP sending failed:', otpResponse.error)
        throw new Error(otpResponse.error)
      }

      setStep('verify')
      setLoading(false)
    } catch (error) {
      console.error('Send OTP error:', error)
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

      // Get stored push token (don't request permission here)
      const expoPushToken = await PushNotificationService.getStoredToken()
      
      console.log('Verifying OTP:', {
        countryCode,
        phone: cleanPhone,
        otp,
        fullNumber: `${countryCode}${cleanPhone}`,
        createManager: isSignup,
        mode,
        expoPushToken
      })

      const result = await verifyOTP({
        countryCode,
        phone: cleanPhone,
        otp,
        createManager: isSignup, // Create account for signup, signin for existing users
        expoPushToken, // Include push token in verification
        platform: Platform.OS // Include platform information
      })

      console.log('OTP verification response:', result)

      if (result.error) {
        console.error('OTP verification failed:', result.error)
        throw new Error(result.error)
      }

      if (result.data?.authToken) {
        console.log('Authentication successful! Storing token...')

        // Store auth token
        await AsyncStorage.setItem('authToken', result.data.authToken)
        
        // Update push token on server if we have one
        if (expoPushToken) {
          await PushNotificationService.updatePushTokenOnServer(result.data.authToken, expoPushToken)
        }

        if (isSignup) {
          // Handle signup success
          if (redirectTo && redirectParams) {
            // Store flag to indicate user needs onboarding after recording
            await AsyncStorage.setItem('needsOnboarding', 'true')
            navigation.navigate(redirectTo, {
              ...redirectParams,
              isNewUser: true
            })
          } else {
            console.log('Navigating to onboarding...')
            // Navigate to onboarding flow for new users
            navigation.navigate('OnboardingWelcome')
          }
        } else {
          // Handle signin success - check if user profile is complete
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
        }
      } else {
        console.warn('No auth token received')
        Alert.alert('Error', 'Invalid verification code')
      }

      setLoading(false)
    } catch (error) {
      console.error('Verify OTP error:', error)
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

  const handleSwitchMode = () => {
    // Switch between signup and signin
    const newMode = isSignup ? 'signin' : 'signup'
    navigation.navigate('Auth', {
      mode: newMode,
      redirectTo,
      redirectParams
    })
  }

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#020617' />
      </SafeAreaView>
    )
  }

  const imageSize = getImageSize(300)

  // Content based on step and mode
  const getStepContent = () => {
    if (step === 'send') {
      return {
        image: isSignup ? SignupSvg : SigninSvg,
        title: isSignup ? 'We need your digits.' : 'We need your digits.',
        subtitle: isSignup
          ? 'Not your fingers your phone number. It’s safer for you, and us.'
          : 'Not your fingers your phone number. It’s safer for you, and us.',
        buttonText: 'Continue'
      }
    } else {
      return {
        image: LockupSvg,
        title: 'Here comes the SMS',
        subtitle: 'Enter the code we just sent below.',
        buttonText: 'Verify code'
      }
    }
  }

  const content = getStepContent()
  const ImageComponent = content.image

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.mainContainer}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Logo Header */}
          <View style={styles.logoContainer}>
            <LogoSvg width={80} height={40} />
          </View>

          {/* Content area */}
          <View style={styles.contentArea}>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>

            {step === 'send' ? (
              <View style={styles.inputContainer}>
                <CountryPicker
                  countries={countries}
                  selectedCountry={selectedCountry}
                  onSelect={setSelectedCountry}
                  placeholder='Select your country'
                />
                <View style={{ marginTop: 12 }}>
                  <PhoneInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder='Phone number'
                    hasError={hasError}
                    countryCode={selectedCountry}
                    prefix={countries[selectedCountry]?.secondary || '+1'}
                  />
                </View>
              </View>
            ) : (
              <OTPInput value={otp} onChangeText={setOtp} hasError={hasError} />
            )}
          </View>
        </KeyboardAvoidingView>

        {/* Fixed buttons at bottom - outside KeyboardAvoidingView */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.darkButton,
              (step === 'send'
                ? !phone || loading
                : otp.length !== 4 || loading) && styles.disabledButton
            ]}
            onPress={step === 'send' ? handleSendOTP : handleVerifyOTP}
            disabled={
              step === 'send' ? !phone || loading : otp.length !== 4 || loading
            }
          >
            {loading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.darkButtonText}>{content.buttonText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.lightButton]}
            onPress={
              step === 'send'
                ? () =>
                    navigation.navigate('Home', {
                      animation: 'slide_from_left'
                    })
                : handleBack
            }
          >
            <Text style={styles.lightButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: ComponentStyles.container,

  mainContainer: {
    flex: 1
  },

  keyboardAvoidingView: {
    flex: 1
  },

  logoContainer: {
    alignItems: 'left',
    paddingHorizontal: getResponsiveSpacing.horizontalPadding,
    paddingTop: 20,
    paddingBottom: 100
  },

  content: {
    ...ComponentStyles.content,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },

  contentArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing.horizontalPadding,
    paddingBottom: getResponsiveSpacing.elementSpacing,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
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
    fontFamily: FontFamilies.calloutMediumPoppins,
    fontSize: 24,
    fontWeight: 600,
    textAlign: 'left',
    marginBottom: getResponsiveSpacing.titleMarginBottom * 0.17,
    width: '100%',
    maxWidth: 400
    // alignSelf: 'center'
  },

  subtitle: {
    ...TextStyles.body,
    textAlign: 'left',
    marginBottom: getResponsiveSpacing.elementSpacing * 1.5,
    width: '100%',
    maxWidth: 400
  },

  inputContainer: {
    marginBottom: getResponsiveSpacing.titleMarginBottom,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },

  buttonGroup: {
    ...ComponentStyles.buttonGroup,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding,
    paddingBottom: 0
  },

  button: ComponentStyles.button,

  darkButton: ComponentStyles.buttonDark,

  lightButton: ComponentStyles.buttonLight,

  darkButtonText: TextStyles.buttonDark,

  lightButtonText: TextStyles.buttonLight,

  disabledButton: {
    backgroundColor: Colors.border
  },

  switchModeButton: {
    paddingVertical: 12,
    alignItems: 'center'
  },

  switchModeText: {
    ...TextStyles.body,
    color: Colors.primary,
    fontSize: 14
  }
})
