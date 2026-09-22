import { Button, Text } from '@etabli/ui'
import { colors, spacing, withAlpha } from '@etabli/ui/tokens'
import { CameraView } from 'expo-camera'
import { useEffect, useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'

import { onCameraScanRequest } from '../../core/adapters/camera-scan-request'

type Resolve = (token: string | null) => void

export const QrScannerSheet = () => {
  const [resolve, setResolve] = useState<Resolve | null>(null)
  const palette = colors.dark

  useEffect(() => onCameraScanRequest((next) => setResolve(() => next)), [])

  const answer = (value: string | null) => {
    resolve?.(value)
    setResolve(null)
  }

  return (
    <Modal animationType="slide" onRequestClose={() => answer(null)} visible={resolve !== null}>
      <View style={[styles.screen, { backgroundColor: palette.graphite[950] }]}>
        {resolve === null ? null : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => answer(data)}
          />
        )}

        <View style={[styles.frame, { borderColor: palette.signal[500] }]} />

        <View style={[styles.footer, { backgroundColor: withAlpha(palette.graphite[950], 0.85) }]}>
          <Text tone="muted">Cadrez le QR code collé sur la machine.</Text>
          <Button variant="ghost" onPress={() => answer(null)}>
            Annuler
          </Button>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  footer: { bottom: 0, gap: spacing[3], left: 0, padding: spacing[5], position: 'absolute', right: 0 },
  frame: {
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: spacing[3],
    borderWidth: 2,
    marginTop: '40%',
    width: '70%',
  },
  screen: { flex: 1 },
})
