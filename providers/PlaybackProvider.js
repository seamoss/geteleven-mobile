import React, { createContext, useContext, useState, useCallback } from 'react'

const PlaybackContext = createContext()

export const usePlayback = () => {
  const context = useContext(PlaybackContext)
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider')
  }
  return context
}

export const PlaybackProvider = ({ children }) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null)
  const [messagePlayerRefs, setMessagePlayerRefs] = useState(new Map())

  const registerPlayer = useCallback((messageId, stopFunction) => {
    setMessagePlayerRefs(prev => {
      const newMap = new Map(prev)
      newMap.set(messageId, stopFunction)
      return newMap
    })
  }, [])

  const unregisterPlayer = useCallback(messageId => {
    setMessagePlayerRefs(prev => {
      const newMap = new Map(prev)
      newMap.delete(messageId)
      return newMap
    })
  }, [])

  const handlePlaybackChange = useCallback(
    messageId => {
      // If starting a new message, stop the currently playing one
      if (messageId && currentlyPlaying && messageId !== currentlyPlaying) {
        const stopFunction = messagePlayerRefs.get(currentlyPlaying)
        if (stopFunction) {
          stopFunction()
        }
      }
      // Always update the currently playing state, even if it's the same message
      // This ensures that replay scenarios work correctly
      setCurrentlyPlaying(messageId)
    },
    [currentlyPlaying, messagePlayerRefs]
  )

  const stopAll = useCallback(() => {
    // Stop all currently playing messages
    messagePlayerRefs.forEach((stopFunction, messageId) => {
      if (stopFunction) {
        try {
          stopFunction()
        } catch (error) {
          // Silently fail
        }
      }
    })
    // Clear the currently playing state
    setCurrentlyPlaying(null)
  }, [messagePlayerRefs])

  const cleanup = useCallback(() => {
    // Stop all audio first
    stopAll()
    // Clear all player references
    setMessagePlayerRefs(new Map())
  }, [stopAll])

  const value = {
    currentlyPlaying,
    handlePlaybackChange,
    stopAll,
    cleanup,
    registerPlayer,
    unregisterPlayer
  }

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  )
}
