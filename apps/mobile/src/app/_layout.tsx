import { colors } from '@etabli/ui/tokens'
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold, useFonts } from '@expo-google-fonts/barlow-condensed'
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

import { SessionProvider } from '@/modules/identity/ui/components/SessionProvider'
import { useSession } from '@/modules/identity/ui/hooks/use-session'
import { ManualTagPrompt } from '@/modules/nfc/ui/components/ManualTagPrompt'

void SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

const RootNavigator = () => {
  const { state } = useSession()
  const scheme = useColorScheme() === 'light' ? 'light' : 'dark'
  const palette = colors[scheme]
  const base = scheme === 'light' ? DefaultTheme : DarkTheme

  useEffect(() => {
    if (state.status !== 'loading') void SplashScreen.hideAsync()
  }, [state.status])

  if (state.status === 'loading') return null

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: palette.graphite[950],
          border: palette.graphite[800],
          card: palette.graphite[900],
          primary: palette.signal[500],
          text: palette.graphite[50],
        },
      }}
    >
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <Stack>
        <Stack.Protected guard={state.status === 'authenticated'}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="ateliers/[slug]" options={{ title: 'Atelier' }} />
          <Stack.Screen name="machines/[id]" options={{ title: 'Machine' }} />
          <Stack.Screen name="bookings/[id]" options={{ title: 'Réservation' }} />
        </Stack.Protected>
        <Stack.Protected guard={state.status === 'anonymous'}>
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  })

  if (!fontsLoaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator />
        <ManualTagPrompt />
      </SessionProvider>
    </QueryClientProvider>
  )
}
