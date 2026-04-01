import { useEffect, useState } from 'react'
import { api } from './api/client'
import LeadScorecard from './components/LeadScorecard'
import CallTranscript from './components/CallTranscript'
import CdrPanel from './components/CdrPanel'

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/leads')
        setLeads(data)
        setError('')
      } catch (e) {
        setError(e.message || 'Failed to load leads')
      }
    }
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [])

  const qualified = leads.filter((l) => l.qualified === 'QUALIFIED').length
  const avg =
    leads.length === 0
      ? 0
      : Math.round(leads.reduce((a, l) => a + (l.score || 0), 0) / leads.length)

  return (
    <div className="min-h-screen bg-[#060818] text-slate-100">
      <header className="border-b border-[#1A2550] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#D4FF00] tracking-tight">Leadforces</h1>
          <p className="text-slate-500 text-sm">Voice AI qualification — live dashboard</p>
        </div>
        <a
          href="/api/leads/export/csv"
          className="text-sm px-3 py-2 rounded-lg bg-[#1A2550] text-[#D4FF00] hover:bg-[#243066]"
        >
          Export CSV
        </a>
      </header>

      {error && (
        <div className="mx-6 mt-4 text-amber-400 text-sm border border-amber-900/50 rounded-lg px-4 py-2 bg-amber-950/30">
          {error} — is the API running on port 3000?
        </div>
      )}

      <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <section className="lg:col-span-1 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Calls" value={leads.length} />
            <Metric label="Qualified" value={qualified} />
            <Metric label="Avg score" value={avg} />
          </div>
          <div className="rounded-2xl border border-[#1A2550] overflow-hidden bg-[#0A0F2C]">
            <div className="px-4 py-3 border-b border-[#1A2550] text-slate-400 text-sm font-medium">
              Recent leads
            </div>
            <ul className="max-h-80 overflow-y-auto divide-y divide-[#1A2550]">
              {leads.map((l) => (
                <li key={l.lead_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(l.lead_id)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#121a3d] transition-colors ${
                      selected === l.lead_id ? 'bg-[#121a3d]' : ''
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-mono text-xs text-slate-400 truncate">{l.lead_id}</span>
                      <span className="text-[#D4FF00] font-semibold">{l.score ?? 0}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {l.phone_number} · {l.qualified} · {l.framework}
                    </div>
                  </button>
                </li>
              ))}
              {leads.length === 0 && (
                <li className="px-4 py-8 text-center text-slate-500 text-sm">No leads yet</li>
              )}
            </ul>
          </div>
        </section>

        <section className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <LeadScorecard leadId={selected} />
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">Transcript</h3>
                <CallTranscript leadId={selected} />
              </div>
              <div>
                <h3 className="text-slate-400 text-sm font-medium mb-2">CDR</h3>
                <CdrPanel leadId={selected} />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#1A2550] p-12 text-center text-slate-500">
              Select a lead to view scores and transcript
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-[#1A2550] bg-[#0A0F2C] px-3 py-3 text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
    </div>
  )
}
