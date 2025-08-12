import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { authCheck } from '../lib/auth'
import { replaceDomain, formatAvatarName } from '../lib/util'
import useTransition from '../hooks/transition'
import User from '../hooks/user'
import ElevenAvatar from '../components/ElevenAvatar'
import Loader from '../components/Loader'

// Import the logo
import LogoSvg from '../assets/images/svg/logo.svg'

export default function OnboardingPreviewScreen ({ navigation, route }) {
  const { navigate, loading, setLoading } = useTransition()
  const [isFinishing, setIsFinishing] = useState(false)
  const [meData, setMeData] = useState(null)

  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me } = User(authToken)

  // Get profile data from previous screens
  const { firstName, lastName, avatarUrl } = route.params || {}

  useEffect(() => {
    setLoading(true)
  }, [])

  useEffect(() => {
    if (checkingAuth) return

    if (!isAuthenticated) {
      navigate('/signin')
    }
  }, [isAuthenticated, authToken, checkingAuth, navigate])

  useEffect(() => {
    if (!isAuthenticated) return

    async function fetchData () {
      try {
        const { data } = await me()
        setMeData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching user data:', error)
        navigate('Home')
      }
    }

    fetchData()
  }, [authToken, isAuthenticated])

  const handleFinishOnboarding = async () => {
    setIsFinishing(true)

    try {
      // Add any final onboarding completion logic here
      console.log('Onboarding completed for user:', meData)

      // Navigate to connections screen with tour modal
      navigation.navigate('Connections', { showTour: true })
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsFinishing(false)
    }
  }

  const handleGoBack = () => {
    navigation.goBack()
  }

  if (checkingAuth || loading) {
    return <Loader />
  }

  // Use the most current user data, falling back to passed params
  const displayName =
    meData?.first_name && meData?.last_name
      ? `${meData.first_name} ${meData.last_name}`
      : `${firstName || ''} ${lastName || ''}`.trim()

  // Format name for avatar component (First L. format)
  const avatarName =
    meData?.first_name || meData?.last_name
      ? formatAvatarName(meData.first_name, meData.last_name)
      : formatAvatarName(firstName, lastName)

  const displayAvatarUrl = meData?.avatar_url
    ? replaceDomain(
        meData.avatar_url,
        'ik.imagekit.io/geteleven/tr:h-300,w-300'
      )
    : avatarUrl

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Header */}
      <View style={styles.logoContainer}>
        <LogoSvg width={80} height={40} />
      </View>

      <View style={styles.content}>
        {/* Profile Preview Section */}
        <View style={styles.previewContainer}>
          <ElevenAvatar
            src={displayAvatarUrl}
            size={150}
            borderColor='#f1f5f9'
            borderWidth={2}
            showNameLabel={true}
            name={avatarName}
            borderRadius={15}
          />

          {displayName && <Text style={styles.userName}>{displayName}</Text>}

          {meData?.username && (
            <Text style={styles.userHandle}>@{meData.username}</Text>
          )}
        </View>

        <Text style={styles.title}>Looking good!</Text>
        <Text style={styles.subtitle}>
          Your profile is all set up. You're ready to start connecting with
          others and sharing voice messages.
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.darkButton,
              isFinishing && styles.disabledButton
            ]}
            onPress={handleFinishOnboarding}
            disabled={isFinishing}
          >
            {isFinishing ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.darkButtonText}>Start connecting!</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    ...ComponentStyles.container,
    backgroundColor: '#ffffff'
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40
  },
  content: {
    ...ComponentStyles.content,
    paddingTop: 0
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50
  },
  userName: {
    ...TextStyles.heading,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4
  },
  userHandle: {
    ...TextStyles.body,
    textAlign: 'center',
    color: Colors.copy,
    opacity: 0.7
  },
  title: {
    ...TextStyles.title,
    textAlign: 'left',
    marginBottom: 10
  },
  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    marginBottom: 60
  },
  buttonGroup: {
    ...ComponentStyles.buttonGroup,
    alignItems: 'center'
    // gap: 5
  },
  button: ComponentStyles.button,
  darkButton: ComponentStyles.buttonDark,
  lightButton: ComponentStyles.buttonLight,
  darkButtonText: TextStyles.buttonDark,
  lightButtonText: TextStyles.buttonLight,
  disabledButton: {
    backgroundColor: Colors.border,
    opacity: 0.6
  }
})
