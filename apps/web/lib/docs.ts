import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'

export interface DocMeta {
  slug: string
  title: string
  description?: string
  date?: string
  category?: string
  order?: number
  readingTime?: number
  [key: string]: unknown
}

export interface Doc extends DocMeta {
  content: string
  htmlContent: string
  readingTime: number // minutes
}

/**
 * gray-matter parses YAML date scalars (e.g. 2026-02-01) into JS Date objects.
 * Always coerce to an ISO date string so React can render it safely.
 */
function dateToString(value: unknown): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

/**
 * Resolve the content directory. For apps/web, public content lives at
 * ../../content/public relative to the app root.
 */
function resolveContentDir(scope: 'public' | 'internal'): string {
  // Works for both dev and build: resolve relative to process.cwd()
  return path.join(process.cwd(), '..', '..', 'content', scope)
}

/**
 * Recursively find all .md files under a directory.
 */
function walkDir(dir: string, prefix = ''): string[] {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...walkDir(path.join(dir, entry.name), rel))
    } else if (entry.name.endsWith('.md') && entry.name !== 'README.md') {
      files.push(rel)
    }
  }
  return files
}

/**
 * Get metadata for all docs in the given scope.
 */
export function getAllDocs(scope: 'public' | 'internal' = 'public'): DocMeta[] {
  const contentDir = resolveContentDir(scope)
  const files = walkDir(contentDir)

  return files.map((file) => {
    const fullPath = path.join(contentDir, file)
    const raw = fs.readFileSync(fullPath, 'utf-8')
    const { data, content } = matter(raw)
    const slug = file.replace(/\.md$/, '')
    const wordCount = content.trim().split(/\s+/).length
    const readingTime = Math.max(1, Math.round(wordCount / 200))

    return {
      ...data,
      slug,
      title: (data.title as string) || slugToTitle(slug),
      description: data.description as string | undefined,
      date: dateToString(data.date),
      category: data.category as string | undefined,
      order: data.order as number | undefined,
      readingTime,
    }
  })
}

/**
 * Get a single doc by slug, with parsed HTML content.
 */
export async function getDocBySlug(
  slug: string,
  scope: 'public' | 'internal' = 'public',
): Promise<Doc | null> {
  const contentDir = resolveContentDir(scope)
  const filePath = path.join(contentDir, `${slug}.md`)

  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)

  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: { className: ['anchor-heading'] },
    })
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content)

  const wordCount = content.trim().split(/\s+/).length
  const readingTime = Math.max(1, Math.round(wordCount / 200))

  return {
    ...data,
    slug,
    title: (data.title as string) || slugToTitle(slug),
    description: data.description as string | undefined,
    date: dateToString(data.date),
    category: data.category as string | undefined,
    order: data.order as number | undefined,
    content,
    htmlContent: result.toString(),
    readingTime,
  }
}

/**
 * Get all slugs (for generateStaticParams).
 */
export function getAllDocSlugs(scope: 'public' | 'internal' = 'public'): string[][] {
  const docs = getAllDocs(scope)
  return docs.map((doc) => doc.slug.split('/'))
}

/**
 * Convert a slug like "getting-started/installation" to "Installation".
 */
function slugToTitle(slug: string): string {
  const last = slug.split('/').pop() || slug
  return last
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
