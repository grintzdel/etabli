import { spacing } from '@etabli/ui/tokens'
import { StyleSheet, View } from 'react-native'

import { Notice } from '../../../shared/ui/components/Notice'
import type { AtelierSummary } from '../../core/model/atelier'
import { AtelierCard } from './AtelierCard'

export type AtelierListProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
  readonly onSelect: (slug: string) => void
}

export const AtelierList = ({ ateliers, onSelect }: AtelierListProps) =>
  ateliers.length === 0 ? (
    <Notice message="Aucun atelier publié pour l’instant." />
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
