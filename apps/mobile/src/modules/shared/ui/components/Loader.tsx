import { colors, spacing } from '@etabli/ui/tokens'
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native'

export const Loader = () => {
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']

  return (
    <View style={styles.box}>
      <ActivityIndicator color={palette.signal[500]} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: spacing[10] },
})
