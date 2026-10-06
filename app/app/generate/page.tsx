'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FlashCard from '@/components/app/FlashCard'
import CardEditor, { CardDraft } from '@/components/app/CardEditor'

interface Card extends CardDraft { id: string }

function uniqueCategories(cards: CardDraft[]) {
  return Array.from(new Set(cards.map((c) => c.category).filter(Boolean)))
}

export default function GeneratePage() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [deckName, setDeckName] = useState('')
  const [error, setError] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [isPremium, setIsPremium] = useState<boolean | null>(null)
  const [showPremiumGate, setShowPremiumGate] = useState(false)
  const [usageCount, setUsageCount] = useState<number | null>(null)
  const [usageLimit, setUsageLimit] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const categories = uniqueCategories(cards)
  const MIN = 20
  const FREE_LIMIT = 10

  useEffect(() => {
    fetch('/api/account/me')
      .then((r) => r.json())
      .then((d) => {
        setIsPremium(!!d.isPremium)
        setUsageCount(d.generationsCount ?? 0)
        setUsageLimit(d.isPremium ? null : FREE_LIMIT)
      })
      .catch(() => setIsPremium(false))
  }, [])

  async function generate() {
    if (text.trim().length < MIN || generating) return
    setGenerating(true)
    setError('')
    setCards([])
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur'); return }
      setCards(data.cards.map((c: CardDraft, i: number) => ({ ...c, id: String(i) })))
      if (data.usage) {
        setUsageCount(data.usage.used)
        if (!data.usage.isPremium) setUsageLimit(data.usage.limit)
      }
    } catch {
      setError('Connexion impossible')
    } finally {
      setGenerating(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type === 'text/plain' || file.name.endsWith('.md')) {
      const reader = new FileReader()
      reader.onload = (ev) => setText(ev.target?.result as string ?? '')
      reader.readAsText(file)
    } else {
      setError('Formats supportes : .txt, .md — Pour PDF, copiez-collez le texte directement.')
    }
    e.target.value = ''
  }

  async function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.size > 25 * 1024 * 1024) {
      setError('Fichier trop volumineux — maximum 25 MB.')
      return
    }

    setTranscribing(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de la transcription')
        return
      }
      setText(data.transcript)
    } catch {
      setError('Connexion impossible lors de la transcription')
    } finally {
      setTranscribing(false)
    }
  }

  function handleVideoBtnClick() {
    if (isPremium === false) {
      setShowPremiumGate(true)
      return
    }
    videoRef.current?.click()
  }

  function updateCard(idx: number, updated: CardDraft) {
    setCards((cs) => cs.map((c, i) => i === idx ? { ...c, ...updated } : c))
    setEditingIdx(null)
  }

  function deleteCard(idx: number) {
    setCards((cs) => cs.filter((_, i) => i !== idx))
  }

  function addCard() {
    const newCard: Card = {
      id: 'new-' + Date.now(),
      question: '', answer: '',
      category: categories[0] ?? 'General',
    }
    setCards((cs) => [...cs, newCard])
    setEditingIdx(cards.length)
  }

  function moveCard(idx: number, dir: -1 | 1) {
    const next = idx + dir
    if (next < 0 || next >= cards.length) return
    const cs = [...cards]
    ;[cs[idx], cs[next]] = [cs[next], cs[idx]]
    setCards(cs)
  }

  async function save() {
    if (!deckName.trim() || saving) return
    setSaving(true)
    try {
      const validCards = cards.filter((c) => c.question.trim() && c.answer.trim())
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deckName.trim(), cards: validCards }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      router.push('/app/deck/' + data.deck.id)
    } catch {
      setError('Erreur lors de la sauvegarde')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">&#9889; Generer des flashcards</h1>
        <p className="text-gray-500 dark:text-white/40 mt-1 text-sm">Collez votre cours &#8212; l'IA cree les flashcards automatiquement.</p>
      </div>

      {/* Input */}
      {cards.length === 0 && (
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder={transcribing ? 'Transcription en cours...' : 'Collez votre cours, vos notes ou n\'importe quel texte a memoriser...'}
              rows={10}
              disabled={transcribing}
              className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.07] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none transition-all disabled:opacity-50"
            />
            <div className="absolute bottom-3 right-4 text-xs text-gray-400 dark:text-white/25">
              {text.length.toLocaleString('fr-FR')} / 30&nbsp;000
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={generate}
              disabled={text.trim().length < MIN || generating || transcribing}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
              {generating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generation en cours...
                </>
              ) : '&#9889; Generer les flashcards'}
            </button>

            <button onClick={() => fileRef.current?.click()}
              disabled={transcribing}
              className="px-5 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-white/60 border border-gray-200 dark:border-white/10 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all bg-white dark:bg-transparent disabled:opacity-40">
              &#128196; Importer un fichier (.txt, .md)
            </button>
            <input ref={fileRef} type="file" accept=".txt,.md" onChange={handleFile} className="hidden" />

            {/* Video/audio premium button */}
            <button onClick={handleVideoBtnClick}
              disabled={transcribing}
              className="px-5 py-3 rounded-xl text-sm font-medium border transition-all flex items-center gap-2 bg-white dark:bg-transparent disabled:opacity-40
                text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40
                hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10">
              {transcribing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Transcription...
                </>
              ) : (
                <>
                  &#127909; Video / Audio
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 ml-1">
                    PREMIUM
                  </span>
                </>
              )}
            </button>
            <input ref={videoRef} type="file"
              accept=".mp4,.mp3,.m4a,.wav,.webm,.mpeg,.mpga,.ogg,video/*,audio/*"
              onChange={handleVideo} className="hidden" />

            {text.length > 0 && text.trim().length < MIN && (
              <p className="text-amber-500 text-xs">Minimum {MIN} caracteres requis</p>
            )}
          </div>

          {/* Usage counter */}
          {usageLimit !== null && usageCount !== null && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden max-w-[180px]">
                <div
                  className={"h-full rounded-full transition-all " + (usageCount >= usageLimit ? "bg-red-400" : usageCount >= usageLimit * 0.8 ? "bg-amber-400" : "bg-violet-500")}
                  style={{ width: `${Math.min(100, (usageCount / usageLimit) * 100)}%` }}
                />
              </div>
              <span className={"text-xs " + (usageCount >= usageLimit ? "text-red-400 font-medium" : "text-gray-400 dark:text-white/35")}>
                {usageCount} / {usageLimit} ce mois
              </span>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {/* Generated cards */}
      {cards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">{cards.length} flashcards generees</h2>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">Modifiez, reordonnez ou supprimez des cartes avant de sauvegarder.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setCards([]); setText('') }}
                className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white border border-gray-200 dark:border-white/10 transition-all">
                &#8592; Recommencer
              </button>
              <button onClick={addCard}
                className="px-4 py-2 rounded-xl text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-all">
                + Ajouter une carte
              </button>
              <button onClick={() => setShowSaveModal(true)}
                disabled={cards.filter((c) => c.question && c.answer).length === 0}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition-all">
                Sauvegarder &#8594;
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {/* Categories legend */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map((cat, i) => (
                <span key={cat} className={'px-3 py-1 rounded-full text-xs font-medium ' +
                  ['bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
                   'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
                   'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
                   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                   'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'][i % 5]}>
                  {cat} ({cards.filter((c) => c.category === cat).length})
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((card, idx) =>
              editingIdx === idx ? (
                <CardEditor key={card.id} card={card} categories={categories}
                  onSave={(u) => updateCard(idx, u)} onCancel={() => setEditingIdx(null)} />
              ) : (
                <div key={card.id} className="relative group/wrap">
                  <FlashCard card={card} categories={categories} showActions
                    onEdit={() => setEditingIdx(idx)} onDelete={() => deleteCard(idx)} />
                  <div className="absolute bottom-2 left-2 hidden group-hover/wrap:flex gap-1">
                    <button onClick={() => moveCard(idx, -1)} disabled={idx === 0}
                      className="w-6 h-6 rounded-md bg-black/30 dark:bg-black/50 text-white/60 hover:text-white disabled:opacity-20 text-xs flex items-center justify-center">&#9650;</button>
                    <button onClick={() => moveCard(idx, 1)} disabled={idx === cards.length-1}
                      className="w-6 h-6 rounded-md bg-black/30 dark:bg-black/50 text-white/60 hover:text-white disabled:opacity-20 text-xs flex items-center justify-center">&#9660;</button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Save modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f0f1a] border border-gray-200 dark:border-white/[0.08] rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">Sauvegarder le deck</h3>
            <p className="text-sm text-gray-500 dark:text-white/40 mb-5">
              {cards.filter((c) => c.question && c.answer).length} cartes valides
            </p>
            <input
              value={deckName} onChange={(e) => setDeckName(e.target.value)}
              placeholder="Nom du deck (ex: Biologie - Mitose)"
              onKeyDown={(e) => e.key === 'Enter' && save()}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowSaveModal(false)}
                className="flex-1 py-3 rounded-xl text-sm text-gray-500 dark:text-white/40 border border-gray-200 dark:border-white/10 hover:text-gray-700 dark:hover:text-white transition-colors">
                Annuler
              </button>
              <button onClick={save} disabled={!deckName.trim() || saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40 transition-colors">
                {saving ? 'Sauvegarde...' : 'Sauvegarder \u2192'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium gate modal */}
      {showPremiumGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#0f0f1a] border border-amber-200 dark:border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="text-3xl mb-3">&#127775;</div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">Fonctionnalite Premium</h3>
            <p className="text-sm text-gray-500 dark:text-white/50 mb-5 leading-relaxed">
              L'import video et audio avec transcription IA (Whisper) est reserve aux membres Premium.<br/><br/>
              Envoyez-nous un email a <a href="mailto:support@flashgenius.app" className="text-violet-400 hover:underline">support@flashgenius.app</a> pour activer votre acces Premium.
            </p>
            <button onClick={() => setShowPremiumGate(false)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all">
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
