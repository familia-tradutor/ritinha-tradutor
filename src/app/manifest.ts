import { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ritinha Tradutor',
    short_name: 'Ritinha',
    description: 'Tradutor da Ritinha - Voz e Câmera',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#FFD700',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
