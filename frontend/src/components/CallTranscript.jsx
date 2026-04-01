import { useLeadScore } from '../hooks/useLeadScore'

export default function CallTranscript({ leadId }) {
  const { score } = useLeadScore(leadId, 3000)

  if (!score?.turns?.length) {
    return (
      <div className="text-white/15 text-[12px] text-center py-8 italic">
        No conversation turns yet.
      </div>
    )
  }

  return (
    <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1">
      {score.turns.map((t) => (
        <div
          key={`${t.turn_number}-${t.role}`}
          className={`flex flex-col ${t.role === 'agent' ? 'items-start' : 'items-end'}`}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/15 mb-1 px-1">
            {t.role === 'agent' ? '● Alex (AI)' : '● Prospect'}
          </span>
          <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
            t.role === 'agent'
              ? 'bg-white/[0.04] text-white/60 rounded-tl-sm'
              : 'bg-purple-500/10 text-purple-200 rounded-tr-sm'
          }`}>
            {t.text}
          </div>
        </div>
      ))}
    </div>
  )
}
