'use client'

import { useState } from 'react'

interface Props {
  email: string
}

export default function AccountPage({ email }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setStatus('error'); setMessage('Les mots de passe ne correspondent pas'); return }
    if (password.length < 8) { setStatus('error'); setMessage('Minimum 8 caracteres'); return }
    setStatus('loading')
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, currentPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('ok')
      setMessage('Mot de passe enregistre. Tu peux maintenant te connecter avec ton email + mot de passe.')
      setPassword(''); setConfirm(''); setCurrentPassword('')
    } else {
      setStatus('error')
      setMessage(data.error ?? 'Erreur')
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mon compte</h1>
      <p className="text-gray-400 dark:text-white/30 text-sm mb-8">{email}</p>

      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-1">Mot de passe</h2>
        <p className="text-sm text-gray-400 dark:text-white/30 mb-5">
          Definis un mot de passe pour te connecter directement sans lien magique.
        </p>

        {status === 'ok' && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm">
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Mot de passe actuel</label>
            <input
              type="password" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Laisser vide si pas encore defini"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Nouveau mot de passe</label>
            <input
              type="password" value={password} required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caracteres"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Confirmer</label>
            <input
              type="password" value={confirm} required
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repete le mot de passe"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <button
            type="submit" disabled={status === 'loading'}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors">
            {status === 'loading' ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
