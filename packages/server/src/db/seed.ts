import { NodeRuntime } from '@effect/platform-node'
import { SqlClient } from '@effect/sql'
import { makePasswordHasherBcrypt } from '@etabli/bc-identity'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

import { MigratorLive } from '../layers/migrator.layer'
import { SqlClientLive } from '../layers/sql-client.layer'

interface SeedMachine {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly kind: string
  readonly requiresCertification: boolean
  readonly slotDurationMinutes: number
  readonly status: string
  readonly nfcTagId: string | null
}

interface SeedAtelier {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly street: string
  readonly postalCode: string
  readonly city: string
  readonly latitude: number
  readonly longitude: number
  readonly status: string
  readonly machines: ReadonlyArray<SeedMachine>
}

interface SeedUser {
  readonly id: string
  readonly email: string
  readonly displayName: string
  readonly platformRole: string
  readonly practice: ReadonlyArray<string>
  readonly onboardingCompleted: boolean
  readonly status: string
}

interface SeedMembership {
  readonly id: string
  readonly userId: string
  readonly atelierId: string
  readonly role: string
  readonly status: string
}

interface SeedCertification {
  readonly id: string
  readonly userId: string
  readonly machineId: string
  readonly status: string
  readonly decidedBy: string | null
  readonly requestedDaysAgo: number
}

interface SeedBooking {
  readonly id: string
  readonly machineId: string
  readonly atelierId: string
  readonly userId: string
  readonly dayOffset: number
  readonly localHour: number
  readonly startsInMinutes?: number
  readonly minutes: number
  readonly status: string
  readonly checkedInVia: string | null
}

export const SEED_PASSWORD = 'etabli-2026'

const ATELIERS: ReadonlyArray<SeedAtelier> = [
  {
    id: '0a7e1f00-0000-4000-8000-000000000001',
    slug: 'la-forge-montreuil',
    name: 'La Forge',
    description: 'Atelier bois et métal ouvert sept jours sur sept, au pied du métro Croix-de-Chavaux.',
    street: '12 rue des Forges',
    postalCode: '93100',
    city: 'Montreuil',
    latitude: 48.8638,
    longitude: 2.4485,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000101',
        name: 'Trotec Speedy 400',
        description: 'Découpe laser CO2, plateau 1000 × 610 mm.',
        kind: 'LASER_CUTTER',
        requiresCertification: true,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-forge-laser-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000102',
        name: 'Prusa MK4',
        description: 'Impression 3D filament, buse 0,4 mm.',
        kind: 'PRINTER_3D',
        requiresCertification: false,
        slotDurationMinutes: 120,
        status: 'MAINTENANCE',
        nfcTagId: 'nfc-forge-prusa-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000103',
        name: 'Tour Jet BDB-1340',
        description: 'Tour à bois entre-pointes 1000 mm.',
        kind: 'WOOD_LATHE',
        requiresCertification: true,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-forge-tour-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000104',
        name: 'Shapeoko 4 XXL',
        description: 'Fraiseuse numérique 3 axes, course 840 × 840 mm.',
        kind: 'CNC_MILL',
        requiresCertification: true,
        slotDurationMinutes: 120,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-forge-cnc-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000105',
        name: 'Scie à ruban Kity 613',
        description: 'Retirée du parc après la panne de moteur de janvier.',
        kind: 'WOOD_LATHE',
        requiresCertification: true,
        slotDurationMinutes: 60,
        status: 'RETIRED',
        nfcTagId: null,
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000002',
    slug: 'fabrique-lyonnaise',
    name: 'Fabrique Lyonnaise',
    description: 'Textile et électronique, dans une ancienne teinturerie de la Guillotière.',
    street: '3 quai Claude Bernard',
    postalCode: '69007',
    city: 'Lyon',
    latitude: 45.764,
    longitude: 4.8357,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000201',
        name: 'Juki DDL-8700',
        description: 'Piqueuse industrielle point noué.',
        kind: 'SEWING',
        requiresCertification: false,
        slotDurationMinutes: 30,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-lyon-juki-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000202',
        name: 'Établi Weller',
        description: 'Poste de soudure, loupe binoculaire et alimentation de laboratoire.',
        kind: 'ELECTRONICS_BENCH',
        requiresCertification: false,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-lyon-weller-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000203',
        name: 'Brother PR-680W',
        description: 'Brodeuse six têtes, cadre 360 × 200 mm.',
        kind: 'SEWING',
        requiresCertification: true,
        slotDurationMinutes: 90,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-lyon-brother-01',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000003',
    slug: 'atelier-en-preparation',
    name: 'Atelier en préparation',
    description: 'Ouvre au printemps. Ne doit apparaître nulle part.',
    street: '1 rue Inconnue',
    postalCode: '31000',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4442,
    status: 'DRAFT',
    machines: [],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000004',
    slug: 'copeaux-et-cie-bastille',
    name: 'Copeaux & Cie',
    description: 'Menuiserie de quartier sur deux niveaux, spécialisée dans le mobilier sur mesure.',
    street: '48 rue de la Roquette',
    postalCode: '75011',
    city: 'Paris',
    latitude: 48.8557,
    longitude: 2.3757,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000401',
        name: 'Tour Record Power Coronet',
        description: 'Tour à bois à variateur, entre-pointes 760 mm.',
        kind: 'WOOD_LATHE',
        requiresCertification: true,
        slotDurationMinutes: 90,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-copeaux-tour-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000402',
        name: 'Bambu Lab P1S',
        description: 'Impression 3D fermée, quatre filaments via AMS.',
        kind: 'PRINTER_3D',
        requiresCertification: false,
        slotDurationMinutes: 180,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-copeaux-bambu-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000403',
        name: 'Stepcraft M.700',
        description: 'Fraiseuse numérique, broche 1,05 kW.',
        kind: 'CNC_MILL',
        requiresCertification: true,
        slotDurationMinutes: 120,
        status: 'MAINTENANCE',
        nfcTagId: 'nfc-copeaux-cnc-01',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000005',
    slug: 'atelier-des-canuts',
    name: 'Atelier des Canuts',
    description: 'Sérigraphie, couture et prototypage rapide sur les pentes de la Croix-Rousse.',
    street: '21 rue Burdeau',
    postalCode: '69001',
    city: 'Lyon',
    latitude: 45.7702,
    longitude: 4.8322,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000501',
        name: 'Singer 4423 Heavy Duty',
        description: 'Machine à coudre familiale renforcée, idéale pour la toile épaisse.',
        kind: 'SEWING',
        requiresCertification: false,
        slotDurationMinutes: 30,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-canuts-singer-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000502',
        name: 'Glowforge Pro',
        description: 'Découpe et gravure laser sur bois, cuir et acrylique.',
        kind: 'LASER_CUTTER',
        requiresCertification: true,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-canuts-glowforge-01',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000006',
    slug: 'la-ruche-nantaise',
    name: 'La Ruche Nantaise',
    description: 'Fablab associatif sur l’île de Nantes, ouvert aux scolaires le mercredi.',
    street: '5 boulevard Léon Bureau',
    postalCode: '44200',
    city: 'Nantes',
    latitude: 47.2065,
    longitude: -1.5652,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000601',
        name: 'Ultimaker S5',
        description: 'Impression 3D double extrusion, volume 330 × 240 × 300 mm.',
        kind: 'PRINTER_3D',
        requiresCertification: false,
        slotDurationMinutes: 180,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-ruche-ultimaker-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000602',
        name: 'Poste Metcal CV-5200',
        description: 'Station de soudure sans plomb, deux pannes interchangeables.',
        kind: 'ELECTRONICS_BENCH',
        requiresCertification: false,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-ruche-metcal-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000603',
        name: 'Epilog Fusion Edge 24',
        description: 'Laser 60 W avec caméra de repérage.',
        kind: 'LASER_CUTTER',
        requiresCertification: true,
        slotDurationMinutes: 45,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-ruche-epilog-01',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000007',
    slug: 'la-forge-du-vieux-port',
    name: 'La Forge du Vieux-Port',
    description: 'Métal et gros œuvre, sous les voûtes d’un ancien entrepôt du Panier.',
    street: '9 rue Caisserie',
    postalCode: '13002',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000701',
        name: 'Haas Mini Mill',
        description: 'Centre d’usinage vertical, course 406 × 305 × 254 mm.',
        kind: 'CNC_MILL',
        requiresCertification: true,
        slotDurationMinutes: 180,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-vieuxport-haas-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000702',
        name: 'Tour Holzstar DB 1100',
        description: 'Tour à bois fonte, contre-poupée réglable.',
        kind: 'WOOD_LATHE',
        requiresCertification: true,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-vieuxport-tour-01',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000008',
    slug: 'le-tournevis-lillois',
    name: 'Le Tournevis Lillois',
    description: 'Réparation et électronique, adossé au repair café de Wazemmes.',
    street: '14 rue des Sarrazins',
    postalCode: '59000',
    city: 'Lille',
    latitude: 50.6236,
    longitude: 3.0532,
    status: 'PUBLISHED',
    machines: [
      {
        id: '0a7e1f00-0000-4000-8000-000000000801',
        name: 'Banc Rigol DS1054Z',
        description: 'Oscilloscope quatre voies, générateur et alimentation de laboratoire.',
        kind: 'ELECTRONICS_BENCH',
        requiresCertification: false,
        slotDurationMinutes: 60,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-tournevis-rigol-01',
      },
      {
        id: '0a7e1f00-0000-4000-8000-000000000802',
        name: 'Creality K1 Max',
        description: 'Impression 3D grande vitesse, volume 300 × 300 × 300 mm.',
        kind: 'PRINTER_3D',
        requiresCertification: false,
        slotDurationMinutes: 120,
        status: 'AVAILABLE',
        nfcTagId: 'nfc-tournevis-creality-01',
      },
    ],
  },
  {
    id: '0a7e1f00-0000-4000-8000-000000000009',
    slug: 'atelier-des-chartrons',
    name: 'Atelier des Chartrons',
    description: 'Fermé depuis la fin du bail. Conservé pour l’historique, invisible à l’annuaire.',
    street: '77 rue Notre-Dame',
    postalCode: '33000',
    city: 'Bordeaux',
    latitude: 44.8534,
    longitude: -0.5716,
    status: 'CLOSED',
    machines: [],
  },
]

const USERS: ReadonlyArray<SeedUser> = [
  {
    id: '0a7e2000-0000-4000-8000-000000000001',
    email: 'admin@etabli.test',
    displayName: 'Salomé Vidal',
    platformRole: 'PLATFORM_ADMIN',
    practice: ['métal', 'gros œuvre'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000002',
    email: 'fabmanager.forge@etabli.test',
    displayName: 'Hugo Meunier',
    platformRole: 'MEMBER',
    practice: ['bois', 'découpe laser'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000003',
    email: 'fabmanager.lyon@etabli.test',
    displayName: 'Inès Fabre',
    platformRole: 'MEMBER',
    practice: ['textile', 'électronique'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000004',
    email: 'membre@etabli.test',
    displayName: 'Camille Roux',
    platformRole: 'MEMBER',
    practice: ['impression 3D'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000007',
    email: 'fabmanager.copeaux@etabli.test',
    displayName: 'Nadia Perrin',
    platformRole: 'MEMBER',
    practice: ['menuiserie'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000005',
    email: 'nouveau@etabli.test',
    displayName: 'Tarek Benali',
    platformRole: 'MEMBER',
    practice: [],
    onboardingCompleted: false,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000008',
    email: 'lea@etabli.test',
    displayName: 'Léa Nguyen',
    platformRole: 'MEMBER',
    practice: ['bois', 'tournage'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000009',
    email: 'theo@etabli.test',
    displayName: 'Théo Bacher',
    platformRole: 'MEMBER',
    practice: ['électronique', 'textile'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000010',
    email: 'manon@etabli.test',
    displayName: 'Manon Silva',
    platformRole: 'MEMBER',
    practice: ['impression 3D'],
    onboardingCompleted: true,
    status: 'ACTIVE',
  },
  {
    id: '0a7e2000-0000-4000-8000-000000000006',
    email: 'suspendu@etabli.test',
    displayName: 'Lou Marchand',
    platformRole: 'MEMBER',
    practice: ['couture'],
    onboardingCompleted: true,
    status: 'SUSPENDED',
  },
]

const MEMBERSHIPS: ReadonlyArray<SeedMembership> = [
  {
    id: '0a7e3000-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000002',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    role: 'FABMANAGER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000002',
    userId: '0a7e2000-0000-4000-8000-000000000003',
    atelierId: '0a7e1f00-0000-4000-8000-000000000002',
    role: 'FABMANAGER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000003',
    userId: '0a7e2000-0000-4000-8000-000000000003',
    atelierId: '0a7e1f00-0000-4000-8000-000000000005',
    role: 'FABMANAGER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000005',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000006',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    atelierId: '0a7e1f00-0000-4000-8000-000000000007',
    role: 'FABMANAGER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000008',
    userId: '0a7e2000-0000-4000-8000-000000000007',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    role: 'FABMANAGER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000013',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000009',
    userId: '0a7e2000-0000-4000-8000-000000000008',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000010',
    userId: '0a7e2000-0000-4000-8000-000000000009',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000011',
    userId: '0a7e2000-0000-4000-8000-000000000009',
    atelierId: '0a7e1f00-0000-4000-8000-000000000002',
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000012',
    userId: '0a7e2000-0000-4000-8000-000000000010',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    role: 'MEMBER',
    status: 'ACTIVE',
  },
  {
    id: '0a7e3000-0000-4000-8000-000000000007',
    userId: '0a7e2000-0000-4000-8000-000000000006',
    atelierId: '0a7e1f00-0000-4000-8000-000000000002',
    role: 'MEMBER',
    status: 'SUSPENDED',
  },
]

const CERTIFICATIONS: ReadonlyArray<SeedCertification> = [
  {
    id: '0a7e4000-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    machineId: '0a7e1f00-0000-4000-8000-000000000101',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000002',
    requestedDaysAgo: 40,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000002',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    machineId: '0a7e1f00-0000-4000-8000-000000000104',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000002',
    requestedDaysAgo: 35,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000003',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    machineId: '0a7e1f00-0000-4000-8000-000000000103',
    status: 'PENDING',
    decidedBy: null,
    requestedDaysAgo: 2,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    machineId: '0a7e1f00-0000-4000-8000-000000000401',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000007',
    requestedDaysAgo: 28,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000005',
    userId: '0a7e2000-0000-4000-8000-000000000008',
    machineId: '0a7e1f00-0000-4000-8000-000000000103',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000002',
    requestedDaysAgo: 22,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000006',
    userId: '0a7e2000-0000-4000-8000-000000000008',
    machineId: '0a7e1f00-0000-4000-8000-000000000101',
    status: 'PENDING',
    decidedBy: null,
    requestedDaysAgo: 1,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000007',
    userId: '0a7e2000-0000-4000-8000-000000000008',
    machineId: '0a7e1f00-0000-4000-8000-000000000104',
    status: 'REVOKED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000002',
    requestedDaysAgo: 18,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000008',
    userId: '0a7e2000-0000-4000-8000-000000000009',
    machineId: '0a7e1f00-0000-4000-8000-000000000104',
    status: 'PENDING',
    decidedBy: null,
    requestedDaysAgo: 3,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000009',
    userId: '0a7e2000-0000-4000-8000-000000000009',
    machineId: '0a7e1f00-0000-4000-8000-000000000203',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000003',
    requestedDaysAgo: 15,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000011',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    machineId: '0a7e1f00-0000-4000-8000-000000000702',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000001',
    requestedDaysAgo: 60,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000012',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    machineId: '0a7e1f00-0000-4000-8000-000000000101',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000002',
    requestedDaysAgo: 31,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000013',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    machineId: '0a7e1f00-0000-4000-8000-000000000701',
    status: 'PENDING',
    decidedBy: null,
    requestedDaysAgo: 2,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000014',
    userId: '0a7e2000-0000-4000-8000-000000000002',
    machineId: '0a7e1f00-0000-4000-8000-000000000103',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000002',
    requestedDaysAgo: 90,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000015',
    userId: '0a7e2000-0000-4000-8000-000000000003',
    machineId: '0a7e1f00-0000-4000-8000-000000000502',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000003',
    requestedDaysAgo: 75,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000016',
    userId: '0a7e2000-0000-4000-8000-000000000007',
    machineId: '0a7e1f00-0000-4000-8000-000000000401',
    status: 'GRANTED',
    decidedBy: '0a7e2000-0000-4000-8000-000000000007',
    requestedDaysAgo: 70,
  },
  {
    id: '0a7e4000-0000-4000-8000-000000000010',
    userId: '0a7e2000-0000-4000-8000-000000000010',
    machineId: '0a7e1f00-0000-4000-8000-000000000401',
    status: 'PENDING',
    decidedBy: null,
    requestedDaysAgo: 4,
  },
]

const BOOKINGS: ReadonlyArray<SeedBooking> = [
  {
    id: '0a7e5000-0000-4000-8000-000000000001',
    machineId: '0a7e1f00-0000-4000-8000-000000000101',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: 1,
    localHour: 10,
    minutes: 60,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000002',
    machineId: '0a7e1f00-0000-4000-8000-000000000401',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: 3,
    localHour: 14,
    minutes: 90,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000003',
    machineId: '0a7e1f00-0000-4000-8000-000000000101',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: -5,
    localHour: 9,
    minutes: 60,
    status: 'CHECKED_IN',
    checkedInVia: 'NFC',
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000004',
    machineId: '0a7e1f00-0000-4000-8000-000000000104',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: -12,
    localHour: 14,
    minutes: 120,
    status: 'CHECKED_IN',
    checkedInVia: 'NFC',
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000005',
    machineId: '0a7e1f00-0000-4000-8000-000000000101',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: -8,
    localHour: 16,
    minutes: 60,
    status: 'NO_SHOW',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000006',
    machineId: '0a7e1f00-0000-4000-8000-000000000402',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: -20,
    localHour: 9,
    minutes: 180,
    status: 'CHECKED_IN',
    checkedInVia: 'MANUAL',
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000007',
    machineId: '0a7e1f00-0000-4000-8000-000000000402',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: -2,
    localHour: 9,
    minutes: 180,
    status: 'CANCELLED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000008',
    machineId: '0a7e1f00-0000-4000-8000-000000000103',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000008',
    dayOffset: 1,
    localHour: 14,
    minutes: 60,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000009',
    machineId: '0a7e1f00-0000-4000-8000-000000000103',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000008',
    dayOffset: -3,
    localHour: 10,
    minutes: 60,
    status: 'CHECKED_IN',
    checkedInVia: 'NFC',
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000010',
    machineId: '0a7e1f00-0000-4000-8000-000000000203',
    atelierId: '0a7e1f00-0000-4000-8000-000000000002',
    userId: '0a7e2000-0000-4000-8000-000000000009',
    dayOffset: 2,
    localHour: 10,
    minutes: 90,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000011',
    machineId: '0a7e1f00-0000-4000-8000-000000000202',
    atelierId: '0a7e1f00-0000-4000-8000-000000000002',
    userId: '0a7e2000-0000-4000-8000-000000000009',
    dayOffset: -6,
    localHour: 14,
    minutes: 60,
    status: 'CHECKED_IN',
    checkedInVia: 'NFC',
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000012',
    machineId: '0a7e1f00-0000-4000-8000-000000000402',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000010',
    dayOffset: 1,
    localHour: 9,
    minutes: 180,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000014',
    machineId: '0a7e1f00-0000-4000-8000-000000000104',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000004',
    dayOffset: 0,
    localHour: 0,
    startsInMinutes: -10,
    minutes: 120,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000015',
    machineId: '0a7e1f00-0000-4000-8000-000000000702',
    atelierId: '0a7e1f00-0000-4000-8000-000000000007',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    dayOffset: 0,
    localHour: 0,
    startsInMinutes: -5,
    minutes: 60,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000016',
    machineId: '0a7e1f00-0000-4000-8000-000000000101',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    dayOffset: -4,
    localHour: 11,
    minutes: 60,
    status: 'CHECKED_IN',
    checkedInVia: 'NFC',
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000017',
    machineId: '0a7e1f00-0000-4000-8000-000000000702',
    atelierId: '0a7e1f00-0000-4000-8000-000000000007',
    userId: '0a7e2000-0000-4000-8000-000000000001',
    dayOffset: 2,
    localHour: 9,
    minutes: 60,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000018',
    machineId: '0a7e1f00-0000-4000-8000-000000000103',
    atelierId: '0a7e1f00-0000-4000-8000-000000000001',
    userId: '0a7e2000-0000-4000-8000-000000000002',
    dayOffset: 2,
    localHour: 9,
    minutes: 60,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000019',
    machineId: '0a7e1f00-0000-4000-8000-000000000502',
    atelierId: '0a7e1f00-0000-4000-8000-000000000005',
    userId: '0a7e2000-0000-4000-8000-000000000003',
    dayOffset: 1,
    localHour: 11,
    minutes: 60,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000020',
    machineId: '0a7e1f00-0000-4000-8000-000000000401',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000007',
    dayOffset: 2,
    localHour: 10,
    minutes: 90,
    status: 'CONFIRMED',
    checkedInVia: null,
  },
  {
    id: '0a7e5000-0000-4000-8000-000000000013',
    machineId: '0a7e1f00-0000-4000-8000-000000000402',
    atelierId: '0a7e1f00-0000-4000-8000-000000000004',
    userId: '0a7e2000-0000-4000-8000-000000000010',
    dayOffset: -10,
    localHour: 13,
    minutes: 180,
    status: 'CHECKED_IN',
    checkedInVia: 'NFC',
  },
]

const DAY_MS = 86_400_000

const parisOffsetMinutes = (instant: Date): number => {
  const label = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
    .formatToParts(instant)
    .find((part) => part.type === 'timeZoneName')?.value
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label ?? '')
  if (match === null) return 0

  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
}

// Anchored on the clock rather than on the grid: the check-in window is 15 minutes before the
// slot and 30 after it starts, so only a slot placed relative to now is ever open to stamp.
const startingIn = (offsetMinutes: number, minutes: number): { start: Date; end: Date } => {
  const start = new Date(Date.now() + offsetMinutes * 60_000)
  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

const slotAt = (dayOffset: number, localHour: number, minutes: number): { start: Date; end: Date } => {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(Date.now() + dayOffset * DAY_MS))
  const at = (type: string): number => Number(parts.find((part) => part.type === type)?.value ?? 0)

  const noon = Date.UTC(at('year'), at('month') - 1, at('day'), 12)
  const start = new Date(
    Date.UTC(at('year'), at('month') - 1, at('day'), localHour) - parisOffsetMinutes(new Date(noon)) * 60_000
  )

  return { start, end: new Date(start.getTime() + minutes * 60_000) }
}

const toPgTextArray = (values: ReadonlyArray<string>): string =>
  `{${values.map((value) => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`).join(',')}}`

const program = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const passwordHash = yield* makePasswordHasherBcrypt().hash(SEED_PASSWORD)

  for (const atelier of ATELIERS) {
    yield* sql`
      INSERT INTO ateliers (id, slug, name, description, street, postal_code, city, country, latitude, longitude, status)
      VALUES (
        ${atelier.id}, ${atelier.slug}, ${atelier.name}, ${atelier.description}, ${atelier.street},
        ${atelier.postalCode}, ${atelier.city}, 'FR', ${atelier.latitude}, ${atelier.longitude}, ${atelier.status}
      )
      ON CONFLICT (id) DO NOTHING
    `

    for (const machine of atelier.machines) {
      yield* sql`
        INSERT INTO machines (id, atelier_id, name, description, kind, requires_certification, slot_duration_minutes, status, nfc_tag_id)
        VALUES (
          ${machine.id}, ${atelier.id}, ${machine.name}, ${machine.description}, ${machine.kind},
          ${machine.requiresCertification}, ${machine.slotDurationMinutes}, ${machine.status}, ${machine.nfcTagId}
        )
        ON CONFLICT (id) DO NOTHING
      `
    }
  }

  for (const user of USERS) {
    yield* sql`
      INSERT INTO users (id, email, password_hash, display_name, platform_role, practice, onboarding_completed_at, status)
      VALUES (
        ${user.id}, ${user.email}, ${passwordHash}, ${user.displayName}, ${user.platformRole},
        ${toPgTextArray(user.practice)}::text[], ${user.onboardingCompleted ? new Date() : null}, ${user.status}
      )
      ON CONFLICT (id) DO NOTHING
    `
  }

  for (const membership of MEMBERSHIPS) {
    yield* sql`
      INSERT INTO memberships (id, user_id, atelier_id, role, status)
      VALUES (${membership.id}, ${membership.userId}, ${membership.atelierId}, ${membership.role}, ${membership.status})
      ON CONFLICT (id) DO NOTHING
    `
  }

  // Re-asserted rather than left alone: the slots are relative to now, so a second run
  // has to move them forward instead of keeping yesterday's demo.
  yield* sql`DELETE FROM bookings WHERE id IN ${sql.in(BOOKINGS.map((booking) => booking.id))}`
  yield* sql`DELETE FROM certifications WHERE id IN ${sql.in(CERTIFICATIONS.map((certification) => certification.id))}`

  for (const certification of CERTIFICATIONS) {
    const requestedAt = new Date(Date.now() - certification.requestedDaysAgo * DAY_MS)
    const decidedAt = certification.decidedBy === null ? null : new Date(requestedAt.getTime() + DAY_MS)

    yield* sql`
      INSERT INTO certifications (id, user_id, machine_id, status, requested_at, decided_at, decided_by)
      VALUES (
        ${certification.id}, ${certification.userId}, ${certification.machineId}, ${certification.status},
        ${requestedAt}, ${decidedAt}, ${certification.decidedBy}
      )
      ON CONFLICT (user_id, machine_id) DO NOTHING
    `
  }

  for (const booking of BOOKINGS) {
    const { start, end } =
      booking.startsInMinutes === undefined
        ? slotAt(booking.dayOffset, booking.localHour, booking.minutes)
        : startingIn(booking.startsInMinutes, booking.minutes)
    const checkedInAt = booking.checkedInVia === null ? null : new Date(start.getTime() + 4 * 60_000)
    const cancelledAt = booking.status === 'CANCELLED' ? new Date(start.getTime() - 2 * 60 * 60_000) : null

    yield* sql`
      INSERT INTO bookings (id, machine_id, atelier_id, user_id, start_at, end_at, status, checked_in_at, checked_in_via, cancelled_at, cancelled_by)
      VALUES (
        ${booking.id}, ${booking.machineId}, ${booking.atelierId}, ${booking.userId}, ${start}, ${end},
        ${booking.status}, ${checkedInAt}, ${booking.checkedInVia}, ${cancelledAt},
        ${cancelledAt === null ? null : booking.userId}
      )
    `
  }

  const machineCount = ATELIERS.reduce((total, atelier) => total + atelier.machines.length, 0)
  yield* Effect.log(
    `Seeded ${ATELIERS.length} ateliers, ${machineCount} machines, ${USERS.length} users, ` +
      `${MEMBERSHIPS.length} memberships, ${CERTIFICATIONS.length} certifications, ${BOOKINGS.length} bookings`
  )
}).pipe(Effect.provide(MigratorLive.pipe(Layer.provide(SqlClientLive))), Effect.provide(SqlClientLive))

NodeRuntime.runMain(program)
