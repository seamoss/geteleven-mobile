import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Animated
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Audio } from 'expo-av'
import { X, Square, RotateCcw, Send, Play, Pause } from 'lucide-react-native'
import { TextStyles, Colors } from '../styles/fonts'
import ElevenAvatar from './ElevenAvatar'
import { formatConnectionName } from '../lib/util'

export default function VoiceRecordingModal ({
  visible,
  onClose,
  onSend,
  authToken,
  connectionId,
  connection
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

  // Animation for recording dot
  const pulseAnim = useRef(new Animated.Value(1)).current
  const timerRef = useRef(null)
  const playbackRef = useRef(false) // Prevent race conditions

  // Start pulsing animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ]).start(() => {
          if (isRecording) pulse()
        })
      }
      pulse()
    } else {
      pulseAnim.setValue(1)
    }
  }, [isRecording])

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

  // Start recording when modal opens
  useEffect(() => {
    if (visible && !isRecording && !hasRecording) {
      startRecording()
    }
  }, [visible])

  // Clean up when modal closes
  useEffect(() => {
    if (!visible) {
      resetRecording()
    }
  }, [visible])

  const startRecording = async () => {
    try {
      // Request permissions
      const permissionResponse = await Audio.requestPermissionsAsync()
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
    } catch (err) {
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

      // Close modal and reset
      onClose()
      resetRecording()
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
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Record message</Text>
            {connection && (
              <View style={styles.connectionInfo}>
                <ElevenAvatar
                  src={connection.avatar_url}
                  name={formatConnectionName(connection)}
                  showNameLabel={false}
                  width={32}
                  height={32}
                  borderRadius={16}
                  borderWidth={1}
                />
                <Text style={styles.connectionName}>
                  {formatConnectionName(connection)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={isSending}
          >
            <X size={24} color={Colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.recordingArea}>
            {/* Recording Visualizer */}
            <View style={styles.visualizer}>
              <Animated.View
                style={[
                  styles.recordingDot,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isRecording ? '#ef4444' : '#94a3b8'
                  }
                ]}
              />
            </View>

            {/* Duration Display */}
            <Text
              style={[styles.duration, isPlaying && styles.durationPlaying]}
            >
              {formatDuration(getCurrentDisplayTime())}
            </Text>

            {/* Status Text */}
            <Text style={styles.statusText}>
              {isRecording
                ? 'Recording...'
                : hasRecording
                ? ''
                : 'Ready to record'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!hasRecording ? (
              // Recording controls
              <TouchableOpacity
                style={[styles.iconButton, styles.stopButton]}
                onPress={stopRecording}
                disabled={!isRecording}
              >
                <Square size={28} color='#fff' fill='#fff' />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Bottom Action Toolbar - Only show when recording is complete */}
        {hasRecording && !isSending && (
          <View style={styles.actionsContainer}>
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
                <Play size={20} color={Colors.foreground} strokeWidth={1.5} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSend}
              disabled={isSending}
            >
              <Send size={20} color={Colors.foreground} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        )}

        {/* Upload Progress Overlay */}
        {isSending && (
          <View style={styles.uploadOverlay}>
            <View style={styles.uploadModal}>
              <View style={styles.uploadContent}>
                <Text style={styles.uploadTitle}>Sending message...</Text>
                <Text style={styles.uploadSubtitle}>
                  to{' '}
                  {connection ? formatConnectionName(connection) : 'connection'}
                </Text>

                {/* Progress Bar Container */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${uploadProgress}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(uploadProgress)}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(2, 6, 23, 0.05)'
  },
  closeButton: {
    padding: 4
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    ...TextStyles.h3,
    color: Colors.foreground,
    marginBottom: 8
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  connectionName: {
    ...TextStyles.caption,
    color: Colors.foreground,
    fontSize: 14
  },
  placeholder: {
    width: 32 // Same width as close button for centering
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  recordingArea: {
    alignItems: 'center',
    marginBottom: 60
  },
  visualizer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(2, 6, 23, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24
  },
  recordingDot: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  duration: {
    ...TextStyles.h2,
    color: Colors.foreground,
    marginBottom: 8
  },
  statusText: {
    ...TextStyles.body,
    color: Colors.foreground
  },
  controls: {
    width: '100%',
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
    gap: 20
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
  uploadTitle: {
    ...TextStyles.h3,
    color: Colors.foreground,
    marginBottom: 8,
    textAlign: 'center'
  },
  uploadSubtitle: {
    ...TextStyles.foreground,
    color: Colors.placeholder,
    marginBottom: 32,
    textAlign: 'center'
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(2, 6, 23, 0.1)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.foreground,
    borderRadius: 2,
    minWidth: 8 // Ensure some width is always visible
  },
  progressText: {
    ...TextStyles.caption,
    color: Colors.foreground,
    fontSize: 16,
    fontWeight: '600'
  },
  // Bottom Action Toolbar Styles (matching AddConnectionModal)
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10
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
