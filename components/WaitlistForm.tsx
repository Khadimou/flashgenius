'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        if (data.id) {
          sessionStorage.setItem('fg_id', data.id)
          sessionStorage.setItem('fg_email', email)
        }
        setTimeout(() => router.push('/merci'), 600)
      } else if (data.alreadyExists) {
        setStatus('error')
        setMsg("Cet email est deja inscrit !")
        setTimeout(() => { setStatus('idle'); setMsg('') }, 3000)
      } else {
        setStatus('error')
        setMsg(data.error ?? 'Une erreur est survenue')
        setTimeout(() => { setStatus('idle'); setMsg('') }, 3000)
      }
    } catch {
      setStatus('error')
      setMsg('Connexion impossible. Reessaie.')
      setTimeout(() => { setStatus('idle'); setMsg('') }, 3000)
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          required
          disabled={status === 'loading' || status === 'success'}
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 transition-all"
        />
        <button
          type="submit"
          disabled={!email || status === 'loading' || status === 'success'}
          className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap flex items-center gap-2 justify-center min-w-[180px]"
        >
          {status === 'loading' ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              En cours...
            </>
          ) : status === 'success' ? '✓ Inscrit !' : 'Je rejoins la liste →'}
        </button>
      </div>
      {msg && (
        <p className={'mt-2 text-sm text-center ' + (status === 'error' ? 'text-red-400' : 'text-green-400')}>
          {msg}
        </p>
      )}
    </form>
  )
}
