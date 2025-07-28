import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { TextStyles, Colors } from '../styles/fonts'

const ElevenAvatar = ({
  src,
  borderColor = '#f1f5f9',
  borderWidth = 2,
  borderRadius = 100,
  showNameLabel = true,
  name,
  onClick,
  newMessages = false,
  width,
  height
}) => {
  const avatarWidth = width || 170
  const avatarHeight = height || 218

  const defaultAvatar = `https://api.dicebear.com/9.x/thumbs/svg?shapeColor=94a3b8&backgroundColor=f8fafc&radius=${borderRadius}&eyes=variant8W16&mouth=variant2&scale=80&randomizeIds=true`

  const containerStyle = {
    width: avatarWidth,
    height: avatarHeight,
    alignItems: 'center'
  }

  const imageStyle = {
    width: avatarWidth,
    height: avatarHeight,
    borderRadius: borderRadius,
    borderWidth: borderWidth,
    borderColor: borderColor || '#f1f5f9'
  }

  const Component = onClick ? TouchableOpacity : View

  return (
    <Component style={[styles.container, containerStyle]} onPress={onClick}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: src || defaultAvatar }}
          style={imageStyle}
          contentFit='cover'
        />

        {/* Name label positioned at bottom left of image */}
        {showNameLabel && name && (
          <View style={styles.nameLabel}>
            <Text style={styles.nameText}>{name}</Text>
          </View>
        )}

        {/* New messages indicator */}
        {newMessages && <View style={styles.unreadIndicator} />}
      </View>
    </Component>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center'
  },
  imageContainer: {
    position: 'relative'
  },
  nameLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.40)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 28
  },
  nameText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '400'
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    backgroundColor: '#22c55e',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff'
  }
})

export default ElevenAvatar
