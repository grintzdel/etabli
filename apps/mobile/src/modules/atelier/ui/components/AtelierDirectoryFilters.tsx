import { Button, Surface, Text, TextField } from '@etabli/ui'
import { spacing } from '@etabli/ui/tokens'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { MACHINE_KIND_LABELS, MACHINE_KINDS, type DirectoryFilters, type MachineKind } from '../../core/model/atelier'

export type AtelierDirectoryFiltersProps = {
  readonly filters: DirectoryFilters
  readonly hasFilters: boolean
  readonly onSearchCity: (city: string) => void
  readonly onToggleMachineKind: (kind: MachineKind) => void
  readonly onClear: () => void
}

export const AtelierDirectoryFilters = ({
  filters,
  hasFilters,
  onSearchCity,
  onToggleMachineKind,
  onClear,
}: AtelierDirectoryFiltersProps) => {
  const [draft, setDraft] = useState(filters.city ?? '')

  return (
    <Surface>
      <View style={styles.body}>
        <TextField
          label="Ville"
          autoCapitalize="words"
          autoCorrect={false}
          onBlur={() => onSearchCity(draft)}
          onChangeText={setDraft}
          onSubmitEditing={() => onSearchCity(draft)}
          placeholder="Montreuil"
          returnKeyType="search"
          value={draft}
        />

        <Text variant="caption" tone="muted">
          La ville s’écrit en entier : l’annuaire compare le nom, il ne cherche pas dedans.
        </Text>

        <View style={styles.kinds}>
          {MACHINE_KINDS.map((kind) => (
            <Button
              key={kind}
              size="sm"
              variant={filters.machineKind === kind ? 'primary' : 'ghost'}
              onPress={() => onToggleMachineKind(kind)}
            >
              {MACHINE_KIND_LABELS[kind]}
            </Button>
          ))}
        </View>

        {hasFilters ? (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              setDraft('')
              onClear()
            }}
          >
            Effacer les filtres
          </Button>
        ) : null}
      </View>
    </Surface>
  )
}

const styles = StyleSheet.create({
  body: { alignItems: 'flex-start', gap: spacing[3] },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
})
