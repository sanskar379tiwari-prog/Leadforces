import { motion } from 'framer-motion'
import { useLeadScore } from '../hooks/useLeadScore'

const DIMS = ['Budget', 'Authority', 'Need', 'Timeline']
const COLORS = {
  Budget: '#a855f7',
  Authority: '#3b82f6',
  Need: '#22c55e',
  Timeline: '#f59e0b',
}

export default function LeadScorecard({ leadId }) {
  const { score, loading } = useLeadScore(leadId)

  if (loading && !score) {
    return (
      <div className="flex items-center gap-2 text-white/20 text-[12px]">
        <div className="w-3 h-3 rounded-full bg-white/10 animate-pulse" />
        Loading scores…
      </div>
    )
  }
  if (!score) return null

  const dims = score.dimension_scores || {}

  return (
    <div className="space-y-5">
      {/* Top row: score + badge */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] text-white/20 uppercase tracking-[0.15em] font-semibold mb-1">Lead Score</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[40px] font-extrabold tracking-tighter leading-none">{score.overall_score ?? 0}</span>
            <span className="text-[14px] text-white/15 font-semibold">/100</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
          score.qualification === 'QUALIFIED'
            ? 'bg-emerald-500/15 text-emerald-400'
            : score.qualification === 'DISQUALIFIED'
            ? 'bg-red-500/15 text-red-400'
            : 'bg-white/[0.06] text-white/25'
        }`}>
          {score.qualification || 'PENDING'}
        </span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-4">
        {DIMS.map((dim) => (
          <div key={dim}>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-white/30 font-medium">{dim}</span>
              <span className="font-semibold" style={{ color: COLORS[dim] }}>
                {dims[dim] ?? 0}
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: COLORS[dim] }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, dims[dim] ?? 0)}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Framework tag */}
      <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
        <span className="text-[10px] text-white/15 font-medium">Framework</span>
        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
          {score.framework || '—'}
        </span>
      </div>
    </div>
  )
}
