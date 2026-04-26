import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'City of Karis',
    short_name: 'Karis',
    description: 'Beautiful, Empowered Living in Guyana',
    start_url: '/wallet',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FDFCFB',
    theme_color: '#1E2E23',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
