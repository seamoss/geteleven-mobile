import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Animated
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'

// Import the SVG images
import Tour1Svg from '../assets/images/svg/tour-1.svg'
import Tour2Svg from '../assets/images/svg/tour-2.svg'
import Tour3Svg from '../assets/images/svg/tour-3.svg'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const tourSteps = [
  {
    id: 1,
    component: Tour1Svg,
    title: 'Welcome to Eleven!',
    subtitle:
      'Here you and your team can capture key moments for growth and mentoring, leveling up your 1:1s and keeping focus on what really matters.'
  },
  {
    id: 2,
    component: Tour2Svg,
    title: 'Got some nuggets of wisdom?',
    subtitle:
      "Instantly record and share your thoughts in private threads. Don't worry - we won't bombard you with notifications. Your messages are here, when you need them."
  },
  {
    id: 3,
    component: Tour3Svg,
    title: "It's better here with friends!",
    subtitle:
      'Eleven seems a little lonely without connections. Share your QR code or unique share link to invite people to Eleven for free.'
  }
]

export default function TourModal ({ visible, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Animation values
  const contentOpacity = useRef(new Animated.Value(1)).current
  const modalHeight = useRef(new Animated.Value(0)).current
  const [contentHeight, setContentHeight] = useState(0)

  // Initialize modal height on first render
  useEffect(() => {
    if (contentHeight > 0 && modalHeight._value === 0) {
      modalHeight.setValue(contentHeight)
    }
  }, [contentHeight])

  // Reset animations when modal becomes visible
  useEffect(() => {
    if (visible) {
      contentOpacity.setValue(1)
      setIsAnimating(false)
      setCurrentStep(0)
    }
  }, [visible])

  // Handle content height changes with animation
  const onContentLayout = (event) => {
    const { height } = event.nativeEvent.layout
    const newHeight = height + 200 // Add image height
    
    if (contentHeight > 0 && Math.abs(newHeight - contentHeight) > 5) {
      // Animate height change only if not initial render
      Animated.timing(modalHeight, {
        toValue: newHeight,
        duration: 300,
        useNativeDriver: false // Height changes affect layout
      }).start()
    } else if (contentHeight === 0) {
      // Set initial height without animation
      modalHeight.setValue(newHeight)
    }
    
    setContentHeight(newHeight)
  }

  // Animation function for content transitions
  const animateToStep = (newStep, callback) => {
    if (isAnimating) return

    setIsAnimating(true)
    
    // Fade out current content
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      // Change step content
      callback()
      
      // Fade in new content
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start(() => {
        setIsAnimating(false)
      })
    })
  }

  const handleNext = () => {
    if (isAnimating) return
    
    if (currentStep < tourSteps.length - 1) {
      animateToStep(currentStep + 1, () => {
        setCurrentStep(currentStep + 1)
      })
    } else {
      // Tour completed, reset and close
      setCurrentStep(0)
      onComplete()
    }
  }

  const handleBack = () => {
    if (isAnimating) return
    
    if (currentStep > 0) {
      animateToStep(currentStep - 1, () => {
        setCurrentStep(currentStep - 1)
      })
    }
  }

  const handleSkip = () => {
    // Skip tour, reset and close
    setCurrentStep(0)
    onComplete()
  }

  const currentTour = tourSteps[currentStep]
  const SvgComponent = currentTour.component
  const imageSize = getImageSize(280) // Same as OnboardingTourScreen

  return (
    <Modal
      visible={visible}
      animationType='fade'
      transparent={true}
      onRequestClose={onComplete}
    >
      <View style={styles.modalOverlay}>
        <Animated.View style={[
          styles.modalContainer,
          contentHeight > 0 && { height: modalHeight }
        ]}>
          {/* Image flush to top and sides */}
          <View style={styles.imageContainer}>
            <Animated.View style={{ opacity: contentOpacity }}>
              <SvgComponent
                width='100%'
                height={200}
                preserveAspectRatio='xMidYMid slice'
                color={Colors.copy}
              />
            </Animated.View>
          </View>

          {/* Content section with spacing */}
          <View 
            style={styles.contentSection}
            onLayout={onContentLayout}
          >
            <Animated.View style={{ opacity: contentOpacity }}>
              <Text style={styles.title}>{currentTour.title}</Text>
              <Text style={styles.subtitle}>{currentTour.subtitle}</Text>
            </Animated.View>

            {/* Buttons at bottom */}
            <View style={styles.buttonGroup}>
              <View style={styles.buttonRow}>
                {currentStep > 0 ? (
                  <TouchableOpacity
                    style={[styles.compactButton, styles.lightButton]}
                    onPress={handleBack}
                    disabled={isAnimating}
                  >
                    <Text style={styles.lightButtonText}>Back</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.buttonSpacer} />
                )}

                <TouchableOpacity
                  style={[styles.compactButton, styles.darkButton]}
                  onPress={handleNext}
                  disabled={isAnimating}
                >
                  <Text style={styles.darkButtonText}>
                    {currentStep < tourSteps.length - 1 ? 'Next' : 'Show me!'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },

  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxWidth: Math.min(screenWidth - 40, 450),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden' // Ensure images stay within rounded corners
  },

  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f9fa' // Fallback background
  },

  contentSection: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15
  },

  title: {
    ...TextStyles.title,
    fontSize: 20,
    textAlign: 'left',
    marginBottom: 12
  },

  subtitle: {
    ...TextStyles.body,
    textAlign: 'left',
    marginBottom: 24
  },

  buttonGroup: {
    marginTop: 20
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },

  // Compact buttons sized to content with standard styling
  compactButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },

  darkButton: ComponentStyles.buttonDark,

  lightButton: ComponentStyles.buttonLight,

  darkButtonText: TextStyles.buttonDark,

  lightButtonText: TextStyles.buttonLight,

  buttonSpacer: {
    flex: 1 // Takes up space when back button is hidden
  }
})
