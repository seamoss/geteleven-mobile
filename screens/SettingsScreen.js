import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  AtSign,
  CircleUser,
  Image,
  MessageCircleQuestion,
  Send,
  X,
  LogOut,
  Bug
} from 'lucide-react-native'
import { authCheck, signOut } from '../lib/auth'
import { replaceDomain, formatAvatarName } from '../lib/util'
import { TextStyles, Colors } from '../styles/fonts'
import useTransition from '../hooks/transition'
import User from '../hooks/user'
import ElevenAvatar from '../components/ElevenAvatar'
import Loader from '../components/Loader'
import { DEBUG_ENABLED } from '../lib/config'

const SettingsRow = ({
  Icon,
  size = 24,
  color = '#020f1b',
  stroke = 1.5,
  label = null,
  tip = null,
  onPress = () => {}
}) => {
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress}>
      <View style={styles.settingsIcon}>
        {Icon && <Icon size={size} color={color} strokeWidth={stroke} />}
      </View>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsLabel}>{label}</Text>
        <Text style={styles.settingsTip}>{tip}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function SettingsScreen () {
  const { navigate, loading, setLoading } = useTransition()
  const [meData, setMeData] = useState({
    manager: false
  })

  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me } = User(authToken)

  useEffect(() => {
    setLoading(true)
  }, [])

  useEffect(() => {
    if (checkingAuth) return

    if (!isAuthenticated) {
      navigate('Signin')
    }
  }, [isAuthenticated, authToken, checkingAuth, navigate])

  const fetchUserData = async () => {
    if (!isAuthenticated || !authToken) {
      return
    }

    try {
      const { data } = await me()
      setMeData(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user data:', error)
      Alert.alert('Error', 'Failed to load user data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [authToken, isAuthenticated])

  // Refresh user data when screen is focused (e.g., returning from avatar screen)
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && authToken) {
        fetchUserData()
      }
    }, [isAuthenticated, authToken])
  )

  const handleProfilePress = () => {
    navigate('SettingsProfile')
  }

  const handleAvatarPress = () => {
    navigate('SettingsAvatar')
  }

  const handleUsernamePress = () => {
    navigate('SettingsUsername')
  }

  const handleFAQPress = () => {
    Linking.openURL(
      'https://getelevenapp.com/faq?utm_source=settings_page&utm_medium=app&utm_campaign=faq'
    )
  }

  const handleContactPress = async () => {
    const url = 'mailto:hello@getelevenapp.com'

    try {
      const supported = await Linking.canOpenURL(url)

      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert(
          'Email Not Available',
          'Please email us directly at hello@getelevenapp.com',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error opening email:', error)
      Alert.alert(
        'Email Not Available',
        'Please email us directly at hello@getelevenapp.com',
        [{ text: 'OK' }]
      )
    }
  }

  const handleDebugPress = () => {
    navigate('DebugSettings')
  }

  const handleSignOutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your Eleven account?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut()
              if (result.success) {
                navigate('Signin', { animation: 'slide_from_left' })
              } else {
                Alert.alert('Error', 'Failed to sign out. Please try again.')
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          }
        }
      ]
    )
  }

  if (checkingAuth || loading) {
    return <Loader />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* Header with Settings title and floating X */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Settings</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() =>
              navigate('Connections', { animation: 'slide_from_left' })
            }
          >
            <X size={20} color={Colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Settings Group */}
        <View style={styles.settingsGroup}>
          {/* User Avatar Section */}
          <View style={styles.avatarSection}>
            <ElevenAvatar
              src={replaceDomain(
                meData.avatar_url,
                'ik.imagekit.io/geteleven/tr:h-300'
              )}
              size={100}
              borderColor='#f1f5f9'
              borderWidth={2}
              showNameLabel={true}
              name={formatAvatarName(meData.first_name, meData.last_name)}
              borderRadius={15}
            />

            {/* User Bubbles - Only show for manager users */}
            {meData.manager && (
              <View style={styles.userBubbles}>
                {meData.username && (
                  <View style={styles.usernameBubble}>
                    <Text style={styles.usernameText}>@{meData.username}</Text>
                  </View>
                )}
                {meData.manager && (
                  <View style={styles.accountTypeBubble}>
                    <Text style={styles.accountTypeText}>Pro</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Settings List */}
          <View style={styles.settingsList}>
            <SettingsRow
              Icon={CircleUser}
              label='Your information'
              tip='Update your personal information.'
              onPress={handleProfilePress}
            />
            <SettingsRow
              Icon={Image}
              label='Avatar'
              tip='Upload or change your current profile picture.'
              onPress={handleAvatarPress}
            />
            {meData && meData.manager && (
              <SettingsRow
                Icon={AtSign}
                label='Username'
                tip='Alter your Eleven username and share link.'
                onPress={handleUsernamePress}
              />
            )}
            <SettingsRow
              Icon={MessageCircleQuestion}
              label='FAQ'
              tip='Frequently asked questions.'
              onPress={handleFAQPress}
            />
            <SettingsRow
              Icon={Send}
              label='Contact us'
              tip='Wanna chat? Toss us a line!'
              onPress={handleContactPress}
            />
            {DEBUG_ENABLED && (
              <SettingsRow
                Icon={Bug}
                label='Debug Settings'
                tip='Development tools for testing permissions and onboarding.'
                onPress={handleDebugPress}
              />
            )}
            <SettingsRow
              Icon={LogOut}
              label='Sign out'
              tip='Sign out of your Eleven account.'
              onPress={handleSignOutPress}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  scrollView: {
    paddingTop: 20,
    paddingBottom: 20
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 30
  },
  header: {
    fontSize: 24,
    fontWeight: '500',
    color: '#020617',
    fontFamily: 'Poppins_500Medium'
  },
  closeButton: {
    padding: 8
  },
  settingsGroup: {
    width: '100%',
    paddingHorizontal: 15
  },
  avatarSection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 10,
    width: '100%'
  },
  userBubbles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  usernameBubble: {
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 10
  },
  usernameText: {
    fontSize: 12,
    color: '#64748b'
  },
  accountTypeBubble: {
    backgroundColor: '#f0fdf4',
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  accountTypeText: {
    fontSize: 12,
    color: '#22c55e'
  },
  settingsList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    paddingHorizontal: 40
  },
  settingsRow: {
    width: '100%',
    flexDirection: 'row',
    marginTop: 30
  },
  settingsIcon: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    width: 40
  },
  settingsContent: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    width: '100%',
    flex: 1
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'left',
    width: '100%',
    color: Colors.foreground
  },
  settingsTip: {
    padding: 0,
    fontSize: 12,
    textAlign: 'left',
    width: '100%',
    color: Colors.copy
  }
})
