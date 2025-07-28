import React, { useRef, useState, useEffect } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { Colors, TextStyles } from '../styles/fonts'

const OTPInput = ({ value, onChangeText, hasError = false }) => {
  const inputRefs = useRef([])
  const [digits, setDigits] = useState(['', '', '', ''])
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Initialize refs
  const initializeRefs = (ref, index) => {
    inputRefs.current[index] = ref
  }

  const handleTextChange = (text, index) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '')

    // Handle single digit input
    if (numericText.length === 1) {
      const newDigits = [...digits]
      newDigits[index] = numericText
      setDigits(newDigits)

      // Update parent component with full value
      const fullValue = newDigits.join('')
      onChangeText(fullValue)

      // Auto-focus next input if not the last box
      if (index < 3) {
        inputRefs.current[index + 1]?.focus()
        setFocusedIndex(index + 1)
      }
    }
    // Handle multiple digits (paste scenario)
    else if (numericText.length > 1 && index === 0) {
      const newDigits = numericText.slice(0, 4).split('')
      // Pad with empty strings if less than 4 digits
      while (newDigits.length < 4) {
        newDigits.push('')
      }
      setDigits(newDigits)
      onChangeText(newDigits.join(''))

      // Focus the next empty box or last box
      const nextEmptyIndex = newDigits.findIndex(digit => digit === '')
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 3
      inputRefs.current[focusIndex]?.focus()
      setFocusedIndex(focusIndex)
    }
    // Handle empty input (deletion)
    else if (numericText.length === 0) {
      const newDigits = [...digits]
      newDigits[index] = ''
      setDigits(newDigits)
      onChangeText(newDigits.join(''))
    }
  }

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace') {
      if (digits[index] === '' && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus()
        setFocusedIndex(index - 1)
      } else if (digits[index] !== '') {
        // Clear current input but stay focused
        const newDigits = [...digits]
        newDigits[index] = ''
        setDigits(newDigits)
        onChangeText(newDigits.join(''))
      }
    }
  }

  const handleFocus = index => {
    setFocusedIndex(index)
  }

  // Update digits when value prop changes (for clearing or external updates)
  useEffect(() => {
    if (value === '') {
      setDigits(['', '', '', ''])
      setFocusedIndex(0)
      inputRefs.current[0]?.focus()
    } else if (value.length <= 4) {
      const newDigits = [...value.split(''), '', '', ''].slice(0, 4)
      setDigits(newDigits)
    }
  }, [value])

  return (
    <View style={styles.container}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={ref => initializeRefs(ref, index)}
          style={[
            styles.input,
            hasError && styles.inputError,
            digit !== '' && styles.inputFilled
          ]}
          value={digit}
          onChangeText={text => handleTextChange(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType='number-pad'
          maxLength={1}
          textAlign='center'
          selectTextOnFocus={true}
          autoFocus={index === 0}
          returnKeyType={index < 3 ? 'next' : 'done'}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 75
  },
  input: {
    width: 65,
    height: 80,
    fontSize: 55,
    fontWeight: '600',
    fontFamily: TextStyles.buttonDark.fontFamily,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundColor: Colors.white,
    textAlign: 'center',
    color: Colors.foreground
  },
  inputFilled: {
    borderColor: Colors.foreground
    // backgroundColor: Colors.background
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: '#ffe6e6'
  }
})

export default OTPInput
