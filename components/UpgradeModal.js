import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X, RotateCw } from 'lucide-react-native'

import { TextStyles, Colors } from '../styles/fonts'
import { getResponsiveSpacing, scale } from '../utils/responsive'
import useSubscription from '../hooks/useSubscription'

export default function UpgradeModal ({ visible, onClose, onSuccess }) {
  const [selectedPlan, setSelectedPlan] = useState('yearly')
  const {
    isLoading,
    hasActiveSubscription,
    monthlyPackage,
    yearlyPackage,
    monthlyPrice,
    yearlyPrice,
    purchaseSubscription,
    restoreSubscription,
    isEnabled,
    isInitialized
  } = useSubscription()

  useEffect(() => {
    // If user already has active subscription, close modal
    if (hasActiveSubscription && visible) {
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    }
  }, [hasActiveSubscription, visible])

  const handleContinueToPayment = async () => {
    const purchase = await purchaseSubscription(selectedPlan)
    if (purchase) {
      onClose()
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  const handleRestore = async () => {
    await restoreSubscription()
  }

  return (
    <Modal
      animationType='slide'
      transparent={false}
      visible={visible}
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderContent}>
            <View style={styles.upgradeBadge}>
              <Text style={styles.upgradeBadgeText}>UPGRADE</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={Colors.foreground} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.modalBody}>
            <Text style={styles.headline}>Well aren't you popular!</Text>
            <Text style={styles.subtitle}>Unlock unlimited invites.</Text>

            <View style={styles.pricingOptions}>
              {/* Monthly Option */}
              <TouchableOpacity
                style={[
                  styles.pricingOption,
                  selectedPlan === 'monthly' && styles.selectedOption
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>
                    {monthlyPrice || '$18.99'} / month
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Yearly Option */}
              <TouchableOpacity
                style={[
                  styles.pricingOption,
                  selectedPlan === 'yearly' && styles.selectedOption
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.yearlyOptionWrapper}>
                  <View style={styles.freeMonthsBadge}>
                    <Text style={styles.freeMonthsText}>2 MONTHS FREE</Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.planName}>Yearly</Text>
                    <Text style={styles.planPrice}>
                      {yearlyPrice || '$187.99'} / year
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isLoading}
            >
              <RotateCw size={16} color={Colors.copy} strokeWidth={2} />
              <Text style={styles.restoreButtonText}>Restore purchases</Text>
            </TouchableOpacity>

            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>
                <Text
                  style={styles.linkText}
                  onPress={() =>
                    Linking.openURL('https://getelevenapp.com/privacy')
                  }
                >
                  Privacy Policy
                </Text>
                {' - '}
                <Text
                  style={styles.linkText}
                  onPress={() =>
                    Linking.openURL(
                      'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'
                    )
                  }
                >
                  Terms of Use
                </Text>
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                isLoading && styles.disabledButton
              ]}
              onPress={handleContinueToPayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color='#ffffff' />
              ) : (
                <Text style={styles.continueButtonText}>
                  Continue to payment
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },
  modalHeader: {
    borderBottomWidth: 0
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    // paddingBottom: 10,
    paddingHorizontal: getResponsiveSpacing.horizontalPadding
  },
  upgradeBadge: {
    backgroundColor: Colors.foreground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  upgradeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  closeButton: {
    padding: 8
  },
  modalBody: {
    flex: 1,
    paddingTop: 30
  },
  headline: {
    ...TextStyles.title,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.foreground
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 16,
    color: Colors.copy,
    marginBottom: 40
  },
  pricingOptions: {
    gap: 16,
    marginBottom: 40
  },
  pricingOption: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#ffffff'
  },
  selectedOption: {
    borderColor: Colors.foreground,
    backgroundColor: '#ffffff'
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  yearlyOptionWrapper: {
    position: 'relative',
    paddingTop: 5
  },
  freeMonthsBadge: {
    position: 'absolute',
    top: -28,
    left: -2,
    backgroundColor: Colors.foreground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  freeMonthsText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  planName: {
    ...TextStyles.body,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.foreground
  },
  planPrice: {
    ...TextStyles.body,
    fontSize: 16,
    color: Colors.copy
  },
  continueButton: {
    backgroundColor: Colors.foreground,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  disabledButton: {
    opacity: 0.6
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0
  },
  restoreButtonText: {
    color: Colors.copy,
    fontSize: 14,
    fontWeight: '500'
  },
  legalContainer: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    paddingHorizontal: scale(20),
    alignItems: 'center'
  },
  legalText: {
    ...TextStyles.body,
    fontSize: scale(13),
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(16)
  },
  linkText: {
    color: Colors.darkButton,
    textDecorationLine: 'underline'
  }
})
