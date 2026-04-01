import { useLeadScore } from '../hooks/useLeadScore'

export default function CallTranscript({ leadId }) {
  const { score } = useLeadScore(leadId, 3000)
  if (!score?.turns?.length) {
    return (
      <div className="text-slate-500 text-sm rounded-xl border border-[#1A2550] p-4 bg-[#060a1a]">
        No turns yet. Active calls will appear here.
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-[#1A2550] p-4 bg-[#060a1a] max-h-64 overflow-y-auto text-left space-y-2">
      {score.turns.map((t) => (
        <div key={`${t.turn_number}-${t.role}`} className="text-sm">
          <span className={t.role === 'agent' ? 'text-[#D4FF00]' : 'text-slate-300'}>
            {t.role === 'agent' ? 'Alex' : 'Prospect'}:
          </span>{' '}
          <span className="text-slate-200">{t.text}</span>
        </div>
      ))}
    </div>
  )
}
