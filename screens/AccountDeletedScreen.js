import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { TextStyles, Colors, ComponentStyles } from '../styles/fonts'
import useTransition from '../hooks/transition'

export default function AccountDeletedScreen () {
  const { navigate } = useTransition()

  const handleHomePress = () => {
    navigate('Home', { animation: 'slide_from_left' })
  }

  const openSubscriptionSettings = () => {
    if (Platform.OS === 'ios') {
      // iOS subscription management URL
      Linking.openURL('https://apps.apple.com/account/subscriptions')
    } else {
      // Android subscription management URL
      Linking.openURL('https://play.google.com/store/account/subscriptions')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with title and floating X */}
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Account Deleted</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Important: Cancel Your Subscription
            </Text>

            <Text style={styles.instructions}>
              If you had an active subscription, you need to cancel it through
              your device settings to avoid future charges.
            </Text>

            {Platform.OS === 'ios' ? (
              <View style={styles.steps}>
                <Text style={styles.step}>1. Open Settings on your device</Text>
                <Text style={styles.step}>2. Tap your name at the top</Text>
                <Text style={styles.step}>3. Tap Subscriptions</Text>
                <Text style={styles.step}>4. Find and tap Eleven</Text>
                <Text style={styles.step}>5. Tap Cancel Subscription</Text>
              </View>
            ) : (
              <View style={styles.steps}>
                <Text style={styles.step}>1. Open Google Play Store</Text>
                <Text style={styles.step}>2. Tap your profile icon</Text>
                <Text style={styles.step}>3. Tap Payments & subscriptions</Text>
                <Text style={styles.step}>4. Tap Subscriptions</Text>
                <Text style={styles.step}>5. Find and tap Eleven</Text>
                <Text style={styles.step}>6. Tap Cancel subscription</Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                ComponentStyles.button,
                ComponentStyles.buttonLight,
                styles.subscriptionButton
              ]}
              onPress={openSubscriptionSettings}
            >
              <Text style={styles.lightButtonText}>
                Open Subscription Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[ComponentStyles.button, ComponentStyles.buttonDark]}
          onPress={handleHomePress}
        >
          <Text style={styles.darkButtonText}>Home</Text>
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20
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
  content: {
    padding: 20,
    paddingTop: 0
  },
  section: {
    marginBottom: 30
  },
  sectionTitle: {
    ...TextStyles.h3,
    marginBottom: 15,
    color: Colors.foreground
  },
  instructions: {
    ...TextStyles.body,
    marginBottom: 20,
    lineHeight: 24,
    color: Colors.copy
  },
  subheading: {
    ...TextStyles.bodyBold,
    marginBottom: 15,
    color: Colors.foreground
  },
  steps: {
    marginLeft: 10,
    marginBottom: 20
  },
  step: {
    ...TextStyles.body,
    marginBottom: 10,
    lineHeight: 22,
    color: Colors.copy
  },
  subscriptionButton: {
    marginTop: 10
  },
  lightButtonText: {
    ...TextStyles.button,
    color: Colors.foreground
  },
  darkButtonText: {
    ...TextStyles.button,
    color: '#fff'
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20
  }
})
