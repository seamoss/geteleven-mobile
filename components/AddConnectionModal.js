import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-native-qrcode-svg'
import { X, Copy, ShareIcon, Download, ExternalLink } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'
import ViewShot from 'react-native-view-shot'

import { TextStyles, Colors } from '../styles/fonts'
import ElevenAvatar from './ElevenAvatar'
import { replaceDomain, formatConnectionName } from '../lib/util'

export default function AddConnectionModal ({ visible, onClose, user }) {
  const [shareUrl, setShareUrl] = useState('')
  const [copyConfirm, setCopyConfirm] = useState(false)
  const viewShotRef = useRef()

  useEffect(() => {
    const generateShareUrl = () => {
      if (user) {
        if (user.manager && user.username) {
          // For managers with usernames, use the short URL format
          setShareUrl(
            `${process.env.EXPO_PUBLIC_SHORT_URL || 'https://eleven.direct'}/@${
              user.username
            }`
          )
        } else {
          // For regular users, use the send URL format
          setShareUrl(
            `${
              process.env.EXPO_PUBLIC_APP_URL || 'https://app.geteleven.com'
            }/send/${user.id}`
          )
        }
      }
    }

    if (visible && user) {
      generateShareUrl()
    }
  }, [visible, user])

  const copyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(shareUrl)
      setCopyConfirm(true)
      setTimeout(() => {
        setCopyConfirm(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      Alert.alert('Error', 'Failed to copy to clipboard')
    }
  }

  const shareQRCode = async () => {
    try {
      const result = await Share.share({
        title: 'Connect with me on Eleven!',
        message: `Join me on Eleven to level up our 1:1s and keep focus on what really matters. ${shareUrl}`,
        url: shareUrl
      })
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const saveQRCode = async () => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photos permission to save the QR code.'
        )
        return
      }

      // Capture the QR code using ViewShot
      if (viewShotRef.current) {
        try {
          const uri = await viewShotRef.current.capture()
          await saveImageToGallery(uri)
        } catch (captureError) {
          console.error('Error capturing QR code:', captureError)
          Alert.alert(
            'Error',
            'Failed to capture QR code image. Please try again.'
          )
        }
      } else {
        Alert.alert(
          'Error',
          'QR code not ready. Please wait a moment and try again.'
        )
      }
    } catch (error) {
      console.error('Error saving QR code:', error)
      Alert.alert('Error', 'Failed to save QR code')
    }
  }

  const saveImageToGallery = async uri => {
    try {
      // Save directly to media library from the captured URI
      const asset = await MediaLibrary.createAssetAsync(uri)

      // Try to create/add to the Eleven album
      try {
        await MediaLibrary.createAlbumAsync('Eleven', asset, false)
      } catch (albumError) {
        // If album creation fails, the image is still saved to the general library
        console.log(
          'Album creation failed, but image saved to library:',
          albumError
        )
      }

      Alert.alert('Success', 'QR code saved to your photo library!')
    } catch (error) {
      console.error('Error saving image to gallery:', error)
      Alert.alert('Error', 'Failed to save QR code to photo library')
    }
  }

  const openInBrowser = () => {
    Linking.openURL(shareUrl)
  }

  if (!user) {
    return null
  }

  const formatUserName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`.trim()
    }
    return user.first_name || 'Unknown User'
  }

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Invite someone</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.foreground} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Share this QR code to connect with others.
        </Text>

        {/* QR Code Section */}
        <View style={styles.qrContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{
              fileName: 'eleven-qr-code',
              format: 'png',
              quality: 0.9
            }}
          >
            <View style={styles.qrCard}>
              <View style={styles.qrCodeWrapper}>
                {shareUrl ? (
                  <QRCode
                    value={shareUrl}
                    size={200}
                    color={Colors.foreground}
                    backgroundColor='white'
                    logo={require('../assets/icon.png')}
                    logoSize={50}
                    logoBackgroundColor='transparent'
                    logoMargin={4}
                    logoBorderRadius={0}
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.loadingText}>
                      Generating QR code...
                    </Text>
                  </View>
                )}
              </View>

              {/* User Info */}
              <View style={styles.userInfo}>
                <View style={styles.userAvatarContainer}>
                  <ElevenAvatar
                    src={
                      user.avatar_url
                        ? replaceDomain(
                            user.avatar_url,
                            'ik.imagekit.io/geteleven/tr:h-200'
                          )
                        : null
                    }
                    width={55}
                    height={64}
                    borderColor='#f1f5f9'
                    borderWidth={2}
                    borderRadius={4}
                    showNameLabel={false}
                    newMessages={false}
                  />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{formatUserName()}</Text>
                  <Text style={styles.userSubtitle}>
                    Connect with me on Eleven.
                  </Text>
                </View>
              </View>
            </View>
          </ViewShot>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              !shareUrl && styles.actionButtonDisabled
            ]}
            onPress={shareUrl ? copyToClipboard : null}
            disabled={!shareUrl}
          >
            <Copy
              size={20}
              color={shareUrl ? Colors.foreground : Colors.copy}
              strokeWidth={1.5}
            />
            {/* <Text
              style={[
                styles.actionText,
                copyConfirm && styles.actionTextSuccess,
                !shareUrl && styles.actionTextDisabled
              ]}
            >
              {copyConfirm ? '✓' : 'Copy'}
            </Text> */}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              !shareUrl && styles.actionButtonDisabled
            ]}
            onPress={shareUrl ? shareQRCode : null}
            disabled={!shareUrl}
          >
            <ShareIcon
              size={20}
              color={shareUrl ? Colors.foreground : Colors.copy}
              strokeWidth={1.5}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              !shareUrl && styles.actionButtonDisabled
            ]}
            onPress={shareUrl ? saveQRCode : null}
            disabled={!shareUrl}
          >
            <Download
              size={20}
              color={shareUrl ? Colors.foreground : Colors.copy}
              strokeWidth={1.5}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 0
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)'
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground
  },
  closeButton: {
    padding: 8
  },
  subtitle: {
    ...TextStyles.body,
    color: Colors.copy,
    textAlign: 'center',
    marginTop: 20
  },
  qrContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0
  },
  qrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(2, 6, 23, 0.06)',
    width: 250
  },
  qrCodeWrapper: {
    padding: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 5
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15
  },
  userAvatarContainer: {
    marginRight: 12
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground,
    marginBottom: 2
  },
  userSubtitle: {
    fontSize: 12,
    color: Colors.copy,
    fontWeight: '400'
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 50
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderRadius: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)'
  },
  actionText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.copy,
    marginTop: 8,
    textAlign: 'center'
  },
  actionTextSuccess: {
    color: '#4ade80'
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12
  },
  loadingText: {
    fontSize: 14,
    color: Colors.copy,
    textAlign: 'center'
  },
  actionButtonDisabled: {
    opacity: 0.5
  },
  actionTextDisabled: {
    opacity: 0.5
  }
})
