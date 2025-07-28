import { useState, useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'

export default function navTransition () {
  const [loading, setLoading] = useState(false)
  const navigation = useNavigation()

  const navigate = useCallback(
    (screen, params) => {
      setLoading(true)
      // Convert web routes to screen names
      const screenMap = {
        '/connections': 'Connections',
        '/signup': 'Signup',
        '/signin': 'Signin',
        '/onboarding': 'Onboarding',
        '/settings': 'Settings',
        '/record': 'Record',
        ConnectionMessages: 'ConnectionMessages'
      }

      const screenName = screenMap[screen] || screen
      navigation.navigate(screenName, params)
      setLoading(false)
    },
    [navigation]
  )

  const back = useCallback(() => {
    setLoading(true)
    navigation.goBack()
    setLoading(false)
  }, [navigation])

  return { navigate, back, loading, setLoading }
}
