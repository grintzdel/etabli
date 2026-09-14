export const AuthFormError = ({ message }: { readonly message: string | null }) =>
  message === null ? null : (
    <p role="alert" className="text-status-danger text-sm">
      {message}
    </p>
  )
