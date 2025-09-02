import AsyncStorage from '@react-native-async-storage/async-storage'
import PushNotificationService from './PushNotificationService'
import { api } from '../lib/api'

class AuthService {
  constructor() {
    this.isValidating = false
  }

  /**
   * Validate the current auth token by making a test API call
   * @returns {Promise<boolean>} True if token is valid, false otherwise
   */
  async validateToken(authToken) {
    if (!authToken) {
      console.log('[AuthService] No auth token to validate')
      return false
    }

    if (this.isValidating) {
      console.log('[AuthService] Already validating, skipping...')
      return true // Assume valid to avoid multiple simultaneous checks
    }

    try {
      this.isValidating = true
      console.log('[AuthService] Validating auth token...')
      
      // Try to fetch user data as a validation check
      const response = await api('GET', '/users/me', {}, authToken)
      
      if (response.error) {
        console.log('[AuthService] Token validation failed:', response.error)
        
        // Check for specific auth errors
        if (
          response.error.includes('401') ||
          response.error.includes('403') ||
          response.error.includes('Unauthorized') ||
          response.error.includes('Forbidden') ||
          response.error.includes('Invalid token') ||
          response.error.includes('Token expired')
        ) {
          console.log('[AuthService] Token is invalid or expired')
          return false
        }
        
        // For other errors (network, etc), assume token might still be valid
        console.log('[AuthService] Non-auth error, assuming token might be valid')
        return true
      }
      
      console.log('[AuthService] Token is valid')
      return true
    } catch (error) {
      console.error('[AuthService] Error validating token:', error)
      // On network errors, assume token might still be valid
      return true
    } finally {
      this.isValidating = false
    }
  }

  /**
   * Force logout - clears all auth data
   */
  async forceLogout() {
    console.log('[AuthService] Forcing logout...')
    
    try {
      // Clear auth token
      await AsyncStorage.removeItem('authToken')
      
      // Clear push notification data
      await PushNotificationService.clearStoredToken()
      await PushNotificationService.clearNotificationBadge()
      
      // Clear any other auth-related data
      const keysToRemove = [
        'authToken',
        'userId',
        'userEmail',
        'userName',
        'onboarding_completed',
        'user_preferences'
      ]
      
      await AsyncStorage.multiRemove(keysToRemove)
      
      console.log('[AuthService] Force logout complete')
      return { success: true }
    } catch (error) {
      console.error('[AuthService] Error during force logout:', error)
      // Even if there's an error, try to at least clear the auth token
      try {
        await AsyncStorage.removeItem('authToken')
      } catch (e) {
        console.error('[AuthService] Failed to clear auth token:', e)
      }
      return { success: false, error }
    }
  }

  /**
   * Clear ALL app storage (nuclear option)
   */
  async clearAllStorage() {
    console.log('[AuthService] Clearing ALL app storage...')
    
    try {
      await AsyncStorage.clear()
      console.log('[AuthService] All storage cleared')
      return { success: true }
    } catch (error) {
      console.error('[AuthService] Error clearing storage:', error)
      return { success: false, error }
    }
  }

  /**
   * Check auth status and validate token
   * Will force logout if token is invalid
   */
  async checkAuthStatus() {
    try {
      const authToken = await AsyncStorage.getItem('authToken')
      
      if (!authToken) {
        console.log('[AuthService] No auth token found')
        return { 
          isAuthenticated: false, 
          authToken: null,
          needsLogin: true 
        }
      }
      
      // Validate the token
      const isValid = await this.validateToken(authToken)
      
      if (!isValid) {
        console.log('[AuthService] Token invalid, forcing logout...')
        await this.forceLogout()
        return { 
          isAuthenticated: false, 
          authToken: null,
          needsLogin: true,
          wasInvalidated: true 
        }
      }
      
      return { 
        isAuthenticated: true, 
        authToken,
        needsLogin: false 
      }
    } catch (error) {
      console.error('[AuthService] Error checking auth status:', error)
      return { 
        isAuthenticated: false, 
        authToken: null,
        needsLogin: true,
        error: error.message 
      }
    }
  }
}

// Export singleton instance
export default new AuthService()