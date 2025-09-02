import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { Play, Pause } from 'lucide-react-native'
import ElevenAvatar from './ElevenAvatar'
import { TextStyles, Colors } from '../styles/fonts'
import { usePlayback } from '../providers/PlaybackProvider'
import {
  loadAudioWithRetry,
  cleanupAudio,
  isValidAudioUrl
} from '../utils/audioUtils'
import audioRoutingManager from '../utils/audioRoutingManager'
import { api } from '../lib/api'

// Format time helper function
export function formatTime (seconds) {
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const formattedMins = String(mins).padStart(1, '0')
  const formattedSecs = String(secs).padStart(2, '0')

  return `${formattedMins}:${formattedSecs}`
}

const MessagePlayer = ({
  authToken,
  id,
  connectionId,
  fileUrl,
  direction,
  length,
  me,
  connection,
  onError
}) => {
  const {
    currentlyPlaying,
    handlePlaybackChange,
    registerPlayer,
    unregisterPlayer
  } = usePlayback()
  const [sound, setSound] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasError, setHasError] = useState(false)

  // Refs to prevent race conditions
  const isMountedRef = useRef(true)
  const loadingRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (sound) {
        cleanupAudio(sound).catch(() => {})
      }
    }
  }, [])

  // Initialize audio when component mounts
  useEffect(() => {
    if (isValidAudioUrl(fileUrl) && !loadingRef.current) {
      loadAudio()
    } else if (!isValidAudioUrl(fileUrl)) {
      setHasError(true)
      if (onError) {
        onError(id)
      }
    }
  }, [fileUrl])

  const loadAudio = async () => {
    // Prevent multiple simultaneous audio loads
    if (
      loadingRef.current ||
      !isMountedRef.current ||
      !isValidAudioUrl(fileUrl)
    ) {
      return null
    }

    loadingRef.current = true

    try {
      if (!isMountedRef.current) return null

      setIsLoading(true)
      setHasError(false)
      const audioSound = await loadAudioWithRetry(
        fileUrl,
        { shouldPlay: false },
        3
      )

      if (!isMountedRef.current) {
        await cleanupAudio(audioSound)
        return null
      }

      setSound(audioSound)

      // Set up status callback
      audioSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate)

      return audioSound
    } catch (error) {
      if (!isMountedRef.current) return null

      setHasError(true)
      // Notify parent component to remove this message from the feed
      if (onError) {
        onError(id)
      }
      return null
    } finally {
      loadingRef.current = false

      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const onPlaybackStatusUpdate = status => {
    // Only update if component is still mounted
    if (!isMountedRef.current) return

    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000)
      setDuration(status.durationMillis / 1000)
      setIsPlaying(status.isPlaying)

      // Handle when audio finishes - immediate reset
      if (status.didJustFinish) {
        resetToBeginning()
      }
    } else if (status.error) {
      if (isMountedRef.current) {
        setHasError(true)
        setIsLoading(false)
      }
    }
  }

  const handlePlay = async () => {
    try {
      // Configure audio routing before playback
      await audioRoutingManager.configureForPlayback()
      
      let currentSound = sound

      // If sound is null (after completion), reload the audio first
      if (!currentSound) {
        setIsLoading(true)

        try {
          // Get the sound object directly from loadAudio
          currentSound = await loadAudio()

          // Check if sound was successfully loaded
          if (!currentSound) {
            Alert.alert('Audio Error', 'Failed to load audio message')
            return
          }
        } finally {
          setIsLoading(false)
        }
      }

      // Always stop any other audio that might be playing and set this as current
      handlePlaybackChange(id)

      // Mark message as read
      try {
        await api(
          'get',
          `/connections/${connectionId}/messages/${id}/touch`,
          {},
          authToken
        )
      } catch (error) {
        // Silently fail
      }

      await currentSound.playAsync()
    } catch (error) {
      Alert.alert('Playback Error', 'Failed to play audio message')
      setIsLoading(false)
    }
  }

  const handlePause = async () => {
    if (!sound) return

    try {
      await sound.pauseAsync()
      handlePlaybackChange(null)
    } catch (error) {
      // Silently fail
    }
  }

  const stopPlayback = async () => {
    // Always reset the UI state, regardless of sound object existence
    setIsPlaying(false)
    setCurrentTime(0)

    // Clear global playing state if this message was playing
    if (currentlyPlaying === id) {
      handlePlaybackChange(null)
    }

    // Try to stop the sound if it exists
    if (sound) {
      try {
        await sound.pauseAsync()
        // Also reset position to beginning when stopping
        await sound.setPositionAsync(0)
      } catch (error) {
        // Silently fail
      }
    }
  }

  const resetToBeginning = () => {
    // When audio completes, it gets automatically cleaned up by the system
    // So we just reset the UI state and let the audio reload when needed
    setIsPlaying(false)
    setCurrentTime(0)
    handlePlaybackChange(null) // Clear global playing state

    // Clear the sound reference since it's no longer valid after completion
    setSound(null)
  }

  // Listen to global playback state changes
  useEffect(() => {
    // If another message is playing and it's not this one, stop this player
    if (currentlyPlaying && currentlyPlaying !== id && isPlaying) {
      stopPlayback()
    }
  }, [currentlyPlaying, id, isPlaying])

  // Register this player with the global playback provider
  useEffect(() => {
    if (registerPlayer) {
      registerPlayer(id, stopPlayback)
    }

    return () => {
      if (unregisterPlayer) {
        unregisterPlayer(id)
      }
      stopPlayback()
    }
  }, [id, registerPlayer, unregisterPlayer])

  const renderPlayButton = () => {
    if (isLoading) {
      return (
        <View style={styles.playButton}>
          <View style={styles.loadingIndicator} />
        </View>
      )
    }

    if (hasError) {
      return (
        <View style={[styles.playButton, styles.errorButton]}>
          <Text style={styles.errorText}>!</Text>
        </View>
      )
    }

    // Determine if this message is currently playing based on global state
    const isCurrentlyPlaying = currentlyPlaying === id && isPlaying

    return (
      <TouchableOpacity
        style={[styles.playButton, isLoading && styles.disabledButton]}
        onPress={isCurrentlyPlaying ? handlePause : handlePlay}
        disabled={isLoading}
      >
        {isCurrentlyPlaying ? (
          <Pause size={24} color='#ffffff' fill='#ffffff' />
        ) : (
          <Play
            size={24}
            color={sound ? '#ffffff' : '#94a3b8'}
            fill={sound ? '#ffffff' : '#94a3b8'}
          />
        )}
      </TouchableOpacity>
    )
  }

  const renderAvatar = () => {
    // 'to' messages are sent by me, 'from' messages are sent by connection
    const avatarData = direction === 'right' ? me : connection
    const borderRadius =
      direction === 'right' ? '0 15px 15px 0' : '15px 0 0 15px' // Right corners rounded for 'to', left corners for 'from'

    return (
      <View style={styles.avatarInBubble}>
        <ElevenAvatar
          src={avatarData?.avatar_url}
          width={60}
          height={80}
          size={80}
          borderColor='#ffffff'
          borderWidth={0}
          borderRadius={borderRadius}
          showNameLabel={false}
        />
      </View>
    )
  }

  const renderProgressBar = () => {
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.timeText}>
          {formatTime(currentTime)} / {formatTime(duration || length / 1000)}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          direction === 'left' ? styles.bubbleRight : styles.bubbleLeft
        ]}
      >
        {direction === 'right' && renderAvatar()}

        <View style={styles.audioControls}>
          {renderPlayButton()}
          {renderProgressBar()}
        </View>

        {direction === 'left' && renderAvatar()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    paddingHorizontal: 15 // Margin from screen edges
  },
  bubble: {
    width: '95%',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 0, // Remove padding to make avatar flush
    borderWidth: 1,
    borderColor: 'rgba(2, 6, 23, 0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80, // Ensure bubble height matches avatar
    flex: 1, // Take full width
    overflow: 'hidden' // Ensure avatar corners are clipped
  },
  bubbleLeft: {
    // Incoming message styling
    // flexDirection: 'row' // Default left alignment
  },
  bubbleRight: {
    backgroundColor: '#f8f9fa',
    marginLeft: 'auto'
  },
  avatarInBubble: {
    width: 60, // Match bubble height
    height: 80
    // alignItems: 'center'
  },
  audioControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12, // Smaller left padding (space after avatar)
    paddingRight: 15, // Maintain right padding (space to edge)
    paddingVertical: 12
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.foreground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 4,
    borderColor: '#F2F3F3'
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    opacity: 0.6
  },
  loadingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    opacity: 0.6
  },
  errorButton: {
    backgroundColor: '#ef4444'
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginBottom: 6
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.foreground,
    borderRadius: 2
  },
  timeText: {
    ...TextStyles.caption,
    color: Colors.placeholder,
    fontSize: 11
  }
})

export default MessagePlayer
