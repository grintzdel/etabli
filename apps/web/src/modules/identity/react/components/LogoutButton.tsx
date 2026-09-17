import { Button } from '@etabli/ui'

export const LogoutButton = ({ action }: { readonly action: () => Promise<void> }) => (
  <form action={action}>
    <Button type="submit" variant="ghost">
      Se déconnecter
    </Button>
  </form>
)
