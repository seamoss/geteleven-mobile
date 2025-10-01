import { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'

export default function navTransition () {
  const navigation = useNavigation()

  const navigate = useCallback(
    (screen, params) => {
      // Convert web routes to screen names
      const screenMap = {
        '/connections': 'Connections',
        '/signup': { screen: 'Auth', params: { mode: 'signup', ...params } },
        '/signin': { screen: 'Auth', params: { mode: 'signin', ...params } },
        '/onboarding': 'Onboarding',
        '/settings': 'Settings',
        '/record': 'Record',
        ConnectionMessages: 'ConnectionMessages'
      }

      const mapping = screenMap[screen] || screen

      if (typeof mapping === 'object') {
        navigation.navigate(mapping.screen, mapping.params)
      } else {
        navigation.navigate(mapping, params)
      }
    },
    [navigation]
  )

  const back = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  return { navigate, back }
}
