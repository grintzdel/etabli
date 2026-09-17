import type { ReactNode } from 'react'
import { Pressable, type PressableProps, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native'

import { useColors } from '../theme/use-colors'
import { letterSpacing, nativeFontFamily, radii, spacing, text, type TextScale } from '../tokens'
import type { ButtonOwnProps, ButtonSize, ButtonVariant } from './button.types'

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> &
  ButtonOwnProps & {
    readonly children?: ReactNode
    readonly style?: StyleProp<ViewStyle>
  }

const box: Record<ButtonSize, ViewStyle> = {
  sm: { height: 32, paddingHorizontal: spacing[3] },
  md: { height: 40, paddingHorizontal: spacing[5] },
}

const labelScale: Record<ButtonSize, TextScale> = { sm: 'sm', md: 'base' }

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  style,
  ...props
}: ButtonProps) => {
  const palette = useColors()

  const tone: Record<ButtonVariant, { readonly background: string; readonly border: string; readonly ink: string }> = {
    primary: { background: palette.signal[500], border: 'transparent', ink: palette.graphite[950] },
    ghost: { background: 'transparent', border: palette.graphite[700], ink: palette.graphite[200] },
    danger: { background: palette.status.danger, border: 'transparent', ink: palette.graphite[50] },
  }

  const scale = labelScale[size]

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        box[size],
        { backgroundColor: tone[variant].background, borderColor: tone[variant].border },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          style={[
            styles.label,
            {
              color: tone[variant].ink,
              fontSize: text[scale].size,
              letterSpacing: letterSpacing(scale, 'wide'),
              lineHeight: text[scale].lineHeight,
            },
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  label: {
    fontFamily: nativeFontFamily.displaySemiBold,
    textTransform: 'uppercase',
  },
  pressed: { opacity: 0.8 },
})
