import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { TextField } from './TextField'

describe('TextField', () => {
  it('ties the label to its input', () => {
    render(<TextField label="Adresse e-mail" name="email" />)
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('name', 'email')
  })

  it('accepts typed text', async () => {
    render(<TextField label="Adresse e-mail" name="email" />)

    await userEvent.type(screen.getByLabelText('Adresse e-mail'), 'jean@example.org')

    expect(screen.getByLabelText('Adresse e-mail')).toHaveValue('jean@example.org')
  })

  it('flags an invalid field to assistive technology', () => {
    render(<TextField label="Adresse e-mail" name="email" invalid />)
    expect(screen.getByLabelText('Adresse e-mail')).toHaveAttribute('aria-invalid', 'true')
  })

  it('leaves a valid field unflagged', () => {
    render(<TextField label="Adresse e-mail" name="email" />)
    expect(screen.getByLabelText('Adresse e-mail')).not.toHaveAttribute('aria-invalid')
  })
})
