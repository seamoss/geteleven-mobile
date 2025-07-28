import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'

// Import the SVG image
import OnboardingStartSvg from '../assets/images/svg/onboarding-start.svg'

export default function OnboardingWelcomeScreen ({ navigation }) {
  const handleContinue = () => {
    navigation.navigate('OnboardingPermissions')
  }

  const imageSize = getImageSize(300)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Scrollable content area */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageContainer}>
            <OnboardingStartSvg
              width={imageSize}
              height={imageSize}
              color={Colors.copy}
            />
          </View>

          <Text style={styles.title}>Welcome to Eleven!</Text>
          <Text style={styles.subtitle}>
            You're all set! Let's take a quick tour to help you get the most out
            of your new account and connect with your network.
          </Text>
        </ScrollView>

        {/* Fixed buttons at bottom */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.darkButton]}
            onPress={handleContinue}
          >
            <Text style={styles.darkButtonText}>Let's get started</Text>
          </TouchableOpacity>
        </View>
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
