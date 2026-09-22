import { Button, StatusBadge, Surface, Text } from '@etabli/ui'
import { colors, spacing } from '@etabli/ui/tokens'
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native'

import { Notice } from '../../../shared/ui/components/Notice'
import { MACHINE_KIND_LABELS, PRACTICES, type AtelierSummary } from '../../core/model/atelier'

export type OnboardingFormProps = {
  readonly ateliers: ReadonlyArray<AtelierSummary>
  readonly atelierId: string | null
  readonly onSelectAtelier: (id: string) => void
  readonly practice: ReadonlyArray<string>
  readonly onTogglePractice: (practice: string) => void
  readonly onJoin: () => void
  readonly isJoining: boolean
}

export const OnboardingForm = ({
  ateliers,
  atelierId,
  onSelectAtelier,
  practice,
  onTogglePractice,
  onJoin,
  isJoining,
}: OnboardingFormProps) => {
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']

  if (ateliers.length === 0) {
    return <Notice message="Aucun atelier n’est encore publié. Revenez bientôt." />
  }

  return (
    <View style={styles.form}>
      <Text variant="label">1 · Votre atelier</Text>
      <View style={styles.list}>
        {ateliers.map((atelier) => (
          <Pressable
            key={atelier.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: atelier.id === atelierId }}
            onPress={() => onSelectAtelier(atelier.id)}
          >
            <Surface style={atelier.id === atelierId ? { borderColor: palette.signal[500] } : undefined}>
              <View style={styles.body}>
                <Text variant="label">{atelier.name}</Text>
                <Text tone="muted">{`${atelier.city} · ${atelier.machineCount} machine${atelier.machineCount > 1 ? 's' : ''}`}</Text>
                <View style={styles.kinds}>
                  {atelier.machineKinds.map((kind) => (
                    <StatusBadge key={kind} label={MACHINE_KIND_LABELS[kind]} />
                  ))}
                </View>
              </View>
            </Surface>
          </Pressable>
        ))}
      </View>

      <Text variant="label">2 · Vos pratiques</Text>
      <View style={styles.kinds}>
        {PRACTICES.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={practice.includes(value) ? 'primary' : 'ghost'}
            onPress={() => onTogglePractice(value)}
          >
            {value}
          </Button>
        ))}
      </View>

      <Text variant="caption" tone="muted">
        Rejoindre un atelier ne vous habilite à rien. Les habilitations se demandent machine par machine.
      </Text>

      <Button disabled={isJoining} onPress={onJoin}>
        {isJoining ? 'Enregistrement…' : 'Rejoindre cet atelier'}
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing[3] },
  form: { gap: spacing[4] },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  list: { gap: spacing[3] },
})
