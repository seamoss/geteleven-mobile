import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRoute, useFocusEffect } from '@react-navigation/native'
import { X } from 'lucide-react-native'
import { authCheck } from '../lib/auth'
import { TextStyles, Colors } from '../styles/fonts'
import { PlaybackProvider, usePlayback } from '../providers/PlaybackProvider'
import useTransition from '../hooks/transition'
import User from '../hooks/user'
import Message from '../hooks/message'
import MessagePlayer from '../components/MessagePlayer'
import VoiceRecordingModal from '../components/VoiceRecordingModal'
import LoadMoreButton from '../components/LoadMoreButton'
import Loader from '../components/Loader'

// Inner component that has access to PlaybackProvider context
function ConnectionMessagesScreenInner () {
  const { navigate, back, loading, setLoading } = useTransition()
  const route = useRoute()
  const { connectionId, autoRecord, isNewUser } = route.params || {}
  const { stopAll, cleanup } = usePlayback()
  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me, connections, getConnection } = User(authToken)
  const { getMessages, sendMessage } = Message(authToken, connectionId)
  
  // Debug log to verify connectionId is received
  useEffect(() => {
    console.log('ConnectionMessagesScreen params:', { connectionId, autoRecord, isNewUser })
  }, [connectionId, autoRecord, isNewUser])

  // Handle close button - stop all audio before navigating
  const handleClose = () => {
    stopAll()
    back()
  }

  // Cleanup audio when component unmounts (safety net)
  useEffect(() => {
    return () => {
      stopAll()
    }
  }, [stopAll])

  const [meData, setMeData] = useState(null)
  const [messagesData, setMessagesData] = useState([])
  const [connectionData, setConnectionData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [erroredMessages, setErroredMessages] = useState(new Set())
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [isNewConnection, setIsNewConnection] = useState(false)

  // Pagination state
  const [pagination, setPagination] = useState({
    limit: 5,
    offset: 0,
    total: 0,
    hasMore: false
  })
  const [loadingMore, setLoadingMore] = useState(false)

  // Refs to prevent race conditions
  const isMountedRef = useRef(true)
  const fetchingRef = useRef(false)
  const scrollViewRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (checkingAuth || loading || !isMountedRef.current) return

    if (!isAuthenticated) {
      navigate('Signin', { connectionId })
      return
    }

    if (!isInitialized) {
      fetchData()
    }
  }, [isAuthenticated, checkingAuth, loading, isInitialized])
  
  // Handle auto-record from deep link
  useEffect(() => {
    if (autoRecord && isInitialized && connectionData && !showRecordingModal) {
      // Small delay to ensure screen is fully loaded
      setTimeout(() => {
        setShowRecordingModal(true)
      }, 500)
    }
  }, [autoRecord, isInitialized, connectionData])

  const fetchData = async (isRefresh = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current || !isMountedRef.current) {
      return
    }

    fetchingRef.current = true
    setHasError(false)

    if (!isRefresh) {
      setLoading(true)
    }

    try {
      // Reset pagination for fresh data
      const paginationOptions = isRefresh ? { limit: 5, offset: 0 } : pagination

      const [meResponse, connectionsResponse, messagesResponse] =
        await Promise.all([me(), connections(), getMessages(paginationOptions)])

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        return
      }

      setMeData(meResponse.data)

      // Handle pagination response
      if (messagesResponse.data && messagesResponse.data.messages) {
        setMessagesData(messagesResponse.data.messages)
        setPagination(messagesResponse.data.pagination)
      } else {
        // Fallback for old API format
        setMessagesData(messagesResponse.data || [])
      }

      // Try to find connection in the user's connections list
      let cx = connectionsResponse.data?.find(c => c.id === connectionId)
      let isNew = false
      
      // If connection not found in list (not connected yet), fetch individual connection
      if (!cx && connectionId) {
        console.log('Connection not in list, fetching individual connection:', connectionId)
        isNew = true  // Mark as new connection
        try {
          const individualConnectionResponse = await getConnection(connectionId)
          console.log('Individual connection response:', individualConnectionResponse)
          if (individualConnectionResponse.data) {
            cx = individualConnectionResponse.data
          }
        } catch (err) {
          console.log('Failed to fetch individual connection for ID:', connectionId, err)
          // Connection might not exist yet for new deep link users
        }
      }
      
      setConnectionData(cx)
      setIsNewConnection(isNew)
      setIsInitialized(true)
    } catch (err) {
      if (!isMountedRef.current) return

      setHasError(true)
      // Only show alert if not a refresh
      if (!isRefresh) {
        Alert.alert('Error', 'Failed to load messages. Please try again.')
      }
    } finally {
      fetchingRef.current = false

      if (isMountedRef.current) {
        if (!isRefresh) {
          setLoading(false)
        }
      }
    }
  }

  const loadMoreMessages = async () => {
    if (loadingMore || !pagination.hasMore || fetchingRef.current) {
      return
    }

    setLoadingMore(true)

    try {
      const nextOffset = pagination.offset + pagination.limit
      const messagesResponse = await getMessages({
        limit: pagination.limit,
        offset: nextOffset
      })

      if (!isMountedRef.current) return

      if (messagesResponse.data && messagesResponse.data.messages) {
        // Append older messages after the existing newest messages
        setMessagesData(prev => [...prev, ...messagesResponse.data.messages])
        setPagination(messagesResponse.data.pagination)
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load more messages. Please try again.')
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false)
      }
    }
  }

  const onRefresh = async () => {
    if (fetchingRef.current) return // Prevent refresh during active fetch

    setRefreshing(true)

    try {
      await fetchData(true) // Pass true for isRefresh
    } catch (err) {
      // Silently handle error
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }

  // Function to handle when a message fails to load
  const handleMessageError = messageId => {
    setErroredMessages(prev => new Set([...prev, messageId]))
  }

  // Function to handle sending a voice message
  const handleSendMessage = async recordingData => {
    try {
      // Send the message
      await sendMessage(
        recordingData.uri,
        recordingData.duration
      )

      // If this was a new connection, we need to refresh connections list
      if (isNewConnection) {
        // Re-fetch connections to update the list
        const connectionsResponse = await connections()
        
        // Check if the connection is now in the list
        const nowConnected = connectionsResponse.data?.find(c => c.id === connectionId)
        if (nowConnected) {
          setConnectionData(nowConnected)
          setIsNewConnection(false)  // No longer a new connection
        }
      }

      // Refresh the message feed to show the new message
      await fetchData(true)

      // Scroll to bottom (newest messages) after refresh
      // Use a small delay to ensure the UI has updated
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true })
        }
      }, 100)
    } catch (err) {
      throw err // Re-throw to let the modal handle the error
    }
  }

  // Helper function to format connection name for messages feed
  const formatConnectionName = connection => {
    if (connection?.full_name) {
      // Use full name for messages feed, just clean up extra spaces
      return connection.full_name.replace(/ +/g, ' ').trim()
    }
    return connection?.phone_last_4 || 'Unknown Connection'
  }

  // Use real messages from API only
  const baseMessages = messagesData || []

  // Filter out errored messages
  const validMessages = baseMessages.filter(
    message => !erroredMessages.has(message.id)
  )

  if (checkingAuth || loading) {
    return <Loader />
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.header}>
              {connectionData ? formatConnectionName(connectionData) : 'New Connection'}
            </Text>
            {connectionData?.username && (
              <Text style={styles.username}>@{connectionData.username}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={20} color={Colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Messages Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {validMessages.length > 0 ? (
          <>
            {validMessages.map((message, index) => (
              <View key={message.id} style={styles.messageContainer}>
                <MessagePlayer
                  authToken={authToken}
                  id={message.id}
                  fileUrl={message.file_url}
                  length={message.length}
                  connectionId={connectionId}
                  direction={
                    message.from_user.id === meData?.id ? 'right' : 'left'
                  }
                  connection={connectionData}
                  me={meData}
                  onError={handleMessageError}
                />
              </View>
            ))}

            {/* Load More Button - appears at bottom to load older messages */}
            {pagination.hasMore && (
              <LoadMoreButton
                onPress={loadMoreMessages}
                loading={loadingMore}
                currentCount={validMessages.length}
                totalCount={pagination.total}
                disabled={loadingMore}
              />
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {autoRecord && !connectionData 
                ? 'Send a message to connect!' 
                : 'No messages yet. Start the conversation!'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.recordButton, styles.recordButtonActive]}
          onPress={() => setShowRecordingModal(true)}
        >
          <View style={styles.recordDotActive} />
        </TouchableOpacity>
      </View>

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        visible={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        onSend={handleSendMessage}
        authToken={authToken}
        connectionId={connectionId}
        connection={connectionData}
        isNewUser={isNewUser}
        navigation={navigate}
      />
    </SafeAreaView>
  )
}

export default function ConnectionMessagesScreen () {
  return (
    <PlaybackProvider>
      <ConnectionMessagesScreenInner />
    </PlaybackProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  stickyHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(2, 6, 23, 0.05)',
    zIndex: 1000
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    paddingTop: 15,
    paddingBottom: 100 // Add space for bottom navigation
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headerText: {
    flex: 1
  },
  header: {
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
    textAlign: 'left',
    marginBottom: 4
  },
  username: {
    ...TextStyles.caption,
    color: Colors.placeholder,
    fontSize: 12,
    textAlign: 'left',
    marginTop: -4,
    paddingLeft: 0
  },
  closeButton: {
    padding: 8
  },
  messageContainer: {
    marginBottom: 12
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 60
  },
  emptyStateText: {
    ...TextStyles.body,
    color: Colors.placeholder,
    textAlign: 'center'
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    // backgroundColor: '#ffffff',
    // borderTopWidth: 1,
    // borderTopColor: 'rgba(2, 6, 23, 0.05)',
    paddingBottom: 50,
    paddingVertical: 0,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  recordButton: {
    backgroundColor: '#ffffff',
    borderRadius: 48,
    paddingHorizontal: 20,
    paddingVertical: 20,
    opacity: 1, // Disabled appearance,
    borderColor: Colors.border,
    borderWidth: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  recordDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94a3b8', // Gray for disabled state
    marginRight: 8
  },
  recordButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B' // Gray for disabled state
  },
  recordButtonActive: {
    opacity: 1 // Full opacity for active state
  },
  recordDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444' // Red for active state
  },
  recordButtonTextActive: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.copy // Active text color
  }
})
