/**
 * Web — Content Publishing Service Tests
 */
import { describe, it, expect } from 'vitest'

interface ContentPage {
  slug: string
  title: string
  body: string
  status: 'draft' | 'published' | 'archived'
  publishedAt: string | null
  author: string
}

function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

function publishContent(page: ContentPage): ContentPage {
  return {
    ...page,
    status: 'published',
    publishedAt: new Date().toISOString(),
  }
}

function archiveContent(page: ContentPage): ContentPage {
  return { ...page, status: 'archived' }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

describe('Content Publishing Service', () => {
  const draftPage: ContentPage = {
    slug: 'about-us',
    title: 'About Us',
    body: 'Learn about our company.',
    status: 'draft',
    publishedAt: null,
    author: 'admin',
  }

  it('validates correct slug format', () => {
    expect(validateSlug('hello-world')).toBe(true)
    expect(validateSlug('page-1')).toBe(true)
  })

  it('rejects invalid slugs', () => {
    expect(validateSlug('Hello World')).toBe(false)
    expect(validateSlug('page/1')).toBe(false)
    expect(validateSlug('')).toBe(false)
  })

  it('publishes draft content', () => {
    const published = publishContent(draftPage)
    expect(published.status).toBe('published')
    expect(published.publishedAt).toBeDefined()
  })

  it('archives published content', () => {
    const published = publishContent(draftPage)
    const archived = archiveContent(published)
    expect(archived.status).toBe('archived')
  })

  it('generates slug from title', () => {
    expect(generateSlug('About Us')).toBe('about-us')
    expect(generateSlug('Hello, World!')).toBe('hello-world')
    expect(generateSlug('  spaces  everywhere  ')).toBe('spaces-everywhere')
  })

  it('preserves author through transitions', () => {
    const published = publishContent(draftPage)
    expect(published.author).toBe('admin')
  })
})
