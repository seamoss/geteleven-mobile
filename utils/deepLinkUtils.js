import * as Linking from 'expo-linking'

export const generateProfileLink = (userId, useUniversalLink = true) => {
  if (useUniversalLink) {
    return `https://getelevenapp.com/profile/${userId}`
  }
  return `eleven://profile/${userId}`
}

export const testDeepLink = async userId => {
  const url = generateProfileLink(userId)
  const canOpen = await Linking.canOpenURL(url)

  if (canOpen) {
    await Linking.openURL(url)
    return true
  }

  return false
}

export const getDeepLinkInfo = () => {
  return {
    universalLinks: [
      'https://getelevenapp.com/profile/[userId]',
      'https://www.getelevenapp.com/profile/[userId]'
    ],
    customScheme: 'eleven://profile/[userId]',
    examples: {
      universal:
        'https://getelevenapp.com/profile/aef7671d-008c-4677-8e30-d39228f29f32',
      scheme: 'eleven://profile/aef7671d-008c-4677-8e30-d39228f29f32'
    }
  }
}
