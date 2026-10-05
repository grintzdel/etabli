import { Button, Text, TextField } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import type { RegisterInput } from '../../core/model/session'

export type RegisterFormProps = {
  readonly onSubmit: (input: RegisterInput) => void
  readonly isPending: boolean
  readonly error: string | null
}

export const RegisterForm = ({ onSubmit, isPending, error }: RegisterFormProps) => {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <View style={styles.form}>
      <TextField
        label="Nom affiché"
        autoComplete="name"
        onChangeText={setDisplayName}
        placeholder="Jean Dupont"
        value={displayName}
      />
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
        autoComplete="new-password"
        onChangeText={setPassword}
        secureTextEntry
        value={password}
      />
      {error === null ? null : <Text tone="danger">{error}</Text>}
      <Button
        disabled={isPending}
        onPress={() => onSubmit({ displayName: displayName.trim(), email: email.trim(), password })}
      >
        {isPending ? 'Création…' : 'Créer mon compte'}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing[4] },
})
