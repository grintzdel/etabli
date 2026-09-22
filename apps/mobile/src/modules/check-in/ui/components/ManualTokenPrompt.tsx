import { Button, Surface, Text, TextField } from '@etabli/ui'
import { colors, spacing, withAlpha } from '@etabli/ui/tokens'
import { useEffect, useState } from 'react'
import { Modal, StyleSheet, useColorScheme, View } from 'react-native'

import { onManualTokenRequest } from '../../core/adapters/manual-token-request'

type Resolve = (token: string | null) => void

export const ManualTokenPrompt = () => {
  const [resolve, setResolve] = useState<Resolve | null>(null)
  const [token, setToken] = useState('')
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']

  useEffect(() => onManualTokenRequest((next) => setResolve(() => next)), [])

  const answer = (value: string | null) => {
    resolve?.(value)
    setResolve(null)
    setToken('')
  }

  return (
    <Modal animationType="fade" onRequestClose={() => answer(null)} transparent visible={resolve !== null}>
      <View style={[styles.backdrop, { backgroundColor: withAlpha(palette.graphite[950], 0.8) }]}>
        <Surface style={styles.sheet}>
          <View style={styles.body}>
            <Text variant="label">Saisie du code</Text>
            <Text tone="muted">
              Cet appareil ne sait pas scanner. Saisissez le code écrit sous le QR de la machine pour poursuivre le
              pointage.
            </Text>
            <TextField
              autoCapitalize="none"
              label="Code de la machine"
              onChangeText={setToken}
              placeholder="qr-forge-laser-01"
              value={token}
            />
            <View style={styles.actions}>
              <Button variant="ghost" onPress={() => answer(null)}>
                Annuler
              </Button>
              <Button onPress={() => answer(token)}>Pointer</Button>
            </View>
          </View>
        </Surface>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing[3], justifyContent: 'flex-end' },
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing[5] },
  body: { gap: spacing[4] },
  sheet: { width: '100%' },
})
