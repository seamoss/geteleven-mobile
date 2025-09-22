import { Audio } from 'expo-av'
import { DEBUG_ENABLED } from '../lib/config'

/**
 * Audio utility for handling production CDN MP3 playback
 * Optimized for DigitalOcean Spaces and other HTTPS CDN sources
 */

// Audio configuration for speaker (loud) playback
const SPEAKER_AUDIO_CONFIG = {
  allowsRecordingIOS: false,
  staysActiveInBackground: true, // Allow background audio
  playsInSilentModeIOS: false, // Respect silent mode when using speaker
  shouldDuckAndroid: true, // Lower other audio when playing
  playThroughEarpieceAndroid: false,
  interruptionModeIOS: 1,
  interruptionModeAndroid: 1
}

// Audio configuration for earpiece (quiet) playback
const EARPIECE_AUDIO_CONFIG = {
  allowsRecordingIOS: true, // Needed for earpiece routing on iOS
  staysActiveInBackground: true,
  playsInSilentModeIOS: true, // Always play through earpiece in silent mode
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: true, // Use earpiece on Android
  interruptionModeIOS: 1,
  interruptionModeAndroid: 1
}

// Development audio configuration
const DEVELOPMENT_AUDIO_CONFIG = {
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false
}

/**
 * Check if any external audio device is connected
 */
const checkForExternalDevices = async () => {
  try {
    const status = await Audio.getStatusAsync()
    // This is a simplified check - in production you might want to use a native module
    // for more detailed device detection
    return false // Default to no external devices for now
  } catch {
    return false
  }
}

/**
 * Detect if the device is in silent mode (iOS)
 * Note: This is a heuristic approach as iOS doesn't provide direct API
 */
const detectSilentMode = async () => {
  try {
    // Try to play a very short silent sound to detect if silent mode is on
    // If it doesn't play, we're likely in silent mode
    const { sound } = await Audio.Sound.createAsync(
      {
        uri: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='
      },
      { shouldPlay: false, volume: 0 }
    )

    // Check if we can play through speaker
    const status = await sound.getStatusAsync()
    await sound.unloadAsync()

    // If playsInSilentModeIOS is false and device is muted, sound won't play
    return false // Default to not silent for initial implementation
  } catch {
    return false
  }
}

/**
 * Initialize audio mode for the app
 * Call this once when the app starts
 * @param {boolean} forceEarpiece - Force earpiece mode regardless of silent switch
 */
export const initializeAudioMode = async (forceEarpiece = false) => {
  try {
    if (DEBUG_ENABLED) {
      await Audio.setAudioModeAsync(DEVELOPMENT_AUDIO_CONFIG)
      return { mode: 'development' }
    }

    // Check for external devices first (highest priority)
    const hasExternalDevice = await checkForExternalDevices()

    if (hasExternalDevice) {
      // If external device connected, use speaker config but system will route to device
      await Audio.setAudioModeAsync(SPEAKER_AUDIO_CONFIG)
      return { mode: 'external_device' }
    }

    // Check if we should use earpiece (silent mode or forced)
    const isSilentMode = await detectSilentMode()
    const useEarpiece = forceEarpiece || isSilentMode

    if (useEarpiece) {
      await Audio.setAudioModeAsync(EARPIECE_AUDIO_CONFIG)
      return {
        mode: 'earpiece',
        reason: forceEarpiece ? 'forced' : 'silent_mode'
      }
    } else {
      await Audio.setAudioModeAsync(SPEAKER_AUDIO_CONFIG)
      return { mode: 'speaker' }
    }
  } catch (error) {
    // Fallback to speaker mode on error
    await Audio.setAudioModeAsync(SPEAKER_AUDIO_CONFIG)
    return { mode: 'speaker', error: error.message }
  }
}

/**
 * Switch audio output between speaker and earpiece
 * @param {boolean} useSpeaker - true for speaker, false for earpiece
 */
export const switchAudioOutput = async useSpeaker => {
  try {
    const config = useSpeaker ? SPEAKER_AUDIO_CONFIG : EARPIECE_AUDIO_CONFIG
    await Audio.setAudioModeAsync(config)
    return { success: true, mode: useSpeaker ? 'speaker' : 'earpiece' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Validate if a URL is a valid audio source
 */
export const isValidAudioUrl = url => {
  if (!url || typeof url !== 'string') {
    return false
  }

  // Allow mock URLs for testing
  if (url.startsWith('mock://')) return true

  // Check for HTTPS URLs
  if (!url.startsWith('https://')) {
    return false
  }

  // Check for supported audio formats - be more lenient
  const supportedFormats = [
    '.mp3',
    '.wav',
    '.m4a',
    '.aac',
    'mp3',
    'wav',
    'm4a',
    'aac'
  ]
  const hasValidFormat = supportedFormats.some(format =>
    url.toLowerCase().includes(format.toLowerCase())
  )

  // Still return true even if format check fails - let the audio system try to load it
  return true
}

/**
 * Progressive loading options for faster initial audio setup
 */
const getProgressiveLoadingConfig = () => ({
  // Load enough data to start playback quickly
  bufferTimeSeconds: 2.0, // Buffer 2 seconds ahead
  loadAsync: true, // Load asynchronously
  progressiveDownloadEnabled: true, // Enable progressive download
  networkTimeout: 10000 // 10 second timeout
})

/**
 * Enhanced audio loading with better error handling and retries
 */
export const loadAudioWithRetry = async (url, options = {}, maxRetries = 3) => {
  const {
    onPlaybackStatusUpdate,
    shouldPlay = false,
    isLooping = false,
    progressUpdateIntervalMillis = 100
  } = options

  if (!isValidAudioUrl(url)) {
    throw new Error('Invalid audio URL provided')
  }

  let lastError = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Create the audio source object
      const source = { uri: url }

      // Add optimized headers for CDN requests
      if (url.includes('digitaloceanspaces.com')) {
        source.headers = {
          Accept: 'audio/mpeg, audio/*, */*',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive'
        }
      }

      const { sound } = await Audio.Sound.createAsync(
        source,
        {
          shouldPlay,
          isLooping,
          progressUpdateIntervalMillis
        },
        onPlaybackStatusUpdate
      )

      // Verify the sound loaded correctly
      const status = await sound.getStatusAsync()
      if (!status.isLoaded) {
        throw new Error('Sound failed to load properly')
      }

      return sound
    } catch (error) {
      lastError = error

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to load audio after ${maxRetries} attempts: ${
      lastError?.message || 'Unknown error'
    }`
  )
}

/**
 * Smart preloading - prioritize recent messages and limit concurrent downloads
 */
export const smartPreloadAudioFiles = async (messages, options = {}) => {
  const {
    maxConcurrent = 3, // Max 3 audio files loading at once
    priorityCount = 5, // Prioritize 5 most recent messages
    onProgress = null
  } = options

  // Sort messages by timestamp (most recent first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
  )

  const audioUrls = sortedMessages
    .filter(msg => msg.fileUrl && isValidAudioUrl(msg.fileUrl))
    .map(msg => ({ id: msg.id, url: msg.fileUrl, priority: true }))

  const results = new Map()
  let loaded = 0
  let currentlyLoading = 0

  // Process priority files first (recent messages)
  const priorityUrls = audioUrls.slice(0, priorityCount)
  const remainingUrls = audioUrls.slice(priorityCount)

  const processUrls = async (urls, isPriority = false) => {
    for (const { id, url } of urls) {
      // Wait if we're at max concurrent downloads
      while (currentlyLoading >= maxConcurrent) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      currentlyLoading++

      try {
        const sound = await loadAudioWithRetry(url, {}, 1)
        await sound.pauseAsync() // Keep paused to save resources

        results.set(id, { sound, success: true, url })
      } catch (error) {
        results.set(id, { error: error.message, success: false, url })
      } finally {
        currentlyLoading--
        loaded++

        if (onProgress) {
          onProgress(loaded, audioUrls.length)
        }
      }
    }
  }

  // Load priority files first, then background files
  await processUrls(priorityUrls, true)
  await processUrls(remainingUrls, false)

  return results
}

/**
 * Legacy preload function for backward compatibility
 */
export const preloadAudioFiles = async (urls, onProgress) => {
  const messages = urls.map((url, index) => ({ id: index, fileUrl: url }))
  const results = await smartPreloadAudioFiles(messages, { onProgress })

  // Convert back to array format
  return Array.from(results.values()).map(result => ({
    url: result.url,
    sound: result.sound,
    success: result.success,
    error: result.error
  }))
}

/**
 * Clean up audio resources
 */
export const cleanupAudio = async sound => {
  if (sound) {
    try {
      await sound.unloadAsync()
    } catch (error) {
      // Silently handle error
    }
  }
}

/**
 * Check if audio playback is supported on the current platform
 */
export const isAudioPlaybackSupported = () => {
  // expo-av is supported on iOS and Android
  return true
}

export default {
  initializeAudioMode,
  switchAudioOutput,
  isValidAudioUrl,
  loadAudioWithRetry,
  preloadAudioFiles,
  smartPreloadAudioFiles,
  cleanupAudio,
  isAudioPlaybackSupported
}
