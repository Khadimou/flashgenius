'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'sent'>('idle')
  const params = useSearchParams()
  const verify = params.get('verify')
  const error = params.get('error')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status !== 'idle') return
    setStatus('loading')
    await signIn('email', { email, callbackUrl: '/app', redirect: false })
    setStatus('sent')
  }

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-950/40 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center mb-10 hover:opacity-75 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black">F</div>
          <span className="font-bold text-xl text-white">FlashGenius</span>
        </Link>

        {verify ? (
          <div className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-bold text-white mb-2">Verifie ta messagerie</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Un lien de connexion a ete envoye a <strong className="text-white/80">{email}</strong>.
              <br />Clique dessus pour te connecter.
            </p>
            <p className="text-white/30 text-xs mt-6">
              Pas recu ? Verifie tes spams ou{' '}
              <button onClick={() => setStatus('idle')} className="text-violet-400 underline">reessaie</button>.
            </p>
          </div>
        ) : status === 'sent' ? (
          <div className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-xl font-bold text-white mb-2">Verifie ta messagerie</h2>
            <p className="text-white/50 text-sm">
              Lien de connexion envoye a <strong className="text-white/80">{email}</strong>
            </p>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <h1 className="text-2xl font-bold text-white mb-1">Connexion</h1>
            <p className="text-white/50 text-sm mb-7">
              Entre ton email — on t'envoie un lien magique.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/30 text-red-400 text-sm">
                Lien invalide ou expire. Reessaie.
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com" required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
              <button
                type="submit" disabled={!email || status === 'loading'}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
              >
                {status === 'loading' ? 'Envoi...' : 'Recevoir le lien →'}
              </button>
            </form>

            <p className="mt-5 text-center text-white/25 text-xs">
              Pas de mot de passe. Juste un lien dans ta boite mail.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
