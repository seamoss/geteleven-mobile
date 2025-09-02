import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import { X, Square, RotateCcw, Send, Play, Pause } from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { TextStyles, Colors } from '../styles/fonts'
import ElevenAvatar from './ElevenAvatar'
import audioRoutingManager from '../utils/audioRoutingManager'
import { formatConnectionName } from '../lib/util'
import AudioBubbleSvg from '../assets/images/svg/audio-bubble.svg'
import { getResponsiveSpacing } from '../utils/responsive'
import User from '../hooks/user'

export default function VoiceRecordingModal ({
  visible,
  onClose,
  onSend,
  authToken,
  connectionId,
  connection,
  isNewUser,
  navigation
}) {
  const [recording, setRecording] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [hasRecording, setHasRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isRecordingUnloaded, setIsRecordingUnloaded] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSound, setPlaybackSound] = useState(null)
  const [playbackPosition, setPlaybackPosition] = useState(0)
  const [modalReady, setModalReady] = useState(false)
  const [meData, setMeData] = useState(null)
  const [statusMessageIndex, setStatusMessageIndex] = useState(0)

  // User hook for getting current user data
  const { me } = User(authToken)

  // Status messages for the sending overlay
  const statusMessages = [
    'Encrypting message...',
    'Securing connection...',
    'Verifying recipient...',
    'Transmitting audio...',
    'Almost there...',
    'Finalizing delivery...'
  ]

  // Timer ref for recording duration
  const timerRef = useRef(null)
  const playbackRef = useRef(false) // Prevent race conditions
  const statusMessageTimerRef = useRef(null)

  // Fade animation for overlay
  const fadeAnim = useRef(new Animated.Value(0)).current
  // Slide animation for modal content
  const slideAnim = useRef(new Animated.Value(300)).current // Start off-screen

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Fetch user data when modal opens
  useEffect(() => {
    if (visible && authToken) {
      me().then(response => {
        if (response?.data) {
          setMeData(response.data)
        }
      }).catch(err => {
        console.error('Failed to fetch user data:', err)
      })
    }
  }, [visible, authToken])

  // Cycle through status messages when sending
  useEffect(() => {
    if (isSending) {
      setStatusMessageIndex(0)
      statusMessageTimerRef.current = setInterval(() => {
        setStatusMessageIndex(prev => (prev + 1) % statusMessages.length)
      }, 1500)
    } else {
      if (statusMessageTimerRef.current) {
        clearInterval(statusMessageTimerRef.current)
        statusMessageTimerRef.current = null
      }
      setStatusMessageIndex(0)
    }

    return () => {
      if (statusMessageTimerRef.current) {
        clearInterval(statusMessageTimerRef.current)
      }
    }
  }, [isSending])

  // Start recording when modal opens with sequenced animations
  useEffect(() => {
    if (visible) {
      // Show the modal and start animations
      setModalReady(true)

      // Longer delay to ensure SafeAreaView layout is calculated before animating
      setTimeout(() => {
        // First fade in the overlay, then slide up the modal
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ]).start(() => {
          // Start recording after animation completes
          if (!isRecording && !hasRecording) {
            startRecording()
          }
        })
      }, 150)
    } else if (modalReady) {
      // Sequence the closing animations: first slide down, then fade out
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true
        })
      ]).start(() => {
        // Hide modal and reset values after closing
        setModalReady(false)
        slideAnim.setValue(300)
        fadeAnim.setValue(0)
      })
      resetRecording()
    }
  }, [visible])

  const startRecording = async () => {
    console.log('Starting recording...')
    try {
      // Request permissions
      const permissionResponse = await Audio.requestPermissionsAsync()
      console.log('Permission status:', permissionResponse.status)
      if (permissionResponse.status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please grant microphone permission to record voice messages.'
        )
        return
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      })
      console.log('Audio mode set')

      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000
        }
      })

      setRecording(recording)
      setIsRecording(true)
      setRecordingDuration(0)
      setIsRecordingUnloaded(false)
      console.log('Recording started successfully')
    } catch (err) {
      console.error('Failed to start recording:', err)
      Alert.alert('Error', 'Failed to start recording. Please try again.')
    }
  }

  const stopRecording = async () => {
    if (!recording || isRecordingUnloaded) return

    try {
      setIsRecording(false)
      await recording.stopAndUnloadAsync()
      setIsRecordingUnloaded(true)

      const uri = recording.getURI()

      setHasRecording(true)
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording.')
    }
  }

  const resetRecording = async () => {
    // Stop playback if it's running
    if (playbackSound) {
      try {
        await playbackSound.unloadAsync()
      } catch (err) {
        // Silently handle error
      }
    }

    if (recording && !isRecordingUnloaded) {
      try {
        await recording.stopAndUnloadAsync()
      } catch (err) {
        // Silently handle error
      }
    }

    setRecording(null)
    setIsRecording(false)
    setRecordingDuration(0)
    setHasRecording(false)
    setIsSending(false)
    setIsRecordingUnloaded(false)
    setIsPlaying(false)
    setPlaybackSound(null)
    setPlaybackPosition(0)
  }

  const simulateUploadProgress = () => {
    return new Promise(resolve => {
      setUploadProgress(0)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15 + 5 // Random increment between 5-20%

          if (newProgress >= 100) {
            clearInterval(progressInterval)
            setUploadProgress(100)
            setTimeout(resolve, 200) // Small delay to show 100%
            return 100
          }

          return newProgress
        })
      }, 150) // Update every 150ms for smooth animation
    })
  }

  const handleSend = async () => {
    if (!recording || !hasRecording) return

    setIsSending(true)

    try {
      const uri = recording.getURI()

      // Start upload progress simulation
      const uploadPromise = simulateUploadProgress()

      // Call the onSend callback with recording data
      const sendPromise = onSend({
        uri,
        duration: recordingDuration * 1000 // Convert to milliseconds
      })

      // Wait for both upload progress and actual send to complete
      await Promise.all([uploadPromise, sendPromise])

      // Add delay to let users see the sending animation complete
      await new Promise(resolve => setTimeout(resolve, 1300))
      
      // If this is a new user from deep link, redirect to onboarding after successful send
      if (isNewUser) {
        // Clear the flag
        await AsyncStorage.removeItem('needsOnboarding')
        // Close modal first
        onClose()
        resetRecording()
        // Small delay to ensure modal closes smoothly before navigation
        setTimeout(() => {
          if (navigation) {
            navigation('OnboardingWelcome')
          }
        }, 300)
      } else {
        // Close modal and reset for existing users
        onClose()
        resetRecording()
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send voice message. Please try again.')
      setIsSending(false)
      setUploadProgress(0)
    }
  }

  const handlePlayback = async () => {
    if (!recording || !hasRecording || playbackRef.current) {
      return
    }

    playbackRef.current = true // Prevent concurrent playback operations

    try {
      // Configure audio routing before playback
      await audioRoutingManager.configureForPlayback()
      
      if (isPlaying) {
        // Pause playback
        if (playbackSound) {
          await playbackSound.pauseAsync()
        }
        setIsPlaying(false)
      } else {
        // Check if we need to restart from beginning
        const shouldRestart = playbackPosition >= recordingDuration

        if (!playbackSound || shouldRestart) {
          // Create new sound object from recording (or restart)
          if (playbackSound && shouldRestart) {
            await playbackSound.unloadAsync()
            setPlaybackSound(null)
            setPlaybackPosition(0)
          }

          const uri = recording.getURI()
          if (!uri) {
            throw new Error('Recording URI is null')
          }

          const { sound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: true },
            onPlaybackStatusUpdate
          )
          setPlaybackSound(sound)
        } else {
          // Resume existing sound from current position
          await playbackSound.playAsync()
        }
        setIsPlaying(true)
      }
    } catch (err) {
      // Reset state on error
      setIsPlaying(false)
      if (playbackSound) {
        try {
          await playbackSound.unloadAsync()
        } catch (cleanupErr) {
          // Silently handle error
        }
        setPlaybackSound(null)
      }
      Alert.alert(
        'Error',
        'Failed playing recording. Please try restarting the recording.'
      )
    } finally {
      playbackRef.current = false // Always release the lock
    }
  }

  const onPlaybackStatusUpdate = status => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        // Playback finished, reset to beginning
        setIsPlaying(false)
        setPlaybackPosition(0)
      } else if (status.positionMillis !== undefined) {
        // Update playback position for timer display
        setPlaybackPosition(Math.floor(status.positionMillis / 1000))
      }
    }
  }

  const handleClose = () => {
    // If user has a recording that hasn't been sent, confirm before closing
    if (hasRecording && !isSending) {
      Alert.alert(
        'Discard Recording?',
        "You have a recorded message that hasn't been sent. Are you sure you want to discard it?",
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetRecording()
              onClose()
            }
          }
        ]
      )
    } else {
      // No recording or already sending, close immediately
      resetRecording()
      onClose()
    }
  }

  // Get current display time (playback position or recording duration)
  const getCurrentDisplayTime = () => {
    if (isPlaying) {
      return playbackPosition
    }
    return recordingDuration
  }

  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Modal
      visible={modalReady}
      animationType='none'
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim
          }
        ]}
      >
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <SafeAreaView 
            style={styles.container}
            onLayout={() => {
              // Ensure layout is complete before any state changes
            }}
          >
            {/* Close button positioned at top right */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSending}
            >
              <X size={24} color={Colors.foreground} />
            </TouchableOpacity>

            <View style={styles.content}>
              <View style={styles.recordingArea}>
                {/* Duration Display */}
                <Text
                  style={[styles.duration, isPlaying && styles.durationPlaying]}
                >
                  {formatDuration(getCurrentDisplayTime())}
                </Text>

                <View style={styles.audioBubbleContainer}>
                  <AudioBubbleSvg width={50} height={50} />
                </View>
              </View>
            </View>

            {/* Bottom Controls - Always visible to prevent bouncing */}
            <View style={styles.actionsContainer}>
              {!hasRecording ? (
                // Recording control - centered
                <View style={styles.recordingControlWrapper}>
                  <TouchableOpacity
                    style={[styles.iconButton, styles.stopButton]}
                    onPress={stopRecording}
                    disabled={!isRecording}
                  >
                    <Square size={28} color='#fff' fill='#fff' />
                  </TouchableOpacity>
                </View>
              ) : (
                // Playback controls
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      resetRecording()
                      setTimeout(startRecording, 100) // Restart recording after reset
                    }}
                    disabled={isSending}
                  >
                    <RotateCcw
                      size={20}
                      color={Colors.foreground}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handlePlayback}
                    disabled={isSending}
                  >
                    {isPlaying ? (
                      <Pause size={20} color='#22c55e' strokeWidth={1.5} />
                    ) : (
                      <Play
                        size={20}
                        color={Colors.foreground}
                        strokeWidth={1.5}
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSend}
                    disabled={isSending}
                  >
                    <Send
                      size={20}
                      color={Colors.foreground}
                      strokeWidth={1.5}
                    />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Upload Progress Overlay */}
            {isSending && (
              <View style={styles.uploadOverlay}>
                <View style={styles.uploadModal}>
                  <View style={styles.uploadContent}>
                    {/* Avatars Row */}
                    <View style={styles.avatarsRow}>
                      {/* FROM Avatar */}
                      <ElevenAvatar
                        src={meData?.avatar_url}
                        width={60}
                        height={60}
                        borderRadius={30}
                        borderWidth={2}
                        borderColor={Colors.border}
                        showNameLabel={false}
                      />
                      
                      {/* Spinning Progress Indicator */}
                      <ActivityIndicator 
                        size="small" 
                        color={Colors.foreground}
                        style={styles.spinner}
                      />
                      
                      {/* TO Avatar */}
                      <ElevenAvatar
                        src={connection?.avatar_url}
                        width={60}
                        height={60}
                        borderRadius={30}
                        borderWidth={2}
                        borderColor={Colors.border}
                        showNameLabel={false}
                      />
                    </View>

                    {/* Text Below Avatars */}
                    <Text style={styles.uploadTitle}>
                      Sending to {connection ? formatConnectionName(connection) : 'connection'}
                    </Text>
                    
                    {/* Status Message */}
                    <Text style={styles.statusMessage}>
                      {statusMessages[statusMessageIndex]}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Semi-transparent background
    justifyContent: 'flex-end'
  },
  dismissArea: {
    flex: 1 // Tappable area to dismiss modal
  },
  modalContent: {
    height: '40%', // Half the screen height
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    // Add shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    // Add elevation for Android
    elevation: 10
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    padding: 8
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50
  },
  recordingArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  duration: {
    fontFamily: 'Poppins',
    fontSize: 64,
    fontWeight: '500',
    color: Colors.foreground,
    marginTop: 20
  },
  audioBubbleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  statusText: {
    ...TextStyles.body,
    color: Colors.foreground
  },
  recordingControlWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  stopButton: {
    backgroundColor: '#ef4444'
  },
  postRecordingControls: {
    flexDirection: 'row',
    gap: 22
  },
  resetButton: {
    backgroundColor: 'rgba(2, 6, 23, 0.05)'
  },
  playButton: {
    backgroundColor: 'rgba(2, 6, 23, 0.05)'
  },
  sendButton: {
    backgroundColor: Colors.foreground
  },
  // Upload Progress Overlay Styles
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  uploadModal: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 32,
    marginHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8
  },
  uploadContent: {
    alignItems: 'center'
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  spinner: {
    marginHorizontal: 20
  },
  uploadTitle: {
    ...TextStyles.h3,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.foreground,
    marginBottom: 8,
    textAlign: 'center'
  },
  statusMessage: {
    ...TextStyles.body,
    fontSize: 14,
    color: Colors.placeholder,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  // Bottom Action Toolbar Styles (matching AddConnectionModal)
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: 30,
    marginBottom: 0
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
  durationPlaying: {
    color: '#22c55e'
  },
  actionTextPlaying: {
    color: '#22c55e'
  }
})
