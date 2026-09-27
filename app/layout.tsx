import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlashGenius - Transforme tes cours en flashcards en quelques secondes',
  description: "Colle ton cours. L'IA genere automatiquement tes flashcards. Rejoins la liste d'attente.",
  openGraph: {
    title: 'FlashGenius - Turn anything into flashcards.',
    description: "Colle ton cours. L'IA genere tes flashcards. Tu revises. Tu memorises.",
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#050510] text-white antialiased">{children}</body>
    </html>
  )
}
