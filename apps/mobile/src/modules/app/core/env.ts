import Constants from 'expo-constants'

import { apiBaseUrlFrom } from './lib/api-base-url'

export const API_BASE_URL = apiBaseUrlFrom(process.env['EXPO_PUBLIC_API_URL'], Constants.expoConfig?.hostUri)
