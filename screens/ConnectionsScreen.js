import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
  RefreshControl
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Plus, LifeBuoy, Settings2 } from 'lucide-react-native'

import { TextStyles, ComponentStyles, Colors } from '../styles/fonts'
import { authCheck } from '../lib/auth'
import User from '../hooks/user'
import navTransition from '../hooks/transition'
import ElevenAvatar from '../components/ElevenAvatar'
import AddConnectionModal from '../components/AddConnectionModal'
import { replaceDomain } from '../lib/util'
import { getResponsiveSpacing, scale, isSmallDevice } from '../utils/responsive'

export default function ConnectionsScreen ({ navigation, route }) {
  const { navigate, loading, setLoading } = navTransition()
  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me, connections } = User(authToken)

  const [meData, setMeData] = useState(null)
  const [connectionData, setConnectionData] = useState([])
  const [inviteVisible, setInviteVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Get route params to check if we should auto-open the modal
  const { autoOpenModal } = route?.params || {}

  // Helper function to format names like the web version
  const formatConnectionName = connection => {
    if (connection.full_name) {
      const names = connection.full_name.replace(/ +(?= )/g, '').split(' ')
      if (names.length >= 2) {
        return `${names[0].trim()} ${names[1]
          .trim()
          .slice(0, 1)
          .toUpperCase()}.`
      }
      return names[0].trim()
    }
    return connection.phone_last_4 || 'Unknown'
  }

  // Helper function to check if a connection is recent (within 7 days)
  const isRecentConnection = connection => {
    if (!connection.last_message_at) {
      // If no last message, consider it recent so new connections appear at top
      return true
    }

    const lastMessageDate = new Date(connection.last_message_at)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    return lastMessageDate >= sevenDaysAgo
  }

  // Helper function to group and sort connections
  const groupConnections = connections => {
    const recent = []
    const older = []
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    console.log('📅 Grouping connections - Current time:', now.toISOString())
    console.log('📅 Seven days ago threshold:', sevenDaysAgo.toISOString())

    connections.forEach((connection, index) => {
      const isRecent = isRecentConnection(connection)
      const lastMessageDate = connection.last_message_at
        ? new Date(connection.last_message_at)
        : null

      console.log(
        `🔍 Connection ${index + 1} (${
          connection.full_name || connection.phone_last_4
        }):`,
        {
          last_message_at: connection.last_message_at,
          parsed_date: lastMessageDate?.toISOString(),
          is_recent: isRecent,
          days_ago: lastMessageDate
            ? Math.floor((now - lastMessageDate) / (1000 * 60 * 60 * 24))
            : 'no messages'
        }
      )

      if (isRecent) {
        recent.push(connection)
      } else {
        older.push(connection)
      }
    })

    console.log('📊 Grouping results:', {
      recent_count: recent.length,
      older_count: older.length
    })

    // Sort each group by last message date (most recent first)
    const sortByLastMessage = (a, b) => {
      const dateA = a.last_message_at
        ? new Date(a.last_message_at)
        : new Date(0)
      const dateB = b.last_message_at
        ? new Date(b.last_message_at)
        : new Date(0)
      return dateB - dateA
    }

    recent.sort(sortByLastMessage)
    older.sort(sortByLastMessage)

    return { recent, older }
  }

  // Fetch connections data
  const fetchData = async (isRefresh = false) => {
    // For refresh, the refreshing state is already set in onRefresh
    if (!isRefresh) {
      setLoading(true)
    }

    try {
      const [meResponse, connectionsResponse] = await Promise.all([
        me(),
        connections()
      ])

      setMeData(meResponse.data)
      // Use only real connections from API
      const realConnections = connectionsResponse.data || []
      setConnectionData(realConnections)

      // Debug: Log connection data structure
      console.log('✅ Fetched data:', {
        user: meResponse.data?.first_name,
        connections: realConnections.length,
        isRefresh
      })

      // Debug: Log first connection to see data structure
      if (realConnections.length > 0) {
        console.log('🔍 First connection data structure:', realConnections[0])
        console.log('🔍 Available keys:', Object.keys(realConnections[0]))
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      Alert.alert('Error', 'Failed to load connections')
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  // Initial data fetch on authentication
  useEffect(() => {
    if (checkingAuth) return

    if (!isAuthenticated) {
      navigate('Home')
      return
    }

    fetchData(false)
  }, [isAuthenticated, checkingAuth])

  // Auto-open modal when coming from onboarding
  useEffect(() => {
    if (autoOpenModal && meData && !loading) {
      console.log(
        '🎉 Auto-opening add connection modal after onboarding completion'
      )
      setInviteVisible(true)

      // Clear the route param to prevent re-opening on future navigations
      // This ensures the modal only auto-opens once
      navigation.setParams({ autoOpenModal: undefined })
    }
  }, [autoOpenModal, meData, loading])

  const handleConnectionPress = connectionId => {
    console.log('Connection pressed:', connectionId)
    navigate('ConnectionMessages', { connectionId })
  }

  const handleInvitePress = () => {
    setInviteVisible(true)
  }

  const onRefresh = async () => {
    // Start the refresh state immediately for visual feedback
    setRefreshing(true)

    // Wait a brief moment to ensure the pull gesture has completed
    // This gives better UX by letting the user see the refresh animation start
    setTimeout(() => {
      fetchData(true)
    }, 100)
  }

  const handleSettingsPress = () => {
    navigate('Settings')
  }

  const handleHelpPress = () => {
    Linking.openURL(
      'https://getelevenapp.com/faq?utm_source=settings_page&utm_medium=app&utm_campaign=faq'
    )
  }

  if (checkingAuth || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.connectionsWrap}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Connections ({connectionData.length.toLocaleString('en-US')})
          </Text>
          <View style={styles.floatingIconTop}>
            <TouchableOpacity onPress={handleInvitePress}>
              <Plus size={24} color={Colors.foreground} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connections Grid */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.copy}
              titleColor={Colors.copy}
            />
          }
        >
          <View style={styles.connectionsContainer}>
            {connectionData && connectionData.length > 0 ? (
              (() => {
                const { recent, older } = groupConnections(connectionData)

                const renderConnection = (
                  connection,
                  index,
                  isRecent = true
                ) => {
                  const avatarUrl = connection.avatar_url
                    ? replaceDomain(
                        connection.avatar_url,
                        'ik.imagekit.io/geteleven/tr:h-300'
                      )
                    : null

                  // Calculate responsive avatar size based on screen size
                  const avatarWidth = scale(isSmallDevice ? 170 : 177)
                  const avatarHeight = scale(isSmallDevice ? 210 : 240)

                  return (
                    <TouchableOpacity
                      key={`${isRecent ? 'recent' : 'older'}-${connection.id}`}
                      style={styles.connectionItem}
                      onPress={() => handleConnectionPress(connection.id)}
                    >
                      <ElevenAvatar
                        src={avatarUrl}
                        width={avatarWidth}
                        height={avatarHeight}
                        size={175}
                        borderColor='#f1f5f9'
                        borderWidth={2}
                        borderRadius={20}
                        showNameLabel={true}
                        name={formatConnectionName(connection)}
                        newMessages={connection.new_messages > 0}
                        onClick={() => handleConnectionPress(connection.id)}
                      />
                    </TouchableOpacity>
                  )
                }

                return (
                  <>
                    {/* Recent Connections */}
                    {recent.length > 0 && (
                      <View style={styles.connectionsGrid}>
                        {recent.map((connection, index) =>
                          renderConnection(connection, index, true)
                        )}
                      </View>
                    )}

                    {/* Separator */}
                    {recent.length > 0 && older.length > 0 && (
                      <View style={styles.separator}>
                        <View style={styles.separatorLine} />
                        <Text style={styles.separatorText}>
                          Older than 7 days
                        </Text>
                        <View style={styles.separatorLine} />
                      </View>
                    )}

                    {/* Older Connections */}
                    {older.length > 0 && (
                      <View style={styles.connectionsGrid}>
                        {older.map((connection, index) =>
                          renderConnection(connection, index, false)
                        )}
                      </View>
                    )}
                  </>
                )
              })()
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No connections yet</Text>
                {meData && meData.manager && (
                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={handleInvitePress}
                  >
                    <Text style={styles.inviteButtonText}>Invite someone</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomBarIcon}
            onPress={handleHelpPress}
          >
            <LifeBuoy size={24} color={Colors.foreground} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bottomBarIcon}
            onPress={handleSettingsPress}
          >
            <Settings2 size={24} color={Colors.foreground} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Connection Modal */}
      <AddConnectionModal
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        user={meData}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    ...ComponentStyles.container,
    backgroundColor: '#ffffff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    ...TextStyles.body,
    color: Colors.copy
  },
  connectionsWrap: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 0,
    marginHorizontal: -15, // Extend border to screen edges
    paddingHorizontal: 20, // Maintain content padding
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(2, 6, 23, 0.05)',
    paddingVertical: 10
  },
  headerTitle: {
    ...TextStyles.title, // Use responsive title style
    fontFamily: 'Poppins'
  },
  floatingIconTop: {
    borderRadius: 48,
    padding: 10
  },
  scrollContainer: {
    flex: 1
  },
  connectionsContainer: {
    paddingBottom: 100 // Account for bottom bar
  },
  connectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingTop: getResponsiveSpacing.elementSpacing
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: getResponsiveSpacing.elementSpacing * 1.5,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border
  },
  separatorText: {
    ...TextStyles.caption,
    color: Colors.placeholder,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 15,
    textAlign: 'center'
  },
  connectionItem: {
    width: '48%', // Exactly half the screen width minus small gap
    alignItems: 'center', // Align to left edge
    justifyContent: 'center',
    marginBottom: scale(20),
    marginTop: 0
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 100
  },
  emptyStateText: {
    ...TextStyles.body,
    color: Colors.placeholder,
    marginBottom: 20
  },
  inviteButton: {
    backgroundColor: Colors.copy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  inviteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderTopWidth: 0,
    borderTopColor: 'rgba(0, 0, 0, 0.05)'
  },
  bottomBarIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: '#ffffff',
    padding: 15,
    borderColor: Colors.border,
    borderWidth: 1,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  bottomBarText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.copy,
    marginTop: 8,
    textAlign: 'center'
  }
})
