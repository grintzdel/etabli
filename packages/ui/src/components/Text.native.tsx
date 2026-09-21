import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'

import { useColors } from '../theme/use-colors'
import { letterSpacing, nativeFontFamily, text } from '../tokens'
import type { TextOwnProps, TextTone, TextVariant } from './text.types'

export type TextProps = RNTextProps & TextOwnProps

const variantStyle: Record<TextVariant, TextStyle> = {
  title: {
    fontFamily: nativeFontFamily.displayBold,
    fontSize: text['4xl'].size,
    letterSpacing: letterSpacing('4xl', 'tight'),
    lineHeight: text['4xl'].lineHeight,
    textTransform: 'uppercase',
  },
  heading: {
    fontFamily: nativeFontFamily.displaySemiBold,
    fontSize: text['2xl'].size,
    letterSpacing: letterSpacing('2xl', 'wide'),
    lineHeight: text['2xl'].lineHeight,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: nativeFontFamily.displaySemiBold,
    fontSize: text.sm.size,
    letterSpacing: letterSpacing('sm', 'wide'),
    lineHeight: text.sm.lineHeight,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: nativeFontFamily.sansRegular,
    fontSize: text.base.size,
    lineHeight: text.base.lineHeight,
  },
  caption: {
    fontFamily: nativeFontFamily.sansRegular,
    fontSize: text.sm.size,
    lineHeight: text.sm.lineHeight,
  },
}

export const Text = ({ variant = 'body', tone = 'default', style, ...props }: TextProps) => {
  const palette = useColors()

  const ink: Record<TextTone, string> = {
    default: palette.graphite[50],
    muted: palette.graphite[300],
    accent: palette.signal[500],
    danger: palette.status.danger,
  }

  return <RNText style={[variantStyle[variant], { color: ink[tone] }, style]} {...props} />
}
