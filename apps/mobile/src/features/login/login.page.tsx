import { Button, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { Stack, useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'

import type { IdentityResult, Session } from '@/modules/identity/core/model/session'
import { LoginForm } from '@/modules/identity/ui/components/LoginForm'
import { RegisterForm } from '@/modules/identity/ui/components/RegisterForm'
import { useSession } from '@/modules/identity/ui/hooks/use-session'
import { Screen } from '@/modules/shared/ui/components/Screen'

export const LoginPage = () => {
  const { signIn, signUp } = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (pending: Promise<IdentityResult<Session>>) => {
    setIsPending(true)
    setError(null)
    const result = await pending
    setIsPending(false)
    if (!result.ok) return setError(result.error.message)
    return router.canGoBack() ? router.back() : router.replace('/')
  }

  const switchTo = (next: 'login' | 'register') => {
    setError(null)
    setMode(next)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
      <Stack.Screen options={{ title: mode === 'login' ? 'Connexion' : 'Créer un compte' }} />
      <Screen>
        <Text variant="title">Établi</Text>
        <Text tone="muted">
          Le compte sert à réserver et à pointer. Vous revenez ensuite exactement là où vous étiez.
        </Text>
        {mode === 'login' ? (
          <>
            <LoginForm
              onSubmit={(email, password) => void submit(signIn({ email, password }))}
              isPending={isPending}
              error={error}
            />
            <Button variant="ghost" onPress={() => switchTo('register')}>
              Pas encore de compte ? Créer un compte
            </Button>
          </>
        ) : (
          <>
            <RegisterForm onSubmit={(input) => void submit(signUp(input))} isPending={isPending} error={error} />
            <Button variant="ghost" onPress={() => switchTo('login')}>
              Déjà un compte ? Se connecter
            </Button>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: spacing[0] },
})
