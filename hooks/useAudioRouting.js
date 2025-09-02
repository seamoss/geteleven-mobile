import { useState, useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import { Audio } from 'expo-av'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AUDIO_PREFERENCE_KEY = '@audio_routing_preference'

/**
 * Custom hook for managing audio routing based on:
 * 1. External device connection (highest priority)
 * 2. Silent/Ringer switch state
 * 3. User preferences
 */
export const useAudioRouting = () => {
  const [audioMode, setAudioMode] = useState('speaker')
  const [hasExternalDevice, setHasExternalDevice] = useState(false)
  const [isSilentMode, setIsSilentMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const appState = useRef(AppState.currentState)
  const checkInterval = useRef(null)

  // Audio configurations
  const SPEAKER_CONFIG = {
    allowsRecordingIOS: false,
    staysActiveInBackground: true,
    playsInSilentModeIOS: false, // Respect silent mode
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
  }

  const EARPIECE_CONFIG = {
    allowsRecordingIOS: true, // Required for earpiece on iOS
    staysActiveInBackground: true,
    playsInSilentModeIOS: true, // Always play in silent mode
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: true,
    interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
    interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
  }

  // Check for silence mode using a workaround
  const checkSilentMode = async () => {
    if (Platform.OS !== 'ios') {
      return false
    }

    try {
      // Create a test sound with a very short silent audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=' },
        { 
          shouldPlay: false,
          volume: 1.0
        }
      )

      // Try to get the status
      const status = await sound.getStatusAsync()
      
      // Set audio mode to check if we can play through speaker
      await Audio.setAudioModeAsync({
        ...SPEAKER_CONFIG,
        playsInSilentModeIOS: false
      })

      // Try to play the sound
      await sound.playAsync()
      
      // Wait a brief moment
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check if it actually played
      const playStatus = await sound.getStatusAsync()
      await sound.unloadAsync()

      // If the sound didn't play or position didn't advance, we're in silent mode
      const inSilentMode = !playStatus.isPlaying && playStatus.positionMillis === 0

      return inSilentMode
    } catch (error) {
      console.log('Error checking silent mode:', error)
      return false
    }
  }

  // Check for external audio devices
  const checkExternalDevices = async () => {
    try {
      // This is a placeholder - in a real implementation, you'd check
      // the current audio route for Bluetooth, AirPlay, etc.
      // For now, we'll return false
      return false
    } catch {
      return false
    }
  }

  // Configure audio based on current state
  const configureAudio = async () => {
    try {
      setIsLoading(true)

      // Check for external devices first (highest priority)
      const hasExternal = await checkExternalDevices()
      setHasExternalDevice(hasExternal)

      if (hasExternal) {
        // External device connected - use default routing
        await Audio.setAudioModeAsync(SPEAKER_CONFIG)
        setAudioMode('external')
        return
      }

      // Check silent mode
      const silent = await checkSilentMode()
      setIsSilentMode(silent)

      // Load user preference
      const savedPreference = await AsyncStorage.getItem(AUDIO_PREFERENCE_KEY)
      const preferEarpiece = savedPreference === 'earpiece'

      // Determine audio mode
      if (silent || preferEarpiece) {
        // Use earpiece for silent mode or user preference
        await Audio.setAudioModeAsync(EARPIECE_CONFIG)
        setAudioMode('earpiece')
      } else {
        // Use speaker
        await Audio.setAudioModeAsync(SPEAKER_CONFIG)
        setAudioMode('speaker')
      }
    } catch (error) {
      console.error('Error configuring audio:', error)
      // Default to speaker on error
      await Audio.setAudioModeAsync(SPEAKER_CONFIG)
      setAudioMode('speaker')
    } finally {
      setIsLoading(false)
    }
  }

  // Switch between speaker and earpiece manually
  const switchOutput = async (useSpeaker) => {
    try {
      const config = useSpeaker ? SPEAKER_CONFIG : EARPIECE_CONFIG
      await Audio.setAudioModeAsync(config)
      setAudioMode(useSpeaker ? 'speaker' : 'earpiece')
      
      // Save preference
      await AsyncStorage.setItem(
        AUDIO_PREFERENCE_KEY,
        useSpeaker ? 'speaker' : 'earpiece'
      )
      
      return true
    } catch (error) {
      console.error('Error switching audio output:', error)
      return false
    }
  }

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to foreground, recheck audio configuration
        configureAudio()
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  // Initial setup and periodic checks
  useEffect(() => {
    configureAudio()

    // Check periodically for changes (every 5 seconds)
    checkInterval.current = setInterval(() => {
      if (appState.current === 'active') {
        configureAudio()
      }
    }, 5000)

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current)
      }
    }
  }, [])

  return {
    audioMode,
    hasExternalDevice,
    isSilentMode,
    isLoading,
    switchOutput,
    refresh: configureAudio
  }
}

export default useAudioRouting