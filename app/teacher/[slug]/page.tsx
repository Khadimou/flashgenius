import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const teacher = await prisma.user.findUnique({
    where: { slug: params.slug, role: 'TEACHER' },
    select: { name: true, subject: true },
  })
  if (!teacher) return { title: 'Enseignant introuvable' }
  return {
    title: `${teacher.name ?? 'Enseignant'} — FlashGenius`,
    description: teacher.subject ? `Cours de ${teacher.subject} sur FlashGenius` : 'Profil enseignant FlashGenius',
  }
}

export default async function TeacherProfilePage({ params }: Props) {
  const teacher = await prisma.user.findUnique({
    where: { slug: params.slug, role: 'TEACHER' },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      subject: true,
      slug: true,
      decks: {
        where: { shareStatus: 'REVISION' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: { select: { cards: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!teacher) notFound()

  const teacherName = teacher.name ?? teacher.email?.split('@')[0] ?? 'Enseignant'
  const initial = teacherName[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050510]">
      {/* Header bar */}
      <div className="border-b border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#070714]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white">F</div>
          <Link href="/" className="font-bold text-gray-900 dark:text-white">FlashGenius</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Teacher profile */}
        <div className="flex items-start gap-5 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shrink-0">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{teacherName}</h1>
            {teacher.subject && (
              <p className="text-violet-600 dark:text-violet-400 font-medium text-sm mt-0.5">{teacher.subject}</p>
            )}
            {teacher.bio && (
              <p className="text-gray-500 dark:text-white/50 text-sm mt-2 max-w-xl">{teacher.bio}</p>
            )}
            <p className="text-xs text-gray-400 dark:text-white/25 mt-2">
              {teacher.decks.length} cours disponible{teacher.decks.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Courses */}
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Cours disponibles</h2>

        {teacher.decks.length === 0 ? (
          <p className="text-gray-400 dark:text-white/30 text-sm">Aucun cours partage pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teacher.decks.map((deck) => (
              <div key={deck.id}
                className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-5 hover:border-violet-300 dark:hover:border-violet-500/30 transition-all">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{deck.name}</h3>
                <p className="text-xs text-gray-400 dark:text-white/30 mb-4">
                  {deck._count.cards} cartes &middot; {deck._count.enrollments} inscrit{deck._count.enrollments > 1 ? 's' : ''}
                </p>
                <Link
                  href={`/join/${deck.id}`}
                  className="block w-full text-center py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all">
                  Rejoindre
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
