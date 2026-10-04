'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginForm() {
  const [tab, setTab] = useState<'password'|'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'sent'|'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const params = useSearchParams()
  const verify = params.get('verify')
  const error = params.get('error')

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) {
      window.location.href = '/app'
    } else {
      setStatus('error')
      setErrorMsg('Email ou mot de passe incorrect.')
    }
  }

  async function submitMagic(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status !== 'idle') return
    setStatus('loading')
    await signIn('email', { email, callbackUrl: '/app', redirect: false })
    setStatus('sent')
  }

  if (verify) return (
    <div className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      <div className="text-4xl mb-4">📬</div>
      <h2 className="text-xl font-bold text-white mb-2">Verifie ta messagerie</h2>
      <p className="text-white/50 text-sm leading-relaxed">
        Un lien de connexion a ete envoye. Clique dessus pour te connecter.
      </p>
    </div>
  )

  if (status === 'sent') return (
    <div className="text-center p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      <div className="text-4xl mb-4">📬</div>
      <h2 className="text-xl font-bold text-white mb-2">Verifie ta messagerie</h2>
      <p className="text-white/50 text-sm">Lien envoye a <strong className="text-white/80">{email}</strong></p>
      <p className="text-white/30 text-xs mt-4">Le lien est valide 72h.</p>
    </div>
  )

  return (
    <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      <h1 className="text-2xl font-bold text-white mb-6">Connexion</h1>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-800/30 text-amber-400 text-sm leading-relaxed">
          <strong className="block mb-1">Lien expire ou deja utilise.</strong>
          Entre ton email ci-dessous pour recevoir un nouveau lien.
        </div>
      )}

      <div className="flex rounded-xl bg-white/5 p-1 mb-6">
        <button onClick={() => { setTab('password'); setStatus('idle') }}
          className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all ' + (tab === 'password' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70')}>
          Mot de passe
        </button>
        <button onClick={() => { setTab('magic'); setStatus('idle') }}
          className={'flex-1 py-2 rounded-lg text-sm font-medium transition-all ' + (tab === 'magic' ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70')}>
          Lien magique
        </button>
      </div>

      {tab === 'password' ? (
        <form onSubmit={submitPassword} className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com" required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe" required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
          {status === 'error' && <p className="text-red-400 text-sm">{errorMsg}</p>}
          <button type="submit" disabled={status === 'loading'}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all">
            {status === 'loading' ? 'Connexion...' : 'Se connecter →'}
          </button>
          <p className="text-center text-white/25 text-xs pt-1">
            Pas encore de mot de passe ? Connecte-toi avec un lien magique, puis definis-le dans Parametres.
          </p>
        </form>
      ) : (
        <form onSubmit={submitMagic} className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com" required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all" />
          <button type="submit" disabled={!email || status === 'loading'}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all">
            {status === 'loading' ? 'Envoi...' : 'Recevoir le lien →'}
          </button>
          <p className="text-center text-white/25 text-xs">Pas de mot de passe. Un lien dans ta boite mail.</p>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
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
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
