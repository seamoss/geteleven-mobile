import React, { useEffect, useState, useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Linking from 'expo-linking'
import { initializeAudioMode } from './utils/audioUtils'
import { initializeAutoUpdates } from './utils/updateUtils'
import { useFonts } from 'expo-font'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter'
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins'

import HomeScreen from './screens/HomeScreen'
import SignupScreen from './screens/SignupScreen'
import SigninScreen from './screens/SigninScreen'
import ConnectionsScreen from './screens/ConnectionsScreen'
import ConnectionMessagesScreen from './screens/ConnectionMessagesScreen'
import SettingsScreen from './screens/SettingsScreen'
import SettingsAvatarScreen from './screens/SettingsAvatarScreen'
import SettingsProfileScreen from './screens/SettingsProfileScreen'
import SettingsUsernameScreen from './screens/SettingsUsernameScreen'
import DebugSettingsScreen from './screens/DebugSettingsScreen'
import OnboardingWelcomeScreen from './screens/OnboardingWelcomeScreen'
import OnboardingPermissionsScreen from './screens/OnboardingPermissionsScreen'
import OnboardingTourScreen from './screens/OnboardingTourScreen'
import OnboardingProfileScreen from './screens/OnboardingProfileScreen'
import OnboardingPhotoScreen from './screens/OnboardingPhotoScreen'
import OnboardingPreviewScreen from './screens/OnboardingPreviewScreen'

const Stack = createNativeStackNavigator()

const linking = {
  prefixes: [
    Linking.createURL('/'),
    'eleven://',
    'https://getelevenapp.com',
    'https://www.getelevenapp.com'
  ],
  config: {
    screens: {
      Home: {
        path: 'home',
        parse: {
          recordForUserId: (userId) => ({ recordForUserId: userId })
        }
      },
      ConnectionMessages: {
        path: 'profile/:connectionId',
        parse: {
          connectionId: (connectionId) => connectionId,
          autoRecord: () => true
        }
      }
    }
  }
}

export default function App () {
  const navigationRef = useRef()
  const [isReady, setIsReady] = useState(false)
  const [initialUrl, setInitialUrl] = useState(null)
  
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
  })

  // Initialize audio mode and auto-updates for production builds
  useEffect(() => {
    initializeAutoUpdates()
    initializeAudioMode()
    
    // Get initial URL if app was opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        setInitialUrl(url)
      }
    })
    
    // Listen for URL changes while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink)
    
    return () => {
      subscription.remove()
    }
  }, [])
  
  const handleDeepLink = (event) => {
    if (navigationRef.current && isReady) {
      const parsed = Linking.parse(event.url)
      
      // Extract connectionId from the URL path
      if (parsed.path && parsed.path.includes('profile/')) {
        const connectionId = parsed.path.split('profile/')[1]
        if (connectionId) {
          navigateToRecording(connectionId)
        }
      }
    }
  }
  
  const navigateToRecording = async (connectionId) => {
    // Check if user is logged in
    const authToken = await AsyncStorage.getItem('authToken')
    
    if (!authToken) {
      // Navigate to signup first (supports both new and existing users), then to recording
      navigationRef.current?.navigate('Signup', { 
        redirectTo: 'ConnectionMessages',
        redirectParams: { 
          connectionId: connectionId, 
          autoRecord: true 
        }
      })
    } else {
      // Navigate directly to ConnectionMessages with autoRecord flag
      navigationRef.current?.navigate('ConnectionMessages', {
        connectionId: connectionId,
        autoRecord: true
      })
    }
  }

  if (!fontsLoaded) {
    return null // Or a loading screen
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        setIsReady(true)
        // Handle initial URL if app was opened from deep link
        if (initialUrl) {
          handleDeepLink({ url: initialUrl })
        }
      }}
    >
      <Stack.Navigator
        initialRouteName='Home'
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' }
        }}
      >
        <Stack.Screen
          name='Home'
          component={HomeScreen}
          options={({ route }) => {
            const animation = route.params?.animation || 'slide_from_right'
            return { animation }
          }}
        />
        <Stack.Screen name='Signup' component={SignupScreen} />
        <Stack.Screen
          name='Signin'
          component={SigninScreen}
          options={({ route }) => {
            const animation = route.params?.animation || 'slide_from_right'
            return { animation }
          }}
        />
        <Stack.Screen
          name='OnboardingWelcome'
          component={OnboardingWelcomeScreen}
        />
        <Stack.Screen
          name='OnboardingPermissions'
          component={OnboardingPermissionsScreen}
        />
        <Stack.Screen name='OnboardingTour' component={OnboardingTourScreen} />
        <Stack.Screen
          name='OnboardingProfile'
          component={OnboardingProfileScreen}
        />
        <Stack.Screen
          name='OnboardingPhoto'
          component={OnboardingPhotoScreen}
        />
        <Stack.Screen
          name='OnboardingPreview'
          component={OnboardingPreviewScreen}
        />
        <Stack.Screen
          name='Connections'
          component={ConnectionsScreen}
          options={({ route }) => {
            const animation = route.params?.animation || 'slide_from_right'
            return { animation }
          }}
        />
        <Stack.Screen
          name='ConnectionMessages'
          component={ConnectionMessagesScreen}
        />
        <Stack.Screen
          name='Settings'
          component={SettingsScreen}
          options={({ route }) => {
            const animation = route.params?.animation || 'slide_from_right'
            return { animation }
          }}
        />
        <Stack.Screen name='SettingsAvatar' component={SettingsAvatarScreen} />
        <Stack.Screen
          name='SettingsProfile'
          component={SettingsProfileScreen}
        />
        <Stack.Screen
          name='SettingsUsername'
          component={SettingsUsernameScreen}
        />
        <Stack.Screen name='DebugSettings' component={DebugSettingsScreen} />
      </Stack.Navigator>
      <StatusBar style='auto' />
    </NavigationContainer>
  )
}
