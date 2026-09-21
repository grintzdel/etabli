import { useLocalSearchParams } from 'expo-router'

import { AtelierPage } from '@/features/ateliers/detail/atelier.page'

export default function AtelierRoute() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  return <AtelierPage slug={slug} />
}
