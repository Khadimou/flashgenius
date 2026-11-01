'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import AuthShell, { AUTH_INPUT, AUTH_BTN } from '@/components/auth/AuthShell'

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); return }
      const s = await signIn('credentials', { email, password, redirect: false })
      window.location.href = s?.ok ? '/app' : '/login'
    } catch {
      setError('Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Creer un compte">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {([['STUDENT', 'Eleve', 'Je revise et je passe des QCM'], ['TEACHER', 'Enseignant', 'Je cree des cours et des QCM']] as const).map(([k, l, d]) => (
            <button type="button" key={k} onClick={() => setRole(k)}
              className={'p-3 rounded-xl border text-left transition-all ' + (role === k ? 'border-violet-500 bg-violet-600/20' : 'border-white/10 hover:border-white/25')}>
              <span className="block text-sm font-semibold text-white">{l}</span>
              <span className="block text-xs text-white/40 mt-0.5">{d}</span>
            </button>
          ))}
        </div>
        <input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ton nom" required autoComplete="name" className={AUTH_INPUT} />
        <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" required autoComplete="email" className={AUTH_INPUT} />
        <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe (8 caracteres minimum)" required minLength={8} autoComplete="new-password" className={AUTH_INPUT} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className={AUTH_BTN}>{loading ? 'Creation...' : 'Creer mon compte \u2192'}</button>
        <p className="text-center text-white/40 text-sm pt-1">
          Deja un compte ? <Link href="/login" className="text-violet-400 hover:underline">Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  )
}
