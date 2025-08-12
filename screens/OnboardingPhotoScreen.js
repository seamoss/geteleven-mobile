import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { authCheck } from '../lib/auth'
import { replaceDomain } from '../lib/util'
import useTransition from '../hooks/transition'
import User from '../hooks/user'
import ImageUpload from '../components/ImageUpload'
import Loader from '../components/Loader'

// Import the logo
import LogoSvg from '../assets/images/svg/logo.svg'

export default function OnboardingPhotoScreen ({ navigation, route }) {
  const { navigate, loading, setLoading } = useTransition()
  const [imageSelected, setImageSelected] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [meData, setMeData] = useState(null)

  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me } = User(authToken)

  // Get profile data from previous screen
  const { firstName, lastName } = route.params || {}

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

  const handleImageSelected = imageAsset => {
    setImageSelected(true)
    console.log('Image selected for onboarding:', imageAsset.uri)
  }

  const handleImageUploaded = async uploadData => {
    console.log('Avatar uploaded successfully:', uploadData.url)
    // Navigate to the preview screen with profile data
    navigation.navigate('OnboardingPreview', {
      firstName,
      lastName,
      avatarUrl: uploadData.url
    })
  }

  const handleContinue = async () => {
    if (!imageSelected) {
      Alert.alert(
        'Photo Required',
        'Please select a profile photo to continue.'
      )
      return
    }

    // Trigger the upload via the ImageUpload component
    const uploadRef = imageUploadRef.current
    if (uploadRef && uploadRef.uploadImage) {
      const success = await uploadRef.uploadImage()
      if (!success) {
        // Upload failed, stay on this screen
        return
      }
    } else {
      // No image component reference, just continue
      navigate('Connections')
    }
  }

  // Create a ref for the ImageUpload component
  const imageUploadRef = React.useRef()

  if (checkingAuth || loading) {
    return <Loader />
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo Header */}
      <View style={styles.logoContainer}>
        <LogoSvg width={80} height={40} />
      </View>

      <View style={styles.content}>
        {/* Avatar Upload Section */}
        <View style={styles.avatarContainer}>
          <ImageUpload
            ref={imageUploadRef}
            currentImageUrl={
              meData?.avatar_url
                ? replaceDomain(
                    meData.avatar_url,
                    'ik.imagekit.io/geteleven/tr:h-300,w-300'
                  )
                : 'https://api.dicebear.com/9.x/thumbs/svg?shapeColor=94a3b8&backgroundColor=f8fafc&&eyes=variant8W16&mouth=variant2&scale=80&randomizeIds=true'
            }
            size={200}
            borderColor='#f1f5f9'
            borderWidth={2}
            showNameLabel={false}
            authToken={authToken}
            onImageSelected={handleImageSelected}
            onImageUploaded={handleImageUploaded}
            showChangeButton={false}
            borderRadius={15}
          />
        </View>

        <Text style={styles.title}>Upload an avatar.</Text>
        <Text
          style={{
            ...styles.subtitle,
            paddingHorizontal: 25
          }}
        >
          Choose an image that best represents you. Come on we know you have a
          folder full of them.
        </Text>

        <View style={styles.buttonGroup}>
          {/* Progress indicator placeholder - you can add OnboardingProgress component here */}
          <TouchableOpacity
            style={[
              styles.button,
              styles.darkButton,
              !imageSelected && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!imageSelected || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color='#fff' />
            ) : (
              <Text style={styles.darkButtonText}>Preview profile</Text>
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
  avatarContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 75
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
    alignItems: 'center',
    gap: 20
  },
  button: ComponentStyles.button,
  darkButton: ComponentStyles.buttonDark,
  darkButtonText: TextStyles.buttonDark,
  disabledButton: {
    backgroundColor: Colors.border,
    opacity: 0.6
  }
})
