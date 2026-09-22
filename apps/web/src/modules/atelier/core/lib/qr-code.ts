import QRCode from 'qrcode'

export interface QrCode {
  readonly size: number
  readonly path: string
}

export const qrCodeOf = (text: string): QrCode => {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const { size, data } = modules

  const squares: Array<string> = []
  for (let index = 0; index < data.length; index += 1) {
    if (data[index] === 0) continue
    squares.push(`M${index % size} ${Math.floor(index / size)}h1v1h-1z`)
  }

  return { size, path: squares.join('') }
}

const QUIET_ZONE = 4

export const qrSvgDataUri = (text: string): string => {
  const { size, path } = qrCodeOf(text)
  const span = size + QUIET_ZONE * 2
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${span} ${span}" shape-rendering="crispEdges">` +
    `<rect width="${span}" height="${span}" fill="#ffffff"/>` +
    `<g transform="translate(${QUIET_ZONE} ${QUIET_ZONE})"><path d="${path}" fill="#000000"/></g>` +
    `</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
