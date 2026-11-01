'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthShell, { AUTH_INPUT, AUTH_BTN } from '@/components/auth/AuthShell'

function ResetForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); return }
      setDone(true)
    } catch {
      setError('Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) return (
    <div className="space-y-3 text-sm text-white/60">
      <p>Lien invalide.</p>
      <Link href="/forgot-password" className="text-violet-400 hover:underline">Demander un nouveau lien</Link>
    </div>
  )
  if (done) return (
    <div className="space-y-3 text-sm text-white/60">
      <p>Mot de passe mis a jour.</p>
      <Link href="/login" className="inline-block text-violet-400 hover:underline">Se connecter &rarr;</Link>
    </div>
  )
  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nouveau mot de passe (8 caracteres minimum)" required minLength={8} autoComplete="new-password" className={AUTH_INPUT} />
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" required minLength={8} autoComplete="new-password" className={AUTH_INPUT} />
      {error && <p className="text-red-400 text-sm">{error} {error.startsWith('Lien') && <Link href="/forgot-password" className="underline">Nouveau lien</Link>}</p>}
      <button type="submit" disabled={loading} className={AUTH_BTN}>{loading ? 'Enregistrement...' : 'Enregistrer \u2192'}</button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Nouveau mot de passe">
      <Suspense><ResetForm /></Suspense>
    </AuthShell>
  )
}
