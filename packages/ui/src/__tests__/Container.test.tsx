import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Container } from '../components/Container'

describe('Container', () => {
  it('renders children', () => {
    render(<Container>Content</Container>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies lg size by default', () => {
    render(<Container data-testid="container">Content</Container>)
    const el = screen.getByTestId('container')
    expect(el.className).toContain('max-w-7xl')
  })

  it('applies sm size', () => {
    render(<Container size="sm" data-testid="container">Content</Container>)
    const el = screen.getByTestId('container')
    expect(el.className).toContain('max-w-3xl')
  })

  it('applies md size', () => {
    render(<Container size="md" data-testid="container">Content</Container>)
    const el = screen.getByTestId('container')
    expect(el.className).toContain('max-w-5xl')
  })

  it('applies xl size', () => {
    render(<Container size="xl" data-testid="container">Content</Container>)
    const el = screen.getByTestId('container')
    expect(el.className).toContain('max-w-screen-2xl')
  })

  it('applies full size', () => {
    render(<Container size="full" data-testid="container">Content</Container>)
    const el = screen.getByTestId('container')
    expect(el.className).toContain('max-w-full')
  })

  it('includes responsive padding', () => {
    render(<Container data-testid="container">Content</Container>)
    const el = screen.getByTestId('container')
    expect(el.className).toContain('px-4')
  })

  it('merges custom className', () => {
    render(<Container className="extra" data-testid="container">Content</Container>)
    const el = screen.getByTestId('container')
    expect(el.className).toContain('extra')
  })
})
