import { colors } from '@etabli/ui/tokens'
import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useColorScheme } from 'react-native'

export default function TabsLayout() {
  const palette = colors[useColorScheme() === 'light' ? 'light' : 'dark']

  return (
    <NativeTabs
      backgroundColor={palette.graphite[900]}
      indicatorColor={palette.graphite[800]}
      labelStyle={{ selected: { color: palette.signal[500] } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Ateliers</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="mappin.and.ellipse" md="place" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bookings">
        <NativeTabs.Trigger.Label>Réservations</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Compte</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
