import { Audio } from 'expo-av'
import { Platform } from 'react-native'

/**
 * Audio Routing Manager
 * Handles audio playback routing based on:
 * 1. External devices (Bluetooth, AirPlay, etc.) - highest priority
 * 2. Silent/Ringer switch position
 * 3. Default behavior (speaker when ringer on, earpiece when silent)
 */

class AudioRoutingManager {
  constructor () {
    this.isInitialized = false
    this.currentMode = 'speaker'
  }

  /**
   * Initialize audio routing based on device state
   * Should be called when app starts and when playback begins
   */
  async initialize () {
    try {
      // Default configuration that respects the system's audio routing
      const baseConfig = {
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true, // Always allow playback
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1
      }

      // On iOS, we'll use different categories to control routing
      if (Platform.OS === 'ios') {
        // This configuration will:
        // - Play through speaker when ringer is ON
        // - Play through earpiece when ringer is OFF (silent mode)
        // - Always route to external devices when connected
        const iosConfig = {
          ...baseConfig,
          // Use playAndRecord category to enable earpiece routing
          allowsRecordingIOS: true,
          // This allows the system to automatically switch between speaker/earpiece
          // based on the ringer switch and connected devices
          playsInSilentModeIOS: true
        }

        await Audio.setAudioModeAsync(iosConfig)

        // Note: The actual routing (speaker vs earpiece) will be handled
        // by iOS based on the ringer switch position and connected devices
      } else {
        // Android configuration
        await Audio.setAudioModeAsync(baseConfig)
      }

      this.isInitialized = true
      return { success: true, mode: this.currentMode }
    } catch (error) {
      console.error('Failed to initialize audio routing:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Configure audio for playback
   * This should be called before playing any audio
   */
  async configureForPlayback () {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      if (Platform.OS === 'ios') {
        // iOS-specific configuration for playback
        // The system will automatically handle routing based on:
        // 1. Connected devices (Bluetooth, AirPlay, etc.)
        // 2. Ringer switch position
        // 3. User's audio route preferences

        const playbackConfig = {
          allowsRecordingIOS: true, // Needed for flexible routing
          staysActiveInBackground: true,
          playsInSilentModeIOS: true, // Ensure audio plays even in silent mode
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1
        }

        await Audio.setAudioModeAsync(playbackConfig)
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to configure audio for playback:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Force audio to speaker (override silent mode)
   */
  async forceSpeaker () {
    try {
      const config = {
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1
      }

      await Audio.setAudioModeAsync(config)
      this.currentMode = 'speaker'
      return { success: true, mode: 'speaker' }
    } catch (error) {
      console.error('Failed to force speaker:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Force audio to earpiece
   */
  async forceEarpiece () {
    try {
      const config = {
        allowsRecordingIOS: true, // Required for earpiece on iOS
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1
      }

      await Audio.setAudioModeAsync(config)
      this.currentMode = 'earpiece'
      return { success: true, mode: 'earpiece' }
    } catch (error) {
      console.error('Failed to force earpiece:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Reset to default routing (let system decide)
   */
  async resetToDefault () {
    return this.initialize()
  }
}

// Export singleton instance
const audioRoutingManager = new AudioRoutingManager()

export default audioRoutingManager
