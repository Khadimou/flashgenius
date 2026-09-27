import Link from 'next/link'
import { getSubscribers } from '@/lib/storage'
import {
  USE_CASE_LABELS, FREQUENCY_LABELS, DEVICE_LABELS, INTENTION_LABELS,
  type UseCaseType, type FrequencyType, type DeviceType, type IntentionType,
} from '@/lib/types'

export const revalidate = 30

const BAR: Record<string, string> = {
  violet: 'bg-violet-500', indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500', sky: 'bg-sky-500', slate: 'bg-slate-500',
}

function Bar({ label, value, total, color='violet' }: { label:string; value:number; total:number; color?:string }) {
  const pct = total > 0 ? Math.round((value/total)*100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-white/55 w-48 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={'h-full rounded-full ' + (BAR[color] ?? 'bg-violet-500')} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white/35 w-16 text-right tabular-nums">{value} ({pct}%)</span>
    </div>
  )
}

function tally<T extends string>(arr: T[], key: T) { return arr.filter((x) => x === key).length }

const COLORS = ['text-violet-400','text-indigo-400','text-emerald-400','text-sky-400']

export default async function Dashboard() {
  const subs = await getSubscribers()
  subs.sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())

  const total = subs.length
  const withSurvey = subs.filter((s) => s.surveyCompleted).length
  const wantPaid = subs.filter((s) => s.survey?.intention === 'paid').length
  const wantActive = subs.filter((s) => s.survey?.intention === 'paid' || s.survey?.intention === 'free').length

  const useCases   = subs.filter((s) => s.survey).map((s) => s.survey!.useCase)
  const freqs      = subs.filter((s) => s.survey).map((s) => s.survey!.frequency)
  const devices    = subs.filter((s) => s.survey).map((s) => s.survey!.device)
  const intentions = subs.filter((s) => s.survey).map((s) => s.survey!.intention)

  const stats = [
    { label:"Total inscrits", value:total, sub:"liste d'attente" },
    { label:"Questionnaire", value:withSurvey, sub: total>0 ? `${Math.round(withSurvey/total*100)}% de taux` : '—' },
    { label:"Prets a payer", value:wantPaid, sub: total>0 ? `${Math.round(wantPaid/total*100)}% du total` : '—' },
    { label:"Utilisateurs actifs", value:wantActive, sub:"gratuit + payant" },
  ]

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-black text-sm">F</div>
            <span className="font-bold">FlashGenius</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-white/40 text-sm">Dashboard</span>
        </div>
        <a href="/api/export" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors">
          ↓ Export CSV
        </a>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s,i) => (
            <div key={s.label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="text-white/40 text-xs mb-1">{s.label}</p>
              <p className={'text-3xl font-bold tabular-nums '+COLORS[i]}>{s.value}</p>
              <p className="text-white/25 text-xs mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {withSurvey > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="font-semibold text-white mb-5">Cas d'usage</h3>
              <div className="space-y-3">
                {(Object.keys(USE_CASE_LABELS) as UseCaseType[]).map((k) => (
                  <Bar key={k} label={USE_CASE_LABELS[k]} value={tally(useCases,k)} total={withSurvey} />
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="font-semibold text-white mb-5">Intention d'usage</h3>
              <div className="space-y-3">
                {(Object.keys(INTENTION_LABELS) as IntentionType[]).map((k) => (
                  <Bar key={k} label={INTENTION_LABELS[k]} value={tally(intentions,k)} total={withSurvey}
                    color={k==='paid'?'emerald':k==='free'?'violet':'slate'} />
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="font-semibold text-white mb-5">Frequence d'utilisation</h3>
              <div className="space-y-3">
                {(Object.keys(FREQUENCY_LABELS) as FrequencyType[]).map((k) => (
                  <Bar key={k} label={FREQUENCY_LABELS[k]} value={tally(freqs,k)} total={withSurvey} color="sky" />
                ))}
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <h3 className="font-semibold text-white mb-5">Appareil cible</h3>
              <div className="space-y-3">
                {(Object.keys(DEVICE_LABELS) as DeviceType[]).map((k) => (
                  <Bar key={k} label={DEVICE_LABELS[k]} value={tally(devices,k)} total={withSurvey} color="indigo" />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="font-semibold text-white">Inscrits recents</h3>
            <span className="text-white/25 text-sm">{total} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Email','Date','QST',"Cas d'usage",'Intention','Appareil'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-white/35 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-white/25 text-sm">
                    Aucun inscrit — partage la landing page !
                  </td></tr>
                ) : subs.slice(0,100).map((s) => (
                  <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-mono text-xs text-white/65">{s.email}</td>
                    <td className="px-6 py-4 text-white/40 tabular-nums">
                      {new Date(s.createdAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'2-digit'})}
                    </td>
                    <td className="px-6 py-4">
                      {s.surveyCompleted ? <span className="text-green-400 font-bold">✓</span> : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-6 py-4 text-white/45">{s.survey ? USE_CASE_LABELS[s.survey.useCase] : '—'}</td>
                    <td className="px-6 py-4">
                      {s.survey ? (
                        <span className={'px-2 py-1 rounded-md text-xs font-medium '+(
                          s.survey.intention==='paid' ? 'bg-emerald-950 text-emerald-400' :
                          s.survey.intention==='free' ? 'bg-violet-950 text-violet-400' :
                          'bg-white/5 text-white/35'
                        )}>
                          {INTENTION_LABELS[s.survey.intention]}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-white/45">{s.survey ? DEVICE_LABELS[s.survey.device] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
