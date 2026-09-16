const COVER_COUNT = 4

export const coverArtFor = (slug: string): string => {
  const sum = [...slug].reduce((total, character) => total + character.codePointAt(0)!, 0)
  return `/ateliers/cover-${(sum % COVER_COUNT) + 1}.png`
}
