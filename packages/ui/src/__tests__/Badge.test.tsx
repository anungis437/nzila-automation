import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from '../components/Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies default variant styling', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge.className).toContain('bg-gray-100')
  })

  it('applies success variant', () => {
    render(<Badge variant="success">OK</Badge>)
    const badge = screen.getByText('OK')
    expect(badge.className).toContain('bg-green-100')
  })

  it('applies warning variant', () => {
    render(<Badge variant="warning">Warn</Badge>)
    const badge = screen.getByText('Warn')
    expect(badge.className).toContain('bg-yellow-100')
  })

  it('applies danger variant', () => {
    render(<Badge variant="danger">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge.className).toContain('bg-red-100')
  })

  it('applies info variant', () => {
    render(<Badge variant="info">Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge.className).toContain('bg-blue-100')
  })

  it('merges custom className', () => {
    render(<Badge className="extra">Styled</Badge>)
    const badge = screen.getByText('Styled')
    expect(badge.className).toContain('extra')
  })

  it('renders as a span element', () => {
    render(<Badge>Tag</Badge>)
    const badge = screen.getByText('Tag')
    expect(badge.tagName).toBe('SPAN')
  })
})
