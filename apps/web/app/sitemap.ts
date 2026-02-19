import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nzilaventures.com';
  const lastModified = new Date();

  const routes = [
    '',
    '/about',
    '/investors',
    '/products',
    '/portfolio',
    '/verticals',
    '/platform',
    '/contact',
    '/resources',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/investors' ? 0.9 : 0.8,
  }));
}
