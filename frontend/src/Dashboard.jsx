import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from './api/client'
import LeadScorecard from './components/LeadScorecard'
import CallTranscript from './components/CallTranscript'
import CdrPanel from './components/CdrPanel'

/* ── tiny helpers ── */
const fmt = (n) => String(n ?? 0)
const pct = (n) => `${n ?? 0}%`

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const tableRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/leads')
        setLeads(data)
        setError('')
      } catch (e) {
        setError(e.message || 'Failed to load')
      }
    }
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const qualified = leads.filter((l) => l.qualified === 'QUALIFIED').length
  const avgScore = leads.length ? Math.round(leads.reduce((a, l) => a + (l.score || 0), 0) / leads.length) : 0
  const topScores = [...leads].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 7)

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">

      {/* ═══════════  TOP NAV BAR  ═══════════ */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b border-white/[0.06] bg-[#0D0D0D]/80 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          {['overview', 'performance', 'leads', 'settings'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-[13px] font-semibold capitalize tracking-wide transition-colors ${
                tab === t ? 'text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              {t === 'overview' && '⊞ '}
              {t === 'performance' && '⊿ '}
              {t === 'leads' && '⊡ '}
              {t === 'settings' && '⊙ '}
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px] font-bold ring-2 ring-white/10">
            LF
          </div>
        </div>
      </nav>

      {/* ═══════════  MAIN CONTENT  ═══════════ */}
      <main className="max-w-[1440px] mx-auto px-8 py-8">

        {/* ── Header Row ── */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[28px] font-bold tracking-tight">Lead performance</h1>
          <div className="flex items-center gap-3">
            <a
              href="/api/leads/export/csv"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </a>
            <button className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-black text-[13px] font-bold hover:bg-white/90 active:scale-[0.97] transition-all">
              + Add new lead
            </button>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 px-5 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
            ⚠ {error}
          </motion.div>
        )}

        {/* ═══════════  TWO CHART CARDS  ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

          {/* ── Left Chart: Call Activity (line chart) ── */}
          <div className="relative rounded-[20px] bg-[#161616] border border-white/[0.06] p-6 overflow-hidden min-h-[280px]">
            {/* Purple gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-white/50">Avg lead score</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/50 font-medium">This week</span>
                  <button className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors text-[12px]">↗</button>
                </div>
              </div>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-[48px] font-extrabold tracking-tighter leading-none">{avgScore}</span>
                <span className="text-emerald-400 text-[13px] font-bold bg-emerald-400/10 px-2 py-0.5 rounded-md">
                  +{leads.length > 0 ? Math.min(12, leads.length) : 0}%
                </span>
              </div>
            </div>
            {/* SVG Line Chart */}
            <div className="absolute bottom-0 left-0 right-0 h-[140px]">
              <svg viewBox="0 0 500 140" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(168,85,247,0.4)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0)" />
                  </linearGradient>
                </defs>
                <path d="M0 120 Q60 80 100 90 T200 60 T300 75 T400 40 T500 55 V140 H0Z" fill="url(#lineGrad)" />
                <path d="M0 120 Q60 80 100 90 T200 60 T300 75 T400 40 T500 55" fill="none" stroke="rgba(168,85,247,0.8)" strokeWidth="2.5" />
                {/* Dot + tooltip */}
                <circle cx="300" cy="75" r="4" fill="white" />
                <rect x="265" y="52" width="70" height="22" rx="6" fill="rgba(30,30,30,0.9)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x="300" y="67" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">{avgScore} pts</text>
              </svg>
            </div>
            {/* X-axis labels */}
            <div className="absolute bottom-3 left-6 right-6 flex justify-between text-[10px] text-white/20 font-medium">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
            </div>
          </div>

          {/* ── Right Chart: Leads by Score (bar chart) ── */}
          <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-6 min-h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[13px] font-medium text-white/50">Leads by score</span>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors text-[12px]">⊞</button>
                <button className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors text-[12px]">↗</button>
              </div>
            </div>
            {/* Y-axis + bars */}
            <div className="flex-1 flex items-end gap-1 relative">
              {/* Y grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[100, 80, 60, 40, 20, 0].map(v => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-[9px] text-white/15 w-5 text-right">{v}</span>
                    <div className="flex-1 border-t border-white/[0.04]" />
                  </div>
                ))}
              </div>
              {/* Bars */}
              <div className="flex-1 flex items-end justify-around gap-2 px-6 pb-1 relative z-10">
                {topScores.length > 0 ? topScores.map((l, i) => {
                  const h = Math.max(5, (l.score || 0))
                  const isHighest = i === 0
                  return (
                    <div key={l.lead_id} className="flex flex-col items-center gap-2 flex-1">
                      {isHighest && (
                        <span className="text-[11px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">{l.score}</span>
                      )}
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className={`w-full min-w-[28px] max-w-[42px] rounded-t-lg ${isHighest ? 'bg-white' : 'bg-white/[0.08]'}`}
                        style={{ maxHeight: '180px' }}
                      />
                      <span className="text-[10px] text-white/25 font-medium truncate max-w-[50px]">
                        {l.phone_number?.slice(-4) || `#${i+1}`}
                      </span>
                    </div>
                  )
                }) : (
                  <div className="text-white/20 text-[12px] italic py-10 w-full text-center">No leads yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════  FOUR STAT CARDS  ═══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard label="Total calls" value={fmt(leads.length)} />
          <StatCard label="Qualified leads" value={fmt(qualified)} />
          <StatCard label="Avg score" value={pct(avgScore)} />
          <StatCard label="Frameworks used" value={leads.length > 0 ? 'BANT' : '—'} />
        </div>

        {/* ═══════════  TABLE + DETAIL PANEL  ═══════════ */}
        <div className="flex gap-5">

          {/* ── Table Section ── */}
          <div className={`transition-all duration-500 ${selected ? 'flex-[2]' : 'flex-1'}`}>
            <div className="rounded-[20px] bg-[#161616] border border-white/[0.06]">
              {/* Table header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <h2 className="text-[16px] font-bold">List leads</h2>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/40 hover:text-white transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    Filters
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-colors">
                    + Add user
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto" ref={tableRef}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] font-semibold text-white/25 uppercase tracking-wider border-b border-white/[0.04]">
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">Score</th>
                      <th className="py-3 px-6">Phone</th>
                      <th className="py-3 px-6">Qualification</th>
                      <th className="py-3 px-6">Framework</th>
                      <th className="py-3 px-6">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((l) => (
                      <motion.tr
                        key={l.lead_id}
                        onClick={() => setSelected(selected === l.lead_id ? null : l.lead_id)}
                        className={`cursor-pointer transition-colors border-b border-white/[0.03] ${
                          selected === l.lead_id
                            ? 'bg-white/[0.04]'
                            : 'hover:bg-white/[0.02]'
                        }`}
                        whileHover={{ x: 2 }}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {l.phone_number?.slice(-2) || '??'}
                            </div>
                            <div>
                              <div className="text-[13px] font-semibold">{l.prospect_name || l.phone_number || 'Unknown'}</div>
                              <div className="text-[10px] text-white/20 font-mono truncate max-w-[100px]">{l.lead_id?.slice(0,8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-white"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, l.score || 0)}%` }}
                                transition={{ duration: 0.8 }}
                              />
                            </div>
                            <span className="text-[12px] font-semibold text-white/60">{l.score ?? 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[13px] text-white/50">{l.phone_number}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            l.qualified === 'QUALIFIED'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : l.qualified === 'DISQUALIFIED'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-white/[0.06] text-white/30'
                          }`}>
                            {l.qualified || 'PENDING'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300">
                            {l.framework || '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-[12px] text-white/25">
                          {l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                      </motion.tr>
                    ))}
                    {leads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-white/15 text-[13px] italic">
                          No leads recorded yet. Calls will appear here live.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Detail Side Panel ── */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 420, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden shrink-0"
              >
                <div className="w-[420px] space-y-5">
                  {/* Close button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setSelected(null)}
                      className="text-[11px] text-white/30 hover:text-white px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] transition-colors"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Scorecard */}
                  <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-6">
                    <LeadScorecard leadId={selected} />
                  </div>

                  {/* Transcript */}
                  <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-6">
                    <h3 className="text-[11px] font-bold text-white/25 uppercase tracking-widest mb-4">Call transcript</h3>
                    <CallTranscript leadId={selected} />
                  </div>

                  {/* CDR */}
                  <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-6">
                    <h3 className="text-[11px] font-bold text-white/25 uppercase tracking-widest mb-4">Data extraction (CDR)</h3>
                    <CdrPanel leadId={selected} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

/* ── Stat Card Component ── */
function StatCard({ label, value }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-6 flex flex-col justify-between min-h-[120px]"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[12px] font-medium text-white/30">{label}</span>
        <button className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center text-white/20 text-[10px] hover:text-white transition-colors">↗</button>
      </div>
      <span className="text-[32px] font-extrabold tracking-tighter leading-none">{value}</span>
    </motion.div>
  )
}
