import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [])

  const qualifiedLeads = leads.filter((l) => l.qualified === 'QUALIFIED')
  const avgScore = leads.length === 0 ? 0 : Math.round(leads.reduce((a, l) => a + (l.score || 0), 0) / leads.length)

  return (
    <div className="flex min-h-screen bg-[#060818] font-sans selection:bg-[#D4FF00] selection:text-black">
      {/* --- Sidebar Navigation --- */}
      <nav className="w-20 lg:w-64 border-r border-white/5 flex flex-col items-center lg:items-start p-6 gap-8 bg-[#0A0F2C]/50 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#D4FF00] to-[#8B5CF6] rounded-xl flex items-center justify-center font-bold text-black text-xl">L</div>
          <span className="hidden lg:block text-xl font-bold tracking-tight text-white">Leadforces</span>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <NavItem icon="▩" label="Overview" active />
          <NavItem icon="▤" label="Audience" />
          <NavItem icon="⊡" label="Settings" />
        </div>

        <div className="mt-auto hidden lg:flex items-center gap-3 p-3 glass rounded-2xl w-full">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-xs">AI</div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Alex (AI)</span>
            <span className="text-[10px] text-emerald-400">● Live Assistant</span>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-[1600px] mx-auto w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Lead Performance</h1>
            <p className="text-slate-400 mt-1">Real-time Voice AI qualification dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/leads/export/csv" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium">Export CSV</a>
            <button className="px-5 py-2 bg-[#D4FF00] text-black rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,255,0,0.3)]">+ New Lead</button>
          </div>
        </header>

        {error && (
            <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-sm flex items-center gap-3">
              <span className="text-xl">⚠️</span> {error} — Please check backend status.
            </motion.div>
        )}

        {/* --- Top Metrics Row --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Calls" value={leads.length} trend="+12.2%" gradient="from-[#8B5CF6]/20 to-[#060818]" />
          <MetricChart label="Avg engagement" value={`${avgScore}%`} trend="-1.2%" gradient="from-indigo-600/20 to-transparent" />
          <StatCard label="Qualified" value={qualifiedLeads.length} trend="+5%" gradient="from-white/5 to-transparent" />
          <StatCard label="Frameworks" value="BANT/MEDDIC" trend="Active" variant="outline" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* --- Leads Table Section --- */}
          <section className="xl:col-span-2 glass rounded-[2.5rem] p-6 card-shadow">
            <div className="flex items-center justify-between mb-8 px-2">
              <h2 className="text-xl font-bold">List leads</h2>
              <div className="flex gap-2 text-xs text-slate-500">
                <button className="px-3 py-1.5 border border-white/10 rounded-lg hover:text-white transition-colors">Filters</button>
                <button className="px-3 py-1.5 border border-white/10 rounded-lg hover:text-white transition-colors">Sort</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-white/5">
                    <th className="pb-4 px-4">Lead ID / Info</th>
                    <th className="pb-4 px-4 text-center">Score</th>
                    <th className="pb-4 px-4">Qualified</th>
                    <th className="pb-4 px-4">Framework</th>
                    <th className="pb-4 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leads.map((l) => (
                    <motion.tr
                      key={l.lead_id}
                      layoutId={l.lead_id}
                      onClick={() => setSelected(l.lead_id)}
                      className={`group hover:bg-white/5 transition-colors cursor-pointer ${selected === l.lead_id ? 'bg-[#D4FF00]/10 border-l-2 border-[#D4FF00]' : ''}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400 group-hover:scale-110 transition-transform">
                            {l.phone_number?.slice(-2)}
                          </div>
                          <div>
                            <div className="font-mono text-xs text-slate-400 opacity-60 truncate max-w-[100px]">{l.lead_id}</div>
                            <div className="text-sm font-medium">{l.phone_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-lg font-bold ${l.score > 70 ? 'text-[#D4FF00]' : 'text-white'}`}>{l.score ?? 0}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${l.qualified === 'QUALIFIED' ? 'bg-[#D4FF00]/10 text-[#D4FF00]' : 'bg-slate-800 text-slate-500'}`}>
                          {l.qualified}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-400">{l.framework}</td>
                      <td className="py-4 px-4 text-right pr-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-slate-400 text-xl font-light">→</span>
                      </td>
                    </motion.tr>
                  ))}
                  {leads.length === 0 && (
                    <tr><td colSpan="5" className="py-20 text-center text-slate-500 italic text-sm">No leads recorded yet. Calls will appear here life.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* --- Detail Pane Section --- */}
          <section className="xl:col-span-1 space-y-6">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} className="space-y-6">
                  <div className="glass rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4FF00]/5 blur-3xl group-hover:bg-[#D4FF00]/15 transition-all"></div>
                    <LeadScorecard leadId={selected} />
                  </div>

                  <div className="glass rounded-[2rem] p-6 shadow-2xl">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 px-2">Call Transcript</h3>
                    <CallTranscript leadId={selected} />
                  </div>

                  <div className="glass rounded-[2rem] p-6 shadow-2xl">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 px-2">Data Extraction (CDR)</h3>
                    <CdrPanel leadId={selected} />
                  </div>
                </motion.div>
              ) : (
                <div className="glass rounded-[2rem] p-12 text-center border-dashed border-2 border-white/5">
                   <div className="text-4xl mb-4 opacity-20">📇</div>
                   <p className="text-slate-500 text-sm">Select a lead from the list to view qualification scores and transcripts</p>
                </div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </div>
  )
}

function NavItem({ icon, label, active = false }) {
  return (
    <button className={`flex items-center gap-4 px-4 py-3 rounded-2xl w-full transition-all text-sm font-medium ${active ? 'bg-[#D4FF00]/5 text-[#D4FF00]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
      <span className="text-xl leading-none">{icon}</span>
      <span className="hidden lg:block">{label}</span>
    </button>
  )
}

function StatCard({ label, value, trend, gradient, variant = 'glass' }) {
  return (
    <motion.div whileHover={{ y:-5 }} className={`p-6 rounded-[2rem] relative overflow-hidden card-shadow ${variant === 'glass' ? 'glass' : 'border border-white/10 bg-transparent'}`}>
      <div className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${gradient} opacity-20`}></div>
      <div className="flex justify-between items-start mb-4">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-xs">↗</div>
      </div>
      <div className="flex justify-between items-end">
        <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{label}</span>
        <span className="text-[10px] text-[#D4FF00] font-bold bg-[#D4FF00]/10 px-2 py-0.5 rounded-full">{trend}</span>
      </div>
    </motion.div>
  )
}

function MetricChart({ label, value, trend }) {
  return (
    <motion.div whileHover={{ y:-5 }} className="glass p-6 rounded-[2rem] card-shadow relative overflow-hidden group">
      {/* Decorative SVG Graph mimicking the performance image */}
      <div className="absolute bottom-0 left-0 w-full h-24 overflow-hidden pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
        <svg viewBox="0 0 400 100" className="w-full h-full stroke-[#8B5CF6] stroke-[2] fill-[#8B5CF6]/15">
          <path d="M0 80 Q 50 20, 100 60 T 200 40 T 300 70 T 400 30 V 100 H 0 Z" />
        </svg>
      </div>

      <div className="relative z-10">
         <div className="text-3xl font-bold tracking-tight mb-4">{value}</div>
         <div className="flex justify-between items-end">
            <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">{label}</span>
            <span className="text-[10px] text-zinc-100 bg-white/10 px-2 py-0.5 rounded-full font-mono">{trend}</span>
         </div>
      </div>
    </motion.div>
  )
}
