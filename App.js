import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { initializeAudioMode } from './utils/audioUtils'
import { initializeAutoUpdates } from './utils/updateUtils'
import { useFonts } from 'expo-font'
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

export default function App () {
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
    initializeAudioMode()
    initializeAutoUpdates()
  }, [])

  if (!fontsLoaded) {
    return null // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName='Home'
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fff' }
        }}
      >
        <Stack.Screen name='Home' component={HomeScreen} />
        <Stack.Screen name='Signup' component={SignupScreen} />
        <Stack.Screen name='Signin' component={SigninScreen} />
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
        <Stack.Screen name='Connections' component={ConnectionsScreen} />
        <Stack.Screen
          name='ConnectionMessages'
          component={ConnectionMessagesScreen}
        />
        <Stack.Screen name='Settings' component={SettingsScreen} />
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
