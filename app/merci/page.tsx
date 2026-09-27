import Link from 'next/link'
import SurveyForm from '@/components/SurveyForm'

export default function MerciPage() {
  return (
    <div className="min-h-screen bg-[#050510]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-950/40 blur-[100px]" />
      </div>

      <nav className="relative z-10 px-6 py-5 max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-75 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-sm">F</div>
          <span className="font-bold text-lg">FlashGenius</span>
        </Link>
      </nav>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-8 pb-24">
        <div className="text-center mb-12">
          <div className="text-5xl mb-5">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-3">Tu es sur la liste !</h1>
          <p className="text-white/50 leading-relaxed">
            Tu seras parmi les premiers informes quand la beta sera prete.
            <br />Merci de croire au projet.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
          <div className="mb-7">
            <h2 className="text-xl font-bold text-white mb-1">Une derniere question 👇</h2>
            <p className="text-white/40 text-sm">2 minutes. Ca m'aide a construire la bonne app.</p>
          </div>
          <SurveyForm />
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/35 text-sm mb-4">Tu connais quelqu'un qui galerait aussi ?</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <a
              href="https://twitter.com/intent/tweet?text=Je%20viens%20de%20rejoindre%20la%20liste%20d%27attente%20de%20FlashGenius%20%E2%80%94%20une%20app%20qui%20transforme%20tes%20cours%20en%20flashcards%20avec%20l%27IA%20%F0%9F%A7%A0"
              target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/55 hover:text-white text-sm transition-all">
              Partager sur X →
            </a>
            <Link href="/" className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/55 hover:text-white text-sm transition-all">
              ← Retour
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
