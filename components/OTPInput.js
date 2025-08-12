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
    else if (numericText.length > 1) {
      // Get remaining slots from current position
      const remainingSlots = 4 - index
      const pastedDigits = numericText.slice(0, remainingSlots).split('')
      
      // Create new digits array keeping existing values before paste position
      const newDigits = [...digits]
      
      // Fill from current position onwards
      pastedDigits.forEach((digit, i) => {
        if (index + i < 4) {
          newDigits[index + i] = digit
        }
      })
      
      setDigits(newDigits)
      onChangeText(newDigits.join(''))

      // Focus the next empty box after pasted content or last box
      const lastFilledIndex = Math.min(index + pastedDigits.length - 1, 3)
      const nextEmptyIndex = newDigits.findIndex((digit, i) => i > lastFilledIndex && digit === '')
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(lastFilledIndex + 1, 3)
      
      if (focusIndex < 4) {
        inputRefs.current[focusIndex]?.focus()
        setFocusedIndex(focusIndex)
      }
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
    gap: 10,
    marginBottom: 50
  },
  input: {
    width: 55,
    height: 55,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: TextStyles.buttonDark.fontFamily,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
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
