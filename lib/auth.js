'use strict'

import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const signOut = async () => {
  try {
    await AsyncStorage.removeItem('authToken')
    return { success: true }
  } catch (error) {
    // Silently handle error
    return { success: false, error }
  }
}

export const authCheck = () => {
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState(null)

  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken')

        if (authToken) {
          setCheckingAuth(false)
          setIsAuthenticated(true)
          setAuthToken(authToken)
        } else {
          setCheckingAuth(false)
        }
      } catch (error) {
        // Silently handle error
        setCheckingAuth(false)
      }
    }

    getAuthToken()
  }, [])

  return { isAuthenticated, authToken, checkingAuth }
}
