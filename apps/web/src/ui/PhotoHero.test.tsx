import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PhotoHero } from './PhotoHero'

describe('PhotoHero', () => {
  it('renders what it is given over the photo', () => {
    render(
      <PhotoHero src="/marketing/hero-atelier.webp">
        <h1>On ne réserve pas une découpeuse laser parce qu’elle est libre</h1>
      </PhotoHero>
    )

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('leaves the photo out of the accessibility tree', () => {
    render(
      <PhotoHero src="/marketing/hero-atelier.webp">
        <p>Établi</p>
      </PhotoHero>
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('presentation', { hidden: true })).toHaveAttribute('alt', '')
  })
})
