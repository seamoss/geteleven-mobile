import React, { useState } from 'react'
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
import Tour1Svg from '../assets/images/svg/share.svg'
import Tour2Svg from '../assets/images/svg/share.svg'
import Tour3Svg from '../assets/images/svg/grow.svg'
import LogoSvg from '../assets/images/svg/logo.svg'

const tourSteps = [
  {
    id: 1,
    component: Tour1Svg,
    title: 'Connect with your network',
    subtitle:
      'Build authentic connections with people in your industry. Discover professionals who share your interests and goals.'
  },
  {
    id: 2,
    component: Tour2Svg,
    title: 'Share your voice',
    subtitle:
      'Express yourself through voice messages. Your authentic voice creates deeper, more personal connections than text ever could.'
  },
  {
    id: 3,
    component: Tour3Svg,
    title: 'Grow your opportunities',
    subtitle:
      "Turn conversations into opportunities. Whether it's finding mentors, collaborators, or your next career move."
  }
]

export default function OnboardingTourScreen ({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigation.navigate('Connections', { autoOpenModal: true })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    } else {
      navigation.goBack()
    }
  }

  const currentTour = tourSteps[currentStep]
  const SvgComponent = currentTour.component
  const imageSize = getImageSize(280)

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
            <SvgComponent
              width={imageSize}
              height={imageSize}
              color={Colors.copy}
            />
          </View>

          <Text style={styles.title}>{currentTour.title}</Text>
          <Text style={styles.subtitle}>{currentTour.subtitle}</Text>
        </ScrollView>

        {/* Fixed buttons at bottom */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.darkButton]}
            onPress={handleNext}
          >
            <Text style={styles.darkButtonText}>
              {currentStep < tourSteps.length - 1 ? 'Next' : 'Start connecting!'}
            </Text>
          </TouchableOpacity>

          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.lightButton]}
              onPress={handleBack}
            >
              <Text style={styles.lightButtonText}>Back</Text>
            </TouchableOpacity>
          )}
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
    textAlign: 'center',
    marginBottom: getResponsiveSpacing.elementSpacing * 0.5
  },

  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing.titleMarginBottom * 0.8
  },

  buttonGroup: ComponentStyles.buttonGroup,

  button: ComponentStyles.button,

  darkButton: ComponentStyles.buttonDark,

  lightButton: ComponentStyles.buttonLight,

  darkButtonText: TextStyles.buttonDark,

  lightButtonText: TextStyles.buttonLight
})
