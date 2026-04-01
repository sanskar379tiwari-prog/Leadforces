import { motion } from 'framer-motion'
import { useLeadScore } from '../hooks/useLeadScore'

const DIMS = ['Budget', 'Authority', 'Need', 'Timeline']
const COLOR = {
  Budget: '#D4FF00',
  Authority: '#8B5CF6',
  Need: '#3B82F6',
  Timeline: '#F97316',
}

export default function LeadScorecard({ leadId }) {
  const { score, loading } = useLeadScore(leadId)
  
  if (loading && !score) {
    return <div className="text-slate-500 text-sm animate-pulse">Analyzing scores…</div>
  }
  if (!score) return null

  const dims = score.dimension_scores || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <div className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">Qualification Metric</div>
           <h2 className="text-white font-bold text-3xl tracking-tight flex items-baseline gap-2">
            {score.overall_score ?? 0}<span className="text-sm text-slate-500">/100</span>
          </h2>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border ${
            score.qualification === 'QUALIFIED'
              ? 'bg-[#D4FF00]/10 text-[#D4FF00] border-[#D4FF00]/20 shadow-[0_0_15px_rgba(212,255,0,0.1)]'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}>
          {score.qualification || 'PENDING'}
        </div>
      </div>

      <div className="space-y-5">
        {DIMS.map((dim) => (
          <div key={dim} className="group">
            <div className="flex justify-between text-[11px] mb-2 font-bold tracking-wide">
              <span className="text-slate-400 uppercase">{dim}</span>
              <span style={{ color: COLOR[dim] }}>{dims[dim] ?? 0}</span>
            </div>
            <div className="bg-white/5 rounded-full h-1.5 overflow-hidden ring-1 ring-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  backgroundColor: COLOR[dim],
                  boxShadow: `0 0 10px ${COLOR[dim]}33`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, dims[dim] ?? 0)}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
         <span className="text-[10px] text-slate-500 font-medium">Framework Type</span>
         <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">{score.framework}</span>
      </div>
    </div>
  )
}
