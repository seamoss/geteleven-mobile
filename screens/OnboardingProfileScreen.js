import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'
import { authCheck } from '../lib/auth'
import api from '../lib/api'

// Import the SVG images
import OnboardingNameSvg from '../assets/images/svg/onboarding-name.svg'
import LogoSvg from '../assets/images/svg/logo.svg'

export default function OnboardingProfileScreen ({ navigation }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)

  const { authToken } = authCheck()

  const handleContinue = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        'Required Fields',
        'Please enter both your first and last name.'
      )
      return
    }

    setLoading(true)

    try {
      // Save profile data to API
      console.log('Saving profile:', {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      })

      await api(
        'put',
        '/users/me/profile',
        {
          firstName: firstName.trim(),
          lastName: lastName.trim()
        },
        authToken
      )

      console.log('Profile saved successfully')

      // Navigate to photo upload screen with profile data
      navigation.navigate('OnboardingPhoto', {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      })
    } catch (error) {
      console.error('Profile setup error:', error)
      Alert.alert('Error', 'Failed to save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const imageSize = 210

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
            <View style={styles.imageContainer}>
              <OnboardingNameSvg
                width={imageSize}
                height={imageSize}
                color={Colors.copy}
              />
            </View>

            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>
              People need a way to identify you on Eleven, what two-ish words
              would suit here?
            </Text>

            <View style={styles.inputContainer}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder='First name'
                  placeholderTextColor={Colors.placeholder}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize='words'
                  returnKeyType='next'
                />
              </View>

              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder='Last name or initial'
                  placeholderTextColor={Colors.placeholder}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize='words'
                  returnKeyType='done'
                  onSubmitEditing={handleContinue}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Fixed buttons at bottom - outside KeyboardAvoidingView */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.darkButton,
              (!firstName.trim() || !lastName.trim() || loading) &&
                styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!firstName.trim() || !lastName.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.darkButtonText}>Continue</Text>
            )}
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
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40
  },

  content: {
    ...ComponentStyles.content,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },

  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveSpacing.horizontalPadding,
    paddingBottom: getResponsiveSpacing.elementSpacing,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
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
    marginBottom: getResponsiveSpacing.elementSpacing * 1.3
  },

  inputContainer: {
    marginBottom: getResponsiveSpacing.titleMarginBottom * 0.8,
    gap: getResponsiveSpacing.elementSpacing,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center'
  },

  inputGroup: {
    flex: 1 // Take available space
  },

  inputLabel: {
    ...TextStyles.body,
    marginBottom: getResponsiveSpacing.elementSpacing * 0.4
  },

  input: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: Colors.copy,
    minHeight: 48 // Ensure good touch target
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
  }
})
