import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { TextStyles, Colors } from '../styles/fonts'
import { scale } from '../utils/responsive'

const LoadMoreButton = ({
  onPress,
  loading = false,
  currentCount,
  totalCount,
  disabled = false
}) => {
  if (!totalCount || currentCount >= totalCount) {
    return null
  }

  const remainingCount = totalCount - currentCount

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonLoading,
          disabled && styles.buttonDisabled
        ]}
        onPress={onPress}
        disabled={loading || disabled}
      >
        {loading ? (
          <ActivityIndicator size='small' color={Colors.foreground} />
        ) : (
          <ChevronDown size={scale(16)} color={Colors.foreground} />
        )}
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Load more'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.countText}>
        Showing {currentCount} of {totalCount} messages
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: scale(0),
    paddingHorizontal: scale(0),
    marginTop: scale(-5)
  },
  button: {
    color: Colors.foreground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    minWidth: scale(140),
    justifyContent: 'center',
    marginBottom: scale(8)
  },
  buttonLoading: {
    opacity: 0.7
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    ...TextStyles.body,
    fontSize: scale(12),
    fontWeight: '500',
    color: Colors.foreground,
    marginLeft: scale(6)
  },
  countText: {
    ...TextStyles.caption,
    fontSize: scale(10),
    color: Colors.placeholder,
    textAlign: 'center'
  }
})

export default LoadMoreButton
