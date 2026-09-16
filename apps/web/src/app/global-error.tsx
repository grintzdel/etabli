'use client'

const GlobalError = ({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) => (
  <html lang="fr">
    <body style={{ margin: 0, background: '#0b0b0c', color: '#f4f4f5', fontFamily: 'system-ui, sans-serif' }}>
      <title>Établi — erreur</title>
      <main style={{ margin: '0 auto', maxWidth: '40rem', padding: '5rem 1.5rem', display: 'grid', gap: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
          Établi est tombé
        </h1>
        <p style={{ margin: 0, color: '#a1a1aa', fontSize: '1.125rem' }}>
          L’application n’a pas pu démarrer le rendu. Réessayez : si l’erreur persiste, transmettez l’identifiant
          ci-dessous.
        </p>
        <p style={{ margin: 0, color: '#71717a', fontSize: '0.875rem' }}>
          {error.digest === undefined ? 'Aucun identifiant technique associé.' : `Identifiant : ${error.digest}`}
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            justifySelf: 'start',
            background: '#f43f2e',
            color: '#0b0b0c',
            border: 0,
            borderRadius: '2px',
            padding: '0.625rem 1.25rem',
            font: 'inherit',
            fontWeight: 600,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
      </main>
    </body>
  </html>
)

export default GlobalError
