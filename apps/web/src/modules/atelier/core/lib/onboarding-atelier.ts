import type { AtelierDetail, AtelierSummary } from '../model/atelier'

export type OnboardingAtelier = Pick<AtelierSummary, 'id' | 'name' | 'city' | 'machineCount' | 'machineKinds'>

export const onboardingAtelierOf = (atelier: AtelierDetail): OnboardingAtelier => ({
  id: atelier.id,
  name: atelier.name,
  city: atelier.city,
  machineCount: atelier.machines.length,
  machineKinds: [...new Set(atelier.machines.map((machine) => machine.kind))],
})
