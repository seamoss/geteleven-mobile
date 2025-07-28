import React from 'react'
import { TextInput, StyleSheet } from 'react-native'
import { Colors, TextStyles } from '../styles/fonts'

const PhoneInput = ({
  value,
  onChangeText,
  placeholder = 'Enter your phone number',
  hasError = false,
  mask = null,
  countryCode = 'US',
  ...otherProps
}) => {
  const applyMask = (text, maskPattern) => {
    if (!maskPattern) return text

    // Remove all non-digits from input
    const digits = text.replace(/\D/g, '')

    // Don't apply mask if no digits
    if (digits.length === 0) return ''

    // Apply mask pattern
    let masked = ''
    let digitIndex = 0

    for (let i = 0; i < maskPattern.length && digitIndex < digits.length; i++) {
      if (maskPattern[i] === '_') {
        masked += digits[digitIndex]
        digitIndex++
      } else {
        masked += maskPattern[i]
      }
    }

    return masked
  }

  const getMaskForCountry = country => {
    const masks = {
      AR: '__________',
      CA: '(___) ___-____',
      CO: '__________',
      GB: '__________',
      HN: '__________',
      PH: '__________',
      MX: '__________',
      US: '(___) ___-____',
      EG: '__________',
      SA: '__________',
      IN: '__________',
      ZA: '__________',
      BE: '__________'
    }
    return masks[country] || '__________'
  }

  const handleTextChange = text => {
    const maskPattern = mask || getMaskForCountry(countryCode)
    const maskedText = applyMask(text, maskPattern)
    onChangeText(maskedText)
  }

  return (
    <TextInput
      style={[styles.input, hasError && styles.inputError]}
      value={value}
      onChangeText={handleTextChange}
      placeholder={placeholder}
      placeholderTextColor={Colors.copy}
      keyboardType='phone-pad'
      textContentType='telephoneNumber'
      autoComplete='tel'
      autoCorrect={false}
      maxLength={20} // Reasonable max length for phone numbers
      returnKeyType='done'
    />
  )
}

const styles = StyleSheet.create({
  input: {
    fontSize: TextStyles.buttonDark.fontSize, // Match button text size
    fontWeight: TextStyles.buttonDark.fontWeight,
    fontFamily: TextStyles.buttonDark.fontFamily,
    paddingHorizontal: 24, // Match button horizontal padding
    paddingVertical: 16, // Match button vertical padding (same height as buttons)
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    textAlign: 'left',
    width: '100%', // Full width instead of flex: 1
    color: Colors.foreground
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#ffe6e6'
  }
})

export default PhoneInput
