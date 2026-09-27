import { Suspense } from 'react'
import WaitlistForm from '@/components/WaitlistForm'
import FlashcardDemo from '@/components/FlashcardDemo'
import { getSubscriberCount } from '@/lib/storage'

export const revalidate = 60

async function Counter() {
  const n = await getSubscriberCount()
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/50">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      {n > 0 ? `${n} personnes deja inscrites` : 'Sois parmi les premiers'}
    </span>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* Glow background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-violet-950/50 blur-[130px]" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full bg-indigo-950/30 blur-[100px]" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-violet-950/20 blur-[80px]" />
      </div>

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-sm">F</div>
          <span className="font-bold text-lg tracking-tight">FlashGenius</span>
        </div>
        <a href="#waitlist" className="text-sm font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all bg-white/5 hover:bg-white/10">
          Rejoindre →
        </a>
      </nav>

      {/* HERO */}
      <section className="relative z-10 text-center px-6 pt-16 pb-28 max-w-4xl mx-auto">
        <div className="anim-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-300 text-xs font-semibold tracking-wide mb-8">
          <span>✨</span>
          <span>Build in public · Validation d'idee · Beta iOS bientot</span>
        </div>

        <h1 className="anim-2 text-5xl sm:text-6xl md:text-[72px] font-black tracking-tight leading-[1.05] mb-6">
          <span className="text-white">Tu passes encore des heures</span>
          <br />
          <span className="gradient-text">a creer tes flashcards ?</span>
        </h1>

        <p className="anim-3 text-xl sm:text-2xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
          Colle ton cours.{' '}
          <span className="text-white/75">L'IA le transforme en flashcards.</span>
          <br />
          Tu revises. Tu memorises.
        </p>

        <div id="waitlist" className="anim-4 mb-6">
          <WaitlistForm />
        </div>

        <div className="anim-5">
          <Suspense fallback={
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/40">
              <span className="w-2 h-2 rounded-full bg-green-400" />Chargement...
            </span>
          }>
            <Counter />
          </Suspense>
        </div>
      </section>

      {/* STORY */}
      <section className="relative z-10 px-6 py-10 max-w-2xl mx-auto text-center">
        <blockquote className="border border-white/[0.08] rounded-2xl bg-white/[0.02] p-8 text-white/50 italic text-base leading-relaxed">
          "J'ai developpe cette app pour moi parce que je perdais trop de temps a
          transformer mes cours en flashcards. Je l'utilise tellement que je me demande
          si je suis le seul a avoir ce probleme."
          <footer className="mt-4 text-white/30 text-sm not-italic">— Le createur de FlashGenius</footer>
        </blockquote>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Comment ca marche ?</h2>
          <p className="text-white/40">Trois etapes. Dix secondes.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { n:'01', icon:'📋', title:'Colle ton contenu', desc:"Un cours, des notes, un article — n'importe quel texte que tu veux memoriser." },
            { n:'02', icon:'⚡', title:"L'IA genere", desc:"L'IA analyse ton contenu et cree des flashcards ciblees en quelques secondes." },
            { n:'03', icon:'🧠', title:'Tu memorises', desc:"Revise directement dans l'app. La repetition espacee fait le reste." },
          ].map((s) => (
            <div key={s.n} className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/30 transition-all">
              <div className="text-4xl mb-4">{s.icon}</div>
              <div className="text-xs font-bold text-violet-500 tracking-widest mb-2">{s.n}</div>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section className="relative z-10 px-6 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Voir en action</h2>
            <p className="text-white/40 text-sm">Flashcards generees depuis un vrai cours</p>
          </div>
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.07]">
            <FlashcardDemo />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative z-10 px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Pourquoi FlashGenius ?</h2>
          <p className="text-white/40">Pour ceux qui veulent apprendre, pas creer des fiches.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon:'⚡', t:'Ultra rapide', d:"10 secondes pour transformer un cours entier en flashcards pretes a reviser." },
            { icon:'🎯', t:'Cible', d:"L'IA identifie les notions cles. Pas du copier-coller — de la vraie extraction." },
            { icon:'📱', t:"Mobile d'abord", d:"Concu pour reviser dans le metro, entre deux cours, partout." },
            { icon:'🔁', t:'Repetition espacee', d:"La methode scientifiquement prouvee la plus efficace pour memoriser durablement." },
            { icon:'✍️', t:'Tout format', d:"Cours, notes, articles, resumes — tout devient des flashcards utilisables." },
            { icon:'🚀', t:'iOS bientot', d:"Je valide l'interet avant de developper l'app native. Tu fais partie du voyage." },
          ].map((f) => (
            <div key={f.t} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-violet-500/25 hover:bg-white/[0.05] transition-all">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1">{f.t}</h3>
              <p className="text-white/45 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-24 max-w-3xl mx-auto text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-violet-950/50 to-indigo-950/30 border border-violet-800/25">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Je cherche{' '}
            <span className="gradient-text">100 personnes</span>
            <br />pour tester l'idee.
          </h2>
          <p className="text-white/50 text-lg mb-8 max-w-md mx-auto">
            Inscription 100% gratuite. Un seul email quand la beta sera prete. Aucun spam.
          </p>
          <WaitlistForm />
          <p className="mt-4 text-white/25 text-xs">Pas de spam · Desabonnement en 1 clic</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black">F</div>
            <span className="text-white/35 text-sm">FlashGenius — Build in public</span>
          </div>
          <p className="text-white/25 text-xs">2026 · Fait avec amour pour tous ceux qui apprennent</p>
        </div>
      </footer>

    </div>
  )
}
