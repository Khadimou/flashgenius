'use client'

import { useState, useEffect } from 'react'

interface AccountData {
  email: string
  name: string
  role: 'STUDENT' | 'TEACHER'
  bio: string
  subject: string
  slug: string
}

export default function AccountForm({ email }: { email: string }) {
  const [data, setData] = useState<AccountData>({ email, name: '', role: 'STUDENT', bio: '', subject: '', slug: '' })
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwStatus, setPwStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [pwMessage, setPwMessage] = useState('')
  const [profileStatus, setProfileStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [becomingTeacher, setBecomingTeacher] = useState(false)

  useEffect(() => {
    fetch('/api/account/me')
      .then((r) => r.json())
      .then((d) => setData({
        email: d.email ?? email,
        name: d.name ?? '',
        role: d.role ?? 'STUDENT',
        bio: d.bio ?? '',
        subject: d.subject ?? '',
        slug: d.slug ?? '',
      }))
  }, [email])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileStatus('loading')
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, bio: data.bio, subject: data.subject, slug: data.slug }),
    })
    const d = await res.json()
    if (res.ok) {
      setData((prev) => ({ ...prev, ...d }))
      setProfileStatus('ok')
      setTimeout(() => setProfileStatus('idle'), 2500)
    } else {
      setProfileStatus('error')
      setTimeout(() => setProfileStatus('idle'), 3000)
      setPwMessage(d.error ?? 'Erreur')
    }
  }

  async function becomeTeacher() {
    setBecomingTeacher(true)
    const res = await fetch('/api/account/role', { method: 'POST' })
    const d = await res.json()
    if (res.ok) setData((prev) => ({ ...prev, role: 'TEACHER', slug: d.slug ?? prev.slug }))
    setBecomingTeacher(false)
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setPwStatus('error'); setPwMessage('Les mots de passe ne correspondent pas'); return }
    if (password.length < 8) { setPwStatus('error'); setPwMessage('Minimum 8 caracteres'); return }
    setPwStatus('loading')
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, currentPassword }),
    })
    const d = await res.json()
    if (res.ok) {
      setPwStatus('ok')
      setPwMessage('Mot de passe enregistre. Tu peux maintenant te connecter avec ton email + mot de passe.')
      setPassword(''); setConfirm(''); setCurrentPassword('')
    } else {
      setPwStatus('error')
      setPwMessage(d.error ?? 'Erreur')
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://flashgenius-rho.vercel.app'

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Mon compte</h1>
        <p className="text-gray-400 dark:text-white/30 text-sm">{data.email}</p>
      </div>

      {/* ── Profile ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-1">Profil</h2>
        <p className="text-sm text-gray-400 dark:text-white/30 mb-5">
          Nom, matiere et bio visibles sur ton profil public.
        </p>

        {profileStatus === 'ok' && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm">
            Profil mis a jour.
          </div>
        )}
        {profileStatus === 'error' && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm">
            {pwMessage}
          </div>
        )}

        <form onSubmit={saveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Nom affiché</label>
            <input
              type="text" value={data.name}
              onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ton nom ou pseudo"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          {data.role === 'TEACHER' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Matiere</label>
                <input
                  type="text" value={data.subject}
                  onChange={(e) => setData((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="ex : SVT — Lycee, Maths Terminale..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Bio (optionnelle)</label>
                <textarea
                  value={data.bio} rows={3}
                  onChange={(e) => setData((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Quelques mots sur toi..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">
                  URL de ton profil public
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-white/30 shrink-0">{baseUrl}/teacher/</span>
                  <input
                    type="text" value={data.slug}
                    onChange={(e) => setData((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="ton-nom"
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  />
                </div>
              </div>
            </>
          )}
          <button
            type="submit" disabled={profileStatus === 'loading'}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors">
            {profileStatus === 'loading' ? 'Enregistrement...' : 'Enregistrer le profil'}
          </button>
        </form>
      </div>

      {/* ── Become teacher ─────────────────────────────────────── */}
      {data.role === 'STUDENT' && (
        <div className="bg-white dark:bg-white/[0.03] border border-violet-200 dark:border-violet-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">&#127979;</div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-1">Espace enseignant</h2>
              <p className="text-sm text-gray-400 dark:text-white/40 mb-4">
                Partage tes cours avec tes eleves, controle l&apos;acces en mode examen et suis les inscriptions.
              </p>
              <button onClick={becomeTeacher} disabled={becomingTeacher}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all">
                {becomingTeacher ? 'Activation...' : 'Activer le mode enseignant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {data.role === 'TEACHER' && data.slug && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-lg">&#10003;</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Mode enseignant actif</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 truncate">
              Profil public : {baseUrl}/teacher/{data.slug}
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${baseUrl}/teacher/${data.slug}`)}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
            Copier
          </button>
        </div>
      )}

      {/* ── Password ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] rounded-2xl p-6">
        <h2 className="font-semibold text-gray-800 dark:text-white mb-1">Mot de passe</h2>
        <p className="text-sm text-gray-400 dark:text-white/30 mb-5">
          Definis un mot de passe pour te connecter directement sans lien magique.
        </p>

        {pwStatus === 'ok' && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm">
            {pwMessage}
          </div>
        )}
        {pwStatus === 'error' && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm">
            {pwMessage}
          </div>
        )}

        <form onSubmit={submitPassword} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Mot de passe actuel</label>
            <input
              id="current-password" name="current-password" type="password" autoComplete="current-password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Laisser vide si pas encore defini"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Nouveau mot de passe</label>
            <input
              id="new-password" name="new-password" type="password" autoComplete="new-password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caracteres"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-white/40 mb-1">Confirmer</label>
            <input
              id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repete le mot de passe"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <button
            type="submit" disabled={pwStatus === 'loading'}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors">
            {pwStatus === 'loading' ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
