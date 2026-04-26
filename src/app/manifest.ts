import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Code Link Editor',
    short_name: 'Link Editor',
    description: 'A powerful code editor for collaborative work',
    start_url: '/',
    display: 'standalone',
    background_color: '#19303F',
    theme_color: '#19303F',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
