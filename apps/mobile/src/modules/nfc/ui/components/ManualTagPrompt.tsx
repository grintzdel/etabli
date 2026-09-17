import { Button, Surface, Text, TextField } from '@etabli/ui'
import { colors, spacing, withAlpha } from '@etabli/ui/tokens'
import { useEffect, useState } from 'react'
import { Modal, StyleSheet, useColorScheme, View } from 'react-native'

import { onManualTagRequest } from '../../core/adapters/manual-tag-request'

type Resolve = (tag: string | null) => void

export const ManualTagPrompt = () => {
  const [resolve, setResolve] = useState<Resolve | null>(null)
  const [tag, setTag] = useState('')
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']

  useEffect(() => onManualTagRequest((next) => setResolve(() => next)), [])

  const answer = (value: string | null) => {
    resolve?.(value)
    setResolve(null)
    setTag('')
  }

  return (
    <Modal animationType="fade" onRequestClose={() => answer(null)} transparent visible={resolve !== null}>
      <View style={[styles.backdrop, { backgroundColor: withAlpha(palette.graphite[950], 0.8) }]}>
        <Surface style={styles.sheet}>
          <View style={styles.body}>
            <Text variant="label">Saisie du tag</Text>
            <Text tone="muted">
              Ce téléphone ne lit pas de tag NFC. Saisissez l’identifiant écrit sur la machine pour poursuivre le
              pointage.
            </Text>
            <TextField
              autoCapitalize="none"
              label="Identifiant du tag"
              onChangeText={setTag}
              placeholder="04:A2:24:B1"
              value={tag}
            />
            <View style={styles.actions}>
              <Button variant="ghost" onPress={() => answer(null)}>
                Annuler
              </Button>
              <Button onPress={() => answer(tag)}>Pointer</Button>
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
