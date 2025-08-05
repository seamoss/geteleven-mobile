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
import { useFocusEffect } from '@react-navigation/native'
import { X } from 'lucide-react-native'
import { authCheck } from '../lib/auth'
import User from '../hooks/user'
import { api } from '../lib/api'
import { TextStyles, Colors } from '../styles/fonts'

const SettingsProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [originalFirstName, setOriginalFirstName] = useState('')
  const [originalLastName, setOriginalLastName] = useState('')

  const { isAuthenticated, authToken, checkingAuth } = authCheck()
  const { me } = User(authToken)

  useEffect(() => {
    if (checkingAuth) return

    if (!isAuthenticated) {
      navigation.navigate('Signin')
    }
  }, [isAuthenticated, authToken, checkingAuth, navigation])

  const fetchUserData = async () => {
    if (!isAuthenticated || !authToken) {
      return
    }

    setHasError(false)

    try {
      const { data } = await me()

      console.log('Profile data fetched:', data) // Debug log

      // Set the data, handling null/undefined values
      setFirstName(data.first_name || '')
      setLastName(data.last_name || '')
      setOriginalFirstName(data.first_name || '')
      setOriginalLastName(data.last_name || '')
      setLoading(false)
    } catch (error) {
      console.error('Error fetching profile data:', error)
      setHasError(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [authToken, isAuthenticated])

  // Refresh user data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated && authToken) {
        fetchUserData()
      }
    }, [isAuthenticated, authToken])
  )

  const saveProfile = async () => {
    setHasError(false)
    setLoading(true)

    try {
      await api(
        'put',
        '/users/me/profile',
        {
          firstName,
          lastName
        },
        authToken
      )

      navigation.navigate('Settings')
    } catch (error) {
      setHasError(true)
      setLoading(false)
      Alert.alert(
        'Error',
        'Failed to save profile information. Please try again.'
      )
    }
  }

  const handleFirstNameChange = text => {
    setFirstName(text)
  }

  const handleLastNameChange = text => {
    setLastName(text)
  }

  // Check if profile has changed from original values
  const hasProfileChanged =
    firstName !== originalFirstName || lastName !== originalLastName

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
        <Text style={styles.headerTitle}>Your information</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() =>
            navigation.navigate('Settings', { animation: 'slide_from_left' })
          }
        >
          <X size={20} color={Colors.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Let's get to know you a little better so your connections will also
          know who you are.
        </Text>

        <View style={styles.formContainer}>
          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={firstName}
            onChangeText={handleFirstNameChange}
            placeholder="What's your first name?"
            placeholderTextColor='#94A3B8'
            autoCapitalize='words'
          />

          <TextInput
            style={[styles.input, hasError && styles.inputError]}
            value={lastName}
            onChangeText={handleLastNameChange}
            placeholder="What's your last name?"
            placeholderTextColor='#94A3B8'
            autoCapitalize='words'
          />
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!firstName || !lastName || loading || !hasProfileChanged) &&
              styles.saveButtonDisabled
          ]}
          onPress={saveProfile}
          disabled={!firstName || !lastName || loading || !hasProfileChanged}
        >
          <Text
            style={[
              styles.saveButtonText,
              (!firstName || !lastName || loading || !hasProfileChanged) &&
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

export default SettingsProfileScreen
