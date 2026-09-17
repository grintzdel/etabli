import { useLocalSearchParams } from 'expo-router'

import { MachinePage } from '@/features/machines/detail/machine.page'

export default function MachineRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <MachinePage id={id} />
}
