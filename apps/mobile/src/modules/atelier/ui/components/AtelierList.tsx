import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

import { Notice } from '../../../shared/ui/components/Notice'
import type { AtelierSummary } from '../../core/model/atelier'
import { AtelierCard } from './AtelierCard'

export type AtelierListProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
  readonly onSelect: (slug: string) => void
  readonly filtered?: boolean
  readonly emptyMessage?: string
}

export const AtelierList = ({
  ateliers,
  onSelect,
  filtered = false,
  emptyMessage = filtered ? 'Aucun atelier ne répond à ces filtres.' : 'Aucun atelier publié pour l’instant.',
}: AtelierListProps) =>
  ateliers.length === 0 ? (
    <Notice message={emptyMessage} />
  ) : (
    <View style={styles.list}>
      {ateliers.map((atelier) => (
        <AtelierCard key={atelier.id} atelier={atelier} onPress={onSelect} />
      ))}
    </View>
  )

const styles = StyleSheet.create({
  list: { gap: spacing[4] },
})
