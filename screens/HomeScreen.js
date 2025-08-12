'use client'

import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import useTransition from '../hooks/transition'
import { authCheck } from '../lib/auth'
import User from '../hooks/user'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { getResponsiveSpacing } from '../utils/responsive'
import LogoSvg from '../assets/images/svg/logo.svg'

const { width: screenWidth } = Dimensions.get('window')

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

  const images = [
    require('../assets/images/png/home-1.png'),
    require('../assets/images/png/home-2.png'),
    require('../assets/images/png/home-3.png'),
    require('../assets/images/png/home-4.png')
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LogoSvg width={100} height={40} />
        </View>

        {/* Image Row */}
        <View style={styles.imageRow}>
          {images.map((image, index) => (
            <View
              key={index}
              style={[
                styles.imageWrapper,
                index === 0 && styles.firstImage,
                index === 3 && styles.lastImage,
                (index === 0 || index === 2) && { marginTop: 15 },
                index !== 3 && { marginRight: 10 } // Add 10px spacing between images
              ]}
            >
              <Image
                source={image}
                style={[
                  styles.image,
                  index === 0 && {
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0
                  },
                  index === 3 && {
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0
                  }
                ]}
                resizeMode='cover'
              />
            </View>
          ))}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.headline}>
            an anti-distraction platform for better conversations, later.
          </Text>
          <Text style={styles.subtext}>
            Collect important thoughts and questions in between one-on-one
            conversations.
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigate('/signup')}
          >
            <Text style={styles.getStartedText}>Get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigate('/signin')}
          >
            <Text style={styles.signInText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },

  content: {
    flex: 1,
    paddingTop: 20
  },

  logoContainer: {
    paddingHorizontal: getResponsiveSpacing.horizontalPadding,
    marginBottom: 75
  },

  imageRow: {
    flexDirection: 'row',
    marginBottom: 75,
    paddingHorizontal: 0,
    overflow: 'hidden'
  },

  imageWrapper: {
    // Fixed height of 200px, width calculated to fit screen with 10px gaps
    width: (screenWidth - 10 * 3) / 4,
    height: 200, // Fixed 200px height
    borderRadius: 8,
    overflow: 'hidden'
  },

  firstImage: {
    marginLeft: 0, // Start from edge
    width: (screenWidth - 10 * 3) / 4,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  },

  lastImage: {
    marginRight: 0, // End at edge
    width: (screenWidth - 10 * 3) / 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  },

  image: {
    width: '100%',
    height: '100%'
  },

  mainContent: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding,
    marginBottom: 30
  },

  headline: {
    fontFamily: 'Poppins',
    fontSize: 23,
    fontWeight: '600',
    color: Colors.foreground,
    lineHeight: 36,
    marginBottom: 16
  },

  subtext: {
    ...TextStyles.body,
    fontSize: 16,
    color: Colors.copy,
    lineHeight: 24
  },

  bottomActions: {
    paddingHorizontal: getResponsiveSpacing.horizontalPadding,
    paddingBottom: 0
  },

  getStartedButton: {
    backgroundColor: Colors.foreground,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20
  },

  getStartedText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff'
  },

  signInButton: {
    alignItems: 'center',
    paddingVertical: 10
  },

  signInText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    color: Colors.foreground
  }
})
