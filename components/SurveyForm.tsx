'use client'

import { useState, useEffect } from 'react'
import type { UseCaseType, FrequencyType, DeviceType, IntentionType } from '@/lib/types'

interface Survey {
  useCase: UseCaseType|''
  frequency: FrequencyType|''
  device: DeviceType|''
  intention: IntentionType|''
}

function Btn({ selected, onClick, children }: { selected: boolean; onClick: ()=>void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={'px-4 py-3 rounded-xl text-sm font-medium text-left transition-all border-2 ' + (
        selected
          ? 'bg-violet-600 border-violet-400 text-white'
          : 'bg-white/5 border-white/10 text-white/60 hover:border-violet-500/50 hover:bg-white/10 hover:text-white'
      )}>
      {children}
    </button>
  )
}

export default function SurveyForm() {
  const [id, setId] = useState('')
  const [s, setS] = useState<Survey>({ useCase:'', frequency:'', device:'', intention:'' })
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setId(sessionStorage.getItem('fg_id') ?? '') }, [])

  const complete = s.useCase && s.frequency && s.device && s.intention

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!complete || loading) return
    setLoading(true)
    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...s }),
      })
    } finally { setDone(true) }
  }

  if (done) return (
    <div className="text-center py-8">
      <div className="text-5xl mb-4">🙌</div>
      <h3 className="text-xl font-bold text-white mb-2">Merci pour tes reponses !</h3>
      <p className="text-white/50">Je te contacte des que la beta est prete.</p>
    </div>
  )

  return (
    <form onSubmit={submit} className="space-y-7">
      <div>
        <p className="font-semibold text-white mb-3">Qu'aimerais-tu principalement memoriser ?</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['university','🎓 Cours universitaires'],
            ['exams','📝 Examens / concours'],
            ['languages','🌍 Langues'],
            ['certifications','🏆 Certifications'],
            ['professional','💼 Formation pro'],
            ['other','✨ Autre'],
          ] as [UseCaseType, string][]).map(([v,l]) => (
            <Btn key={v} selected={s.useCase===v} onClick={()=>setS(x=>({...x,useCase:v}))}>{l}</Btn>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-white mb-3">Combien de fois par semaine ?</p>
        <div className="flex flex-wrap gap-2">
          {([['rarely','1-2 fois'],['regular','3-5 fois'],['daily','Tous les jours 🔥']] as [FrequencyType,string][]).map(([v,l]) => (
            <Btn key={v} selected={s.frequency===v} onClick={()=>setS(x=>({...x,frequency:v}))}>{l}</Btn>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-white mb-3">Quel appareil principalement ?</p>
        <div className="flex flex-wrap gap-2">
          {([['iphone','🍎 iPhone'],['android','🤖 Android'],['computer','💻 Ordinateur']] as [DeviceType,string][]).map(([v,l]) => (
            <Btn key={v} selected={s.device===v} onClick={()=>setS(x=>({...x,device:v}))}>{l}</Btn>
          ))}
        </div>
      </div>

      <div>
        <p className="font-semibold text-white mb-3">Si FlashGenius etait dispo aujourd'hui ?</p>
        <div className="space-y-2">
          {([
            ['free','✅ Oui, gratuitement'],
            ['paid',"💳 Oui, meme si c'est payant"],
            ['watching','👀 Je veux juste suivre le projet'],
          ] as [IntentionType,string][]).map(([v,l]) => (
            <Btn key={v} selected={s.intention===v} onClick={()=>setS(x=>({...x,intention:v}))}>{l}</Btn>
          ))}
        </div>
      </div>

      <button type="submit" disabled={!complete||loading}
        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
        {loading ? 'Envoi...' : 'Envoyer mes reponses →'}
      </button>
      <p className="text-center text-white/30 text-xs">Tu peux ignorer ce questionnaire si tu preferes</p>
    </form>
  )
}
