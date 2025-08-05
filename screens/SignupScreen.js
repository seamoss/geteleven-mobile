import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'

// CountryPicker removed - using US only
import PhoneInput from '../components/PhoneInput'
import OTPInput from '../components/OTPInput'
import useOTP from '../hooks/useOTP'
import { authCheck } from '../lib/auth'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'

// Import the SVG images
import CreateManagerSvg from '../assets/images/svg/create-manager.svg'
import LockupSvg from '../assets/images/svg/lockup.svg'

export default function SignupScreen ({ navigation }) {
  const { countries, sendOTP, verifyOTP, checkUser } = useOTP()
  const { isAuthenticated, checkingAuth } = authCheck()

  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [phone, setPhone] = useState('')
  const [selectedCountry] = useState('US') // Defaulting to US only
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('send') // 'send' or 'verify'

  useEffect(() => {
    if (checkingAuth) return

    if (isAuthenticated) {
      navigation.navigate('Connections')
    }
  }, [isAuthenticated, checkingAuth, navigation])

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
        fullNumber: `${countryCode}${cleanPhone}`
      })

      // Check if user already exists
      console.log('Checking if user exists...')
      const userCheck = await checkUser(countryCode, cleanPhone)

      console.log('User check response:', userCheck)

      if (userCheck.error) {
        console.error('❌ User check failed:', userCheck.error)
        throw new Error(userCheck.error)
      }

      if (userCheck.data?.exists) {
        console.log('User already exists')
        Alert.alert('Error', 'User already exists. Please sign in instead.')
        setLoading(false)
        return
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

      console.log('Verifying OTP:', {
        countryCode,
        phone: cleanPhone,
        otp,
        fullNumber: `${countryCode}${cleanPhone}`,
        createManager: true
      })

      const result = await verifyOTP({
        countryCode,
        phone: cleanPhone,
        otp,
        createManager: true // Creating new accounts as "Pro" for early access
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

        console.log('Navigating to onboarding...')
        // Navigate to onboarding flow for new users
        navigation.navigate('OnboardingWelcome')
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

  // handleCountrySelect removed - using US only

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#020617' />
      </SafeAreaView>
    )
  }

  const imageSize = getImageSize(300)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {step === 'send' ? (
          <>
            {/* Scrollable content area */}
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imageContainer}>
                <CreateManagerSvg
                  width={imageSize}
                  height={imageSize}
                  color={Colors.copy}
                />
              </View>

              <Text style={styles.title}>
                Awesome! Let's get you signed up.
              </Text>
              <Text style={styles.subtitle}>
                Enter your phone number below. We'll send you a text message
                with a code to verify it's you.
              </Text>

              <View style={styles.inputContainer}>
                <PhoneInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder='Enter your phone number'
                  hasError={hasError}
                  countryCode={selectedCountry}
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
                  navigation.navigate('Home', { animation: 'slide_from_left' })
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

              <OTPInput value={otp} onChangeText={setOtp} hasError={hasError} />
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
    textAlign: 'center',
    marginBottom: getResponsiveSpacing.titleMarginBottom * 0.47 // Slightly less than home screen
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
