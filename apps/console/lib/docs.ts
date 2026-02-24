import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

export interface DocMeta {
  slug: string
  title: string
  description?: string
  date?: string
  category?: string
  order?: number
  [key: string]: unknown
}

export interface Doc extends DocMeta {
  content: string
  htmlContent: string
}

function resolveContentDir(): string {
  return path.join(process.cwd(), '..', '..', 'content', 'internal')
}

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

export function getAllInternalDocs(): DocMeta[] {
  const contentDir = resolveContentDir()
  const files = walkDir(contentDir)
  return files.map((file) => {
    const fullPath = path.join(contentDir, file)
    const raw = fs.readFileSync(fullPath, 'utf-8')
    const { data } = matter(raw)
    const slug = file.replace(/\.md$/, '')
    return {
      slug,
      title: (data.title as string) || slugToTitle(slug),
      description: data.description as string | undefined,
      date: data.date as string | undefined,
      category: data.category as string | undefined,
      order: data.order as number | undefined,
      ...data,
    }
  })
}

export async function getInternalDocBySlug(slug: string): Promise<Doc | null> {
  const contentDir = resolveContentDir()
  const filePath = path.join(contentDir, `${slug}.md`)
  // Prevent path traversal — resolved path must stay within contentDir
  const resolvedContent = path.resolve(contentDir)
  const resolvedFile = path.resolve(filePath)
  if (!resolvedFile.startsWith(resolvedContent + path.sep)) return null
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const result = await remark().use(html).process(content)
  return {
    slug,
    title: (data.title as string) || slugToTitle(slug),
    description: data.description as string | undefined,
    date: data.date as string | undefined,
    category: data.category as string | undefined,
    order: data.order as number | undefined,
    content,
    htmlContent: result.toString(),
    ...data,
  }
}

export function getAllInternalDocSlugs(): string[][] {
  const docs = getAllInternalDocs()
  return docs.map((doc) => doc.slug.split('/'))
}

function slugToTitle(slug: string): string {
  const last = slug.split('/').pop() || slug
  return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
