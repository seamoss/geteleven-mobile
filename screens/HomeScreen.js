'use client'

import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import useTransition from '../hooks/transition'
import { authCheck } from '../lib/auth'
import User from '../hooks/user'
import Nav from '../components/Nav'
import HomeSvg from '../assets/images/svg/home.svg'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getImageSize, getResponsiveSpacing } from '../utils/responsive'

export default function HomeScreen () {
  const { navigate } = useTransition()

  const { isAuthenticated, authToken } = authCheck()
  const { me } = User(authToken)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/connections')
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    const getMe = async () => {
      if (!isAuthenticated) return

      try {
        const user = await me()
      } catch (err) {
        navigate('/signin')
      }
    }

    getMe()
  }, [authToken, isAuthenticated])

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
          <Nav />
          <View style={styles.imageContainer}>
            <HomeSvg width={imageSize} height={imageSize} color={Colors.copy} />
          </View>
          <Text style={styles.title}>
            Are you ready to crank your 1:1s to eleven?
          </Text>
        </ScrollView>

        {/* Fixed buttons at bottom */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.darkButton]}
            onPress={() => {
              navigate('/signup')
            }}
          >
            <Text style={styles.darkButtonText}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.lightButton]}
            onPress={() => {
              navigate('/signin')
            }}
          >
            <Text style={styles.lightButtonText}>Sign in</Text>
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
    paddingBottom: getResponsiveSpacing.elementSpacing // Add some padding at bottom for scroll
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
    marginBottom: getResponsiveSpacing.titleMarginBottom,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },

  buttonGroup: {
    ...ComponentStyles.buttonGroup
  },

  button: ComponentStyles.button,

  darkButton: ComponentStyles.buttonDark,

  lightButton: ComponentStyles.buttonLight,

  darkButtonText: TextStyles.buttonDark,

  lightButtonText: TextStyles.buttonLight
})
