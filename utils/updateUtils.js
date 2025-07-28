import * as Updates from 'expo-updates'
import { Alert } from 'react-native'
import Constants from 'expo-constants'

/**
 * Check for and handle EAS updates
 * @param {Object} options - Configuration options
 * @param {boolean} options.showSuccessMessage - Whether to show a message when no updates are available
 * @param {boolean} options.allowUserChoice - Whether to ask user before downloading/restarting
 * @param {string} options.updateMessage - Custom message to show when update is available
 */
export const checkForUpdates = async (options = {}) => {
  const {
    showSuccessMessage = false,
    allowUserChoice = true,
    updateMessage = 'A new version of the app is available. Would you like to update now?'
  } = options

  try {
    // Only check for updates in production builds
    if (!Updates.isEnabled) {
      if (__DEV__) {
        console.log('Updates are disabled in development mode')
      }
      return { success: false, reason: 'Updates disabled' }
    }

    // Disable updates for development builds
    const isDevelopmentBuild =
      Constants.appOwnership === 'expo' ||
      Constants.manifest?.channel === 'development' ||
      __DEV__

    if (isDevelopmentBuild) {
      return { success: false, reason: 'Development build - updates disabled' }
    }

    const update = await Updates.checkForUpdateAsync()

    if (update.isAvailable) {
      if (allowUserChoice) {
        // Ask user if they want to update now
        return new Promise(resolve => {
          Alert.alert('Update Available', updateMessage, [
            {
              text: 'Later',
              style: 'cancel',
              onPress: () =>
                resolve({ success: false, reason: 'User declined' })
            },
            {
              text: 'Update Now',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync()
                  Alert.alert(
                    'Update Ready',
                    'The update has been downloaded. The app will restart now.',
                    [
                      {
                        text: 'Restart',
                        onPress: async () => {
                          await Updates.reloadAsync()
                        }
                      }
                    ]
                  )
                  resolve({ success: true, reason: 'Update applied' })
                } catch (error) {
                  Alert.alert(
                    'Update Failed',
                    'Could not download the update. Please try again later.'
                  )
                  resolve({ success: false, reason: 'Download failed', error })
                }
              }
            }
          ])
        })
      } else {
        // Auto-update without user intervention
        await Updates.fetchUpdateAsync()
        await Updates.reloadAsync()
        return { success: true, reason: 'Update applied automatically' }
      }
    } else {
      if (showSuccessMessage) {
        Alert.alert(
          'No Updates',
          'You are running the latest version of the app.'
        )
      }
      return { success: false, reason: 'No updates available' }
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
    // Don't show error alerts for automatic checks to avoid annoying users
    if (showSuccessMessage) {
      Alert.alert(
        'Update Check Failed',
        'Could not check for updates. Please try again later.'
      )
    }
    return { success: false, reason: 'Check failed', error }
  }
}

/**
 * Initialize automatic update checking on app start
 * This will check for updates silently and apply them automatically
 */
export const initializeAutoUpdates = async () => {
  // Wait a moment after app start to avoid interfering with initial loading
  setTimeout(() => {
    checkForUpdates({
      showSuccessMessage: false,
      allowUserChoice: false, // Auto-apply updates
      updateMessage: null // No user prompt needed
    })
  }, 2000)
}

/**
 * Manual update check (for settings screen or pull-to-refresh)
 * This will show feedback to the user regardless of the result
 */
export const manualUpdateCheck = async () => {
  return checkForUpdates({
    showSuccessMessage: true,
    allowUserChoice: true,
    updateMessage:
      'An update is available. Would you like to download and install it now?'
  })
}

/**
 * Get current update information
 */
export const getCurrentUpdateInfo = () => {
  if (!Updates.isEnabled) {
    return {
      isEnabled: false,
      channel: null,
      updateId: null,
      createdAt: null
    }
  }

  return {
    isEnabled: true,
    channel: Updates.channel,
    updateId: Updates.updateId,
    createdAt: Updates.createdAt
  }
}
