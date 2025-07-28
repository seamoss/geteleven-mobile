import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native'
import { X } from 'lucide-react-native'
import { authCheck } from '../lib/auth'
import User from '../hooks/user'
import { api } from '../lib/api'
import { TextStyles, Colors } from '../styles/fonts'

const SettingsUsernameScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [username, setUsername] = useState('')
  const [originalUsername, setOriginalUsername] = useState('')

  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me } = User(authToken)

  useEffect(() => {
    if (checkingAuth) return

    if (!isAuthenticated) {
      navigation.navigate('Signin')
    }
  }, [isAuthenticated, authToken, checkingAuth, navigation])

  useEffect(() => {
    if (!isAuthenticated) return

    async function fetchData () {
      setHasError(false)

      try {
        const { data } = await me()

        // Check if user is a manager/pro user
        if (!data.manager) {
          // Redirect back to settings if not a pro user
          navigation.navigate('Settings')
          return
        }

        const currentUsername = data.username || ''
        setUsername(currentUsername)
        setOriginalUsername(currentUsername)
        setLoading(false)
      } catch (error) {
        setHasError(true)
        setLoading(false)
      }
    }

    fetchData()
  }, [authToken, isAuthenticated, navigation])

  const saveUsername = async () => {
    setHasError(false)
    setLoading(true)

    try {
      await api(
        'put',
        '/users/me/username',
        {
          username
        },
        authToken
      )

      navigation.navigate('Settings')
    } catch (error) {
      setHasError(true)
      setLoading(false)
      Alert.alert(
        'Error',
        'Failed to save username. This username may already be taken.'
      )
    }
  }

  const handleUsernameChange = text => {
    // Apply the same formatting logic as the web app
    const formattedUsername = text
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .toLowerCase()

    setUsername(formattedUsername)
  }

  // Check if username has changed from original
  const hasUsernameChanged = username !== originalUsername

  if (checkingAuth || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle='dark-content' />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your username</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <X size={20} color={Colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Share in style with your unique piece of Eleven real estate.
        </Text>

        <View style={styles.formContainer}>
          <View
            style={[
              styles.urlInputContainer,
              hasError && styles.urlInputContainerError
            ]}
          >
            <Text style={styles.urlPrefix}>eleven.direct/@</Text>
            <TextInput
              style={styles.urlInput}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder='username'
              placeholderTextColor='#94A3B8'
              maxLength={16}
              autoCapitalize='none'
              autoCorrect={false}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!username || loading || !hasUsernameChanged) &&
              styles.saveButtonDisabled
          ]}
          onPress={saveUsername}
          disabled={!username || loading || !hasUsernameChanged}
        >
          <Text
            style={[
              styles.saveButtonText,
              (!username || loading || !hasUsernameChanged) &&
                styles.saveButtonTextDisabled
            ]}
          >
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter_400Regular'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.foreground,
    fontFamily: 'Poppins_500Medium'
  },
  closeButton: {
    padding: 8
  },
  content: {
    flex: 1,
    paddingHorizontal: 15
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'Inter_400Regular'
  },
  formContainer: {
    marginBottom: 32
  },
  urlInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingLeft: 16,
    marginBottom: 16
  },
  urlInputContainerError: {
    borderColor: '#EF4444'
  },
  urlPrefix: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    marginRight: 0
  },
  urlInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 16,
    fontSize: 16,
    color: '#020617',
    fontFamily: 'Inter_400Regular'
  },
  buttonGroup: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 20,
    paddingHorizontal: 15
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#020617',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
    backgroundColor: '#fff'
  },
  inputError: {
    borderColor: '#EF4444'
  },
  urlPreview: {
    paddingHorizontal: 6,
    paddingVertical: 8
  },
  urlPreviewText: {
    fontSize: 12,
    color: '#020617',
    fontFamily: 'Inter_400Regular'
  },
  urlPreviewBold: {
    fontWeight: '700',
    fontFamily: 'Inter_700Bold'
  },
  saveButton: {
    backgroundColor: Colors.foreground,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 5
  },
  saveButtonDisabled: {
    backgroundColor: Colors.border
  },
  saveButtonText: {
    ...TextStyles.buttonDark
  },
  saveButtonTextDisabled: {
    color: Colors.placeholder
  }
})

export default SettingsUsernameScreen
