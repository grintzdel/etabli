import { useColorScheme } from 'react-native'

import { colors, type Palette } from '../tokens/colors'

export const useColors = (): Palette => colors[useColorScheme() === 'light' ? 'light' : 'dark']
