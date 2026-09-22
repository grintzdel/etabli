export type QrCodeProps = {
  readonly source: string
  readonly label: string
}

export const QrCode = ({ source, label }: QrCodeProps) => (
  <img src={source} alt={label} className="h-auto w-full max-w-md" />
)
