import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/fr/dashboard', '/en/dashboard'],
    },
    sitemap: 'https://www.unipaycongo.com/sitemap.xml',
  };
}
