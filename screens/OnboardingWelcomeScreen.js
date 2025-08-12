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

// Import the SVG images
import OnboardingStartSvg from '../assets/images/svg/onboarding-start.svg'
import LogoSvg from '../assets/images/svg/logo.svg'

export default function OnboardingWelcomeScreen ({ navigation }) {
  const handleContinue = () => {
    navigation.navigate('OnboardingPermissions')
  }

  const imageSize = getImageSize(300)

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Header */}
      <View style={styles.logoContainer}>
        <LogoSvg width={80} height={40} />
      </View>

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

          <Text style={styles.title}>You made it!</Text>
          <Text
            style={{
              ...styles.subtitle,
              paddingHorizontal: getResponsiveSpacing.horizontalPadding + 12
            }}
          >
            Eleven is about strengthening connections, we can’t do that without
            knowing a few things about you first, can we?
          </Text>
        </ScrollView>

        {/* Fixed buttons at bottom */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.darkButton]}
            onPress={handleContinue}
          >
            <Text style={styles.darkButtonText}>Let's go</Text>
          </TouchableOpacity>
        </View>
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
