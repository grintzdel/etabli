import { Button, StatusBadge, Surface, Text } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

import { Notice } from '../../../shared/ui/components/Notice'
import { isRequestable, MY_STATUS_LABELS, MY_STATUS_TONES, type MyCertification } from '../../core/model/certification'

export type CertificationListProps = {
  readonly certifications: ReadonlyArray<MyCertification>
  readonly requestedMachineId: string | null
  readonly onRequest: (machineId: string) => void
}

export const CertificationList = ({ certifications, requestedMachineId, onRequest }: CertificationListProps) =>
  certifications.length === 0 ? (
    <Notice message="Aucune machine de vos ateliers ne demande d’habilitation pour l’instant." />
  ) : (
    <View style={styles.list}>
      {certifications.map((certification) => (
        <Surface key={certification.machineId}>
          <View style={styles.body}>
            <Text variant="label">{certification.machineName}</Text>
            <Text tone="muted">{certification.atelierName}</Text>
            <View style={styles.footer}>
              <StatusBadge
                tone={MY_STATUS_TONES[certification.status]}
                label={MY_STATUS_LABELS[certification.status]}
              />
              {isRequestable(certification.status) ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={requestedMachineId === certification.machineId}
                  onPress={() => onRequest(certification.machineId)}
                >
                  {requestedMachineId === certification.machineId ? 'Envoi…' : 'Demander'}
                </Button>
              ) : null}
            </View>
          </View>
        </Surface>
      ))}
    </View>
  )

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  footer: { alignItems: 'center', flexDirection: 'row', gap: spacing[3], justifyContent: 'space-between' },
  list: { gap: spacing[4] },
})
