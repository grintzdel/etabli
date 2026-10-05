import { describe, expect, it } from 'vitest'

import type { AtelierDetail, PublicMachine } from '../model/atelier'
import { onboardingAtelierOf } from './onboarding-atelier'

const machine = (id: string, kind: PublicMachine['kind']): PublicMachine => ({
  id,
  name: id,
  description: '',
  kind,
  requiresCertification: false,
  slotDurationMinutes: 60,
  status: 'AVAILABLE',
})

const forge: AtelierDetail = {
  id: 'forge',
  slug: 'la-forge',
  name: 'La Forge',
  description: '',
  street: '1 rue du Fer',
  postalCode: '69001',
  city: 'Lyon',
  country: 'FR',
  latitude: 45.76,
  longitude: 4.83,
  machines: [machine('laser-a', 'LASER_CUTTER'), machine('laser-b', 'LASER_CUTTER'), machine('lathe', 'WOOD_LATHE')],
}

describe('onboardingAtelierOf', () => {
  it('counts every machine and names each kind once', () => {
    expect(onboardingAtelierOf(forge)).toEqual({
      id: 'forge',
      name: 'La Forge',
      city: 'Lyon',
      machineCount: 3,
      machineKinds: ['LASER_CUTTER', 'WOOD_LATHE'],
    })
  })
})
