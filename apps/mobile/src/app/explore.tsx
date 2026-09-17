import { Button, StatusBadge, Surface, Text, TextField } from '@etabli/ui'
import { colors, spacing } from '@etabli/ui/tokens'
import { useState } from 'react'
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BottomTabInset, MaxContentWidth } from '@/constants/theme'

export default function UiKitScreen() {
  const insets = useSafeAreaInsets()
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']
  const [email, setEmail] = useState('')

  return (
    <ScrollView
      style={{ backgroundColor: palette.graphite[950] }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + BottomTabInset + spacing[6], paddingTop: insets.top + spacing[6] },
      ]}
    >
      <View style={styles.page}>
        <Text variant="title">Établi</Text>
        <Text tone="muted">Les primitives partagées avec le web, rendues en natif.</Text>

        <Text variant="heading">Boutons</Text>
        <View style={styles.row}>
          <Button>Réserver</Button>
          <Button variant="ghost">Annuler</Button>
          <Button variant="danger">Révoquer</Button>
        </View>
        <View style={styles.row}>
          <Button size="sm">Petit</Button>
          <Button size="sm" variant="ghost">
            Petit fantôme
          </Button>
          <Button disabled>Indisponible</Button>
        </View>

        <Text variant="heading">Statuts</Text>
        <View style={styles.row}>
          <StatusBadge tone="ok" label="Habilité" />
          <StatusBadge tone="warn" label="En attente" />
          <StatusBadge tone="danger" label="Révoqué" />
          <StatusBadge label="Brouillon" />
        </View>

        <Text variant="heading">Surface</Text>
        <Surface>
          <View style={styles.card}>
            <Text variant="label">Fraiseuse numérique</Text>
            <Text tone="muted">Atelier de la Villette — créneau de 2 h</Text>
            <StatusBadge tone="ok" label="Disponible" />
          </View>
        </Surface>

        <Text variant="heading">Champs</Text>
        <TextField
          label="Adresse e-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="jean@example.org"
          value={email}
        />
        <TextField label="Code d’accès" invalid placeholder="6 chiffres" />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  card: { gap: spacing[3] },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  page: {
    gap: spacing[4],
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
})
