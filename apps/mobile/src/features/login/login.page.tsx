import { Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'

import { LoginForm } from '@/modules/identity/ui/components/LoginForm'
import { useSession } from '@/modules/identity/ui/hooks/use-session'
import { Screen } from '@/modules/shared/ui/components/Screen'

export const LoginPage = () => {
  const { signIn } = useSession()
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (email: string, password: string) => {
    setIsPending(true)
    setError(null)
    const result = await signIn({ email, password })
    setIsPending(false)
    if (result.ok) router.replace('/')
    else setError(result.error.message)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
      <Screen>
        <Text variant="title">Établi</Text>
        <Text tone="muted">
          Connectez-vous pour trouver un atelier près de vous, réserver une machine et pointer votre arrivée.
        </Text>
        <LoginForm onSubmit={(email, password) => void submit(email, password)} isPending={isPending} error={error} />
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, gap: spacing[0] },
})
