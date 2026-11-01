'use client'

import { useState } from 'react'
import Link from 'next/link'
import AuthShell, { AUTH_INPUT, AUTH_BTN } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null)
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthShell title="Mot de passe oublie">
      {sent ? (
        <div className="space-y-3 text-sm text-white/60 leading-relaxed">
          <p>Si un compte existe pour <strong className="text-white/80">{email}</strong>, un lien de reinitialisation vient d&apos;etre envoye. Il est valable 1 heure.</p>
          <p className="text-white/30 text-xs">Pense a verifier tes spams.</p>
          <Link href="/login" className="inline-block text-violet-400 hover:underline">Retour a la connexion</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-white/50">Entre ton email : nous t&apos;envoyons un lien pour choisir un nouveau mot de passe.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" required autoComplete="email" className={AUTH_INPUT} />
          <button type="submit" disabled={loading || !email} className={AUTH_BTN}>{loading ? 'Envoi...' : 'Envoyer le lien \u2192'}</button>
          <p className="text-center text-sm pt-1"><Link href="/login" className="text-white/40 hover:text-white/70">Retour a la connexion</Link></p>
        </form>
      )}
    </AuthShell>
  )
}
