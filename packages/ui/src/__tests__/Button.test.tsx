import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from '../components/Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button', { name: 'Primary' })
    expect(btn.className).toContain('bg-blue-600')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button', { name: 'Secondary' })
    expect(btn.className).toContain('border-blue-600')
  })

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button', { name: 'Ghost' })
    expect(btn.className).toContain('bg-transparent')
  })

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>)
    const btn = screen.getByRole('button', { name: 'Danger' })
    expect(btn.className).toContain('bg-red-600')
  })

  it('applies sm size', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button', { name: 'Small' })
    expect(btn.className).toContain('px-3')
    expect(btn.className).toContain('py-1.5')
  })

  it('applies lg size', () => {
    render(<Button size="lg">Large</Button>)
    const btn = screen.getByRole('button', { name: 'Large' })
    expect(btn.className).toContain('px-6')
    expect(btn.className).toContain('py-3')
  })

  it('merges custom className', () => {
    render(<Button className="my-custom">Styled</Button>)
    const btn = screen.getByRole('button', { name: 'Styled' })
    expect(btn.className).toContain('my-custom')
  })

  it('forwards native button props', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })
})
