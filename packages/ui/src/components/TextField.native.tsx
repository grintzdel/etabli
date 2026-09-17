import { type StyleProp, StyleSheet, Text, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native'

import { useColors } from '../theme/use-colors'
import { letterSpacing, nativeFontFamily, radii, spacing, text } from '../tokens'
import type { TextFieldOwnProps } from './text-field.types'

export type TextFieldProps = Omit<TextInputProps, 'style'> &
  TextFieldOwnProps & {
    readonly style?: StyleProp<ViewStyle>
  }

export const TextField = ({ label, invalid = false, style, ...props }: TextFieldProps) => {
  const palette = useColors()

  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.label, { color: palette.graphite[200] }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={palette.graphite[500]}
        style={[
          styles.input,
          {
            backgroundColor: palette.graphite[900],
            borderColor: invalid ? palette.status.danger : palette.graphite[700],
            color: palette.graphite[50],
          },
        ]}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: spacing[2] },
  input: {
    borderRadius: radii.sm,
    borderWidth: 1,
    fontFamily: nativeFontFamily.sansRegular,
    fontSize: text.base.size,
    height: 40,
    paddingHorizontal: spacing[3],
  },
  label: {
    fontFamily: nativeFontFamily.displaySemiBold,
    fontSize: text.sm.size,
    letterSpacing: letterSpacing('sm', 'wide'),
    lineHeight: text.sm.lineHeight,
    textTransform: 'uppercase',
  },
})
