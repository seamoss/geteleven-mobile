import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { authCheck } from '../lib/auth'
import { replaceDomain, formatAvatarName } from '../lib/util'
import { TextStyles, Colors, ComponentStyles } from '../styles/fonts'
import useTransition from '../hooks/transition'
import User from '../hooks/user'
import ImageUpload from '../components/ImageUpload'
import Loader from '../components/Loader'

export default function SettingsAvatarScreen () {
  const { navigate, loading, setLoading } = useTransition()
  const [meData, setMeData] = useState(null)
  const [readyToSave, setReadyToSave] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me } = User(authToken)

  // Create a ref for the ImageUpload component
  const imageUploadRef = React.useRef()

  useEffect(() => {
    setLoading(true)
  }, [])

  useEffect(() => {
    if (checkingAuth) return

    if (!isAuthenticated) {
      navigate('Signin')
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
        Alert.alert('Error', 'Failed to load user data')
        setLoading(false)
      }
    }

    fetchData()
  }, [authToken, isAuthenticated])

  const handleImageSelected = imageAsset => {
    console.log('🖼️ New avatar selected:', imageAsset.uri)
    setReadyToSave(true)
  }

  const handleImageUploaded = uploadData => {
    console.log('✅ Avatar updated successfully:', uploadData.url)
    setReadyToSave(false)
    navigate('Settings')
  }

  const handleSaveAvatar = async () => {
    if (!readyToSave) {
      Alert.alert('No Changes', 'Please select a new avatar to save.')
      return
    }

    setIsSaving(true)

    // Trigger the upload via the ImageUpload component
    const uploadRef = imageUploadRef.current
    if (uploadRef && uploadRef.uploadImage) {
      const success = await uploadRef.uploadImage()
      if (success) {
        // Upload successful, handled by onImageUploaded callback
      } else {
        // Upload failed, error already shown
      }
    }

    setIsSaving(false)
  }

  if (checkingAuth || loading) {
    return <Loader />
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your avatar</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigate('Settings')}
        >
          <X size={20} color={Colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Description */}
        <Text style={styles.description}>
          Let's see that beautiful face of yours! This will let your connections
          find you easier.
        </Text>

        {/* Avatar Upload Section */}
        <View style={styles.avatarSection}>
          <ImageUpload
            ref={imageUploadRef}
            currentImageUrl={
              meData?.avatar_url
                ? replaceDomain(
                    meData.avatar_url,
                    'ik.imagekit.io/geteleven/tr:h-300,w-300'
                  )
                : 'https://api.dicebear.com/9.x/thumbs/svg?shapeColor=94a3b8&backgroundColor=f8fafc&radius=50&eyes=variant8W16&mouth=variant2&scale=80&randomizeIds=true'
            }
            size={250}
            borderColor='#f1f5f9'
            borderWidth={2}
            showNameLabel={true}
            name={formatAvatarName(meData?.first_name, meData?.last_name)}
            authToken={authToken}
            onImageSelected={handleImageSelected}
            onImageUploaded={handleImageUploaded}
            showChangeButton={true}
          />
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!readyToSave || isSaving) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveAvatar}
          disabled={!readyToSave || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color='#fff' />
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                (!readyToSave || isSaving) && styles.saveButtonTextDisabled
              ]}
            >
              {readyToSave ? 'Save' : 'Tap your avatar to select a new one'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: ComponentStyles.container,
  content: ComponentStyles.content,

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
    fontFamily: 'Poppins_500Medium'
  },
  closeButton: {
    padding: 8
  },
  description: {
    ...TextStyles.body,
    textAlign: 'left',
    marginBottom: 50,
    color: Colors.copy
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60
  },
  buttonGroup: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 20,
    paddingHorizontal: 15
  },
  saveButton: {
    backgroundColor: Colors.foreground,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 5
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border
  },
  saveButtonText: {
    ...TextStyles.buttonDark
  },
  saveButtonTextDisabled: {
    color: Colors.placeholder
  }
})
