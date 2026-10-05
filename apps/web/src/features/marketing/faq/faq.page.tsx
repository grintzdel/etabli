import { Surface } from '@etabli/ui'
import { buttonVariants } from '@etabli/ui/web'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description:
    'Habilitation, annulation, no-show, données personnelles, ateliers multiples : ce que membres et fabmanagers demandent avant de rejoindre le réseau Établi.',
  alternates: { canonical: '/faq' },
  openGraph: {
    type: 'website',
    siteName: 'Établi',
    title: 'Questions fréquentes — Établi',
    description: 'Ce que membres et fabmanagers demandent avant de rejoindre le réseau.',
  },
}

const questions = [
  {
    question: 'Je viens de créer un compte : puis-je réserver ?',
    answer:
      'Pas encore. Il faut d’abord rejoindre un atelier, puis demander l’habilitation de la machine qui vous intéresse. Un fabmanager de cet atelier accorde après vous avoir formé sur place.',
  },
  {
    question: 'L’habilitation vaut-elle pour tout le réseau ?',
    answer:
      'Non. Elle porte sur une machine, dans un atelier. La même découpeuse dans un autre atelier demande une nouvelle habilitation : les réglages, les consignes et les responsables n’y sont pas les mêmes.',
  },
  {
    question: 'Puis-je annuler un créneau ?',
    answer:
      'Oui, tant qu’il n’a pas commencé. Une fois le créneau entamé, seul un fabmanager de l’atelier peut l’annuler, et jusqu’à sa fin. Un créneau déjà pointé n’est annulable par personne.',
  },
  {
    question: 'Que se passe-t-il si je ne viens pas ?',
    answer:
      'Le créneau est marqué non honoré. Il a tenu la machine, il compte donc dans les heures réservées de l’atelier, jamais dans les heures consommées. C’est ce que les fabmanagers regardent.',
  },
  {
    question: 'Pourquoi faut-il pointer sur la machine ?',
    answer:
      'Parce qu’une réservation ne prouve rien. Le QR code collé sur le bâti atteste que vous êtes devant la machine. Le pointage ouvre 15 minutes avant le début du créneau et ferme 30 minutes après ; passé ce délai, le créneau est marqué non honoré.',
  },
  {
    question: 'Comment pointer, concrètement ?',
    answer:
      'Avec l’application mobile : elle scanne le QR code de la machine, et sans caméra le jeton imprimé sous le code se saisit à la main. Le navigateur ne sait pas lire le code. Sans téléphone, demandez au fabmanager présent : il peut vous pointer depuis son écran.',
  },
  {
    question: 'Y a-t-il une application mobile ?',
    answer:
      'Oui, pour le parcours membre : l’annuaire trié par distance, l’adhésion à un atelier, la demande d’habilitation, la réservation, l’annulation et le pointage. Les gestes du fabmanager et de l’administration restent sur le web.',
  },
  {
    question: 'Puis-je être membre de plusieurs ateliers ?',
    answer:
      'Oui. Le tableau de bord rassemble votre prochain créneau et vos demandes en attente, tous ateliers confondus ; vos réservations, vos habilitations et vos adhésions ont chacune leur page. Vous pouvez désigner un atelier par défaut dans vos paramètres.',
  },
  {
    question: 'Qui voit mes données ?',
    answer:
      'Les fabmanagers des ateliers dont vous êtes membre voient vos créneaux sur leurs machines et vos demandes d’habilitation ; rien de ce qui concerne un autre atelier ne leur est visible. L’administration de la plateforme voit votre compte — nom, e-mail, pratiques, ateliers — pour nommer les fabmanagers et suspendre un compte si besoin.',
  },
  {
    question: 'Je change de mot de passe : mes autres appareils sont-ils déconnectés ?',
    answer:
      'Non. Les sessions déjà ouvertes restent valides jusqu’à leur expiration — il n’y a pas de liste de révocation. Si un appareil vous échappe, prévenez un administrateur pour faire suspendre le compte.',
  },
]

export const FaqPage = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-20">
    <header className="flex flex-col gap-4">
      <h1 className="font-display text-4xl font-bold tracking-tight uppercase">Questions fréquentes</h1>
      <p className="text-graphite-200 text-lg">
        Ce qui revient le plus souvent, avant de rejoindre un atelier comme après.
      </p>
    </header>

    <dl className="flex flex-col gap-4">
      {questions.map((entry) => (
        <Surface key={entry.question} className="flex flex-col gap-2">
          <dt className="font-display text-lg font-semibold tracking-wide uppercase">{entry.question}</dt>
          <dd className="text-graphite-300">{entry.answer}</dd>
        </Surface>
      ))}
    </dl>

    <section className="flex flex-wrap items-center gap-4">
      <Link href="/ateliers" className={buttonVariants()}>
        Trouver un atelier
      </Link>
      <Link href="/fonctionnalites" className={buttonVariants({ variant: 'ghost' })}>
        Voir les fonctionnalités
      </Link>
    </section>
  </main>
)
