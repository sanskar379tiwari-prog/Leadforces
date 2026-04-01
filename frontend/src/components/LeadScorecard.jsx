import { motion } from 'framer-motion'
import { useLeadScore } from '../hooks/useLeadScore'

const DIMS = ['Budget', 'Authority', 'Need', 'Timeline']
const COLOR = {
  Budget: '#D4FF00',
  Authority: '#3B82F6',
  Need: '#22C55E',
  Timeline: '#F97316',
}

export default function LeadScorecard({ leadId }) {
  const { score, loading } = useLeadScore(leadId)
  if (loading && !score) {
    return <div className="text-slate-500 text-sm">Loading scores…</div>
  }
  if (!score) return null

  const dims = score.dimension_scores || {}

  return (
    <div className="bg-[#0A0F2C] border border-[#1A2550] rounded-2xl p-6 space-y-4">
      <h2 className="text-[#D4FF00] font-bold text-xl flex flex-wrap items-center gap-2">
        Lead score: {score.overall_score ?? 0}
        <span
          className={`text-sm px-2 py-1 rounded font-bold ${
            score.qualification === 'QUALIFIED'
              ? 'bg-green-500 text-black'
              : score.qualification === 'NURTURE'
                ? 'bg-yellow-400 text-black'
                : score.qualification === 'DISQUALIFIED'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-600 text-white'
          }`}
        >
          {score.qualification || 'PENDING'}
        </span>
        <span className="text-slate-400 text-sm font-normal">{score.framework}</span>
      </h2>
      {DIMS.map((dim) => (
        <div key={dim}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white">{dim}</span>
            <span style={{ color: COLOR[dim] }}>{dims[dim] ?? 0}</span>
          </div>
          <div className="bg-[#1A2550] rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-3 rounded-full"
              style={{ backgroundColor: COLOR[dim] }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, dims[dim] ?? 0)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
