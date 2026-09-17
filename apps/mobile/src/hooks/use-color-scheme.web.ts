import { useSyncExternalStore } from 'react'
import { useColorScheme as useRNColorScheme } from 'react-native'

const subscribe = () => () => {}

/** Static rendering has no color scheme, so the server snapshot stays light until hydration. */
export function useColorScheme() {
  const colorScheme = useRNColorScheme()

  return useSyncExternalStore(
    subscribe,
    () => colorScheme,
    () => 'light' as const
  )
}
