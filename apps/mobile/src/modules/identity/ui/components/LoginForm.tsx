import { Button, Text, TextField } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

export type LoginFormProps = {
  readonly onSubmit: (email: string, password: string) => void
  readonly isPending: boolean
  readonly error: string | null
}

export const LoginForm = ({ onSubmit, isPending, error }: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <View style={styles.form}>
      <TextField
        label="Adresse e-mail"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="jean@example.org"
        value={email}
      />
      <TextField
        label="Mot de passe"
        autoCapitalize="none"
        autoComplete="current-password"
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      {error === null ? null : <Text tone="danger">{error}</Text>}
      <Button disabled={isPending} onPress={() => onSubmit(email.trim(), password)}>
        {isPending ? 'Connexion…' : 'Se connecter'}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
})
