import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import ElevenAvatar from './ElevenAvatar'
import api from '../lib/api'
import { Colors, TextStyles } from '../styles/fonts'

const ImageUpload = forwardRef(
  (
    {
      currentImageUrl = null,
      size = 300,
      borderColor = '#f1f5f9',
      borderWidth = 2,
      showNameLabel = false,
      name = null,
      onImageSelected = () => {},
      onImageUploaded = () => {},
      authToken = null,
      disabled = false,
      showChangeButton = true
    },
    ref
  ) => {
    const [selectedImage, setSelectedImage] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState(false)

    // Determine which image to display
    const displayImageUrl = selectedImage?.uri || currentImageUrl

    const requestPermissions = async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } =
          await ImagePicker.requestCameraPermissionsAsync()
        const { status: mediaStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'We need camera and photo library permissions to let you upload a profile photo.',
            [{ text: 'OK' }]
          )
          return false
        }
      }
      return true
    }

    const pickImageFromCamera = async () => {
      const hasPermission = await requestPermissions()
      if (!hasPermission) return

      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8
        })

        if (!result.canceled && result.assets[0]) {
          const imageAsset = result.assets[0]
          setSelectedImage(imageAsset)
          setUploadError(false)
          onImageSelected(imageAsset)
          console.log('📸 Selected image from camera:', imageAsset.uri)
        }
      } catch (error) {
        console.error('❌ Camera error:', error)
        Alert.alert('Error', 'Failed to take photo. Please try again.')
      }
    }

    const pickImageFromGallery = async () => {
      const hasPermission = await requestPermissions()
      if (!hasPermission) return

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8
        })

        if (!result.canceled && result.assets[0]) {
          const imageAsset = result.assets[0]
          setSelectedImage(imageAsset)
          setUploadError(false)
          onImageSelected(imageAsset)
          console.log('🖼️ Selected image from gallery:', imageAsset.uri)
        }
      } catch (error) {
        console.error('❌ Gallery error:', error)
        Alert.alert('Error', 'Failed to select photo. Please try again.')
      }
    }

    const showImagePicker = () => {
      if (disabled) return

      Alert.alert(
        'Select Photo',
        "Choose how you'd like to add your profile photo:",
        [
          {
            text: 'Camera',
            onPress: pickImageFromCamera
          },
          {
            text: 'Photo Library',
            onPress: pickImageFromGallery
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      )
    }

    // Convert image to base64 for API upload
    const convertImageToBase64 = async imageUri => {
      try {
        const response = await fetch(imageUri)
        const blob = await response.blob()

        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result
            const base64 = dataUrl.split(',')[1]
            const mimeType = dataUrl.split(':')[1].split(';')[0]
            resolve({ base64, mimeType })
          }
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      } catch (error) {
        console.error('Error converting image to base64:', error)
        throw error
      }
    }

    const uploadImage = async () => {
      if (!selectedImage || !authToken) {
        Alert.alert('Error', 'No image selected or missing authentication.')
        return false
      }

      setIsUploading(true)
      setUploadError(false)

      try {
        console.log('🚀 Starting image upload process...')

        // Convert image to base64
        const { base64, mimeType } = await convertImageToBase64(
          selectedImage.uri
        )

        // Validate image type
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/heic',
          'image/webp'
        ]
        if (!allowedTypes.includes(mimeType)) {
          throw new Error(
            'Unsupported image format. Please select a JPEG, PNG, GIF, HEIC, or WebP image.'
          )
        }

        console.log('📤 Uploading image to API...', {
          mimeType,
          size: base64.length
        })

        // Upload file to API
        const uploadResponse = await api(
          'post',
          '/files/upload',
          {
            file: base64,
            type: mimeType
          },
          authToken
        )

        if (uploadResponse.error || !uploadResponse.data?.url) {
          throw new Error(uploadResponse.error || 'Failed to upload image')
        }

        console.log('✅ Image uploaded successfully:', uploadResponse.data.url)

        // Update user profile with new avatar URL
        const profileResponse = await api(
          'put',
          '/users/me/profile',
          {
            avatarUrl: uploadResponse.data.url
          },
          authToken
        )

        if (profileResponse.error) {
          console.warn(
            'Failed to update profile, but image was uploaded:',
            profileResponse.error
          )
          // Still consider it a success since the image was uploaded
        }

        console.log('✅ Profile updated with new avatar')

        // Notify parent component
        onImageUploaded({
          url: uploadResponse.data.url,
          localUri: selectedImage.uri
        })

        return true
      } catch (error) {
        console.error('❌ Image upload failed:', error)
        setUploadError(true)
        Alert.alert(
          'Upload Failed',
          error.message || 'Failed to upload image. Please try again.'
        )
        return false
      } finally {
        setIsUploading(false)
      }
    }

    // Expose uploadImage method to parent via ref
    useImperativeHandle(ref, () => ({
      uploadImage
    }))

    const styles = StyleSheet.create({
      container: {
        alignItems: 'center',
        justifyContent: 'center'
      },
      avatarContainer: {
        position: 'relative'
      },
      disabled: {
        opacity: 0.6
      },
      uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 15, // Large number to ensure circular overlay
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8
      },
      uploadingText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600'
      },
      changePhotoButton: {
        backgroundColor: '#f8fafc',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 12
      },
      changePhotoText: {
        color: Colors.copy,
        fontSize: 14,
        fontWeight: '500'
      },
      errorContainer: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#fef2f2',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fecaca'
      },
      errorText: {
        color: '#dc2626',
        fontSize: 12,
        textAlign: 'center'
      }
    })

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.avatarContainer, disabled && styles.disabled]}
          onPress={showImagePicker}
          disabled={disabled || isUploading}
        >
          <ElevenAvatar
            src={displayImageUrl}
            size={size}
            borderColor='#f1f5f9'
            borderWidth={borderWidth}
            showNameLabel={showNameLabel}
            name={name}
            borderRadius={15}
          />

          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size='large' color='#ffffff' />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </TouchableOpacity>

        {uploadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Upload failed. Tap to try again.
            </Text>
          </View>
        )}
      </View>
    )
  }
)

export default ImageUpload
