import { useLeadScore } from '../hooks/useLeadScore'

export default function CallTranscript({ leadId }) {
  const { score } = useLeadScore(leadId, 3000)
  
  if (!score?.turns?.length) {
    return (
      <div className="text-slate-500 text-[11px] font-medium uppercase tracking-widest text-center py-10 bg-white/5 rounded-3xl border border-white/5 border-dashed">
        No conversation turns yet. 
      </div>
    )
  }

  return (
    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
      {score.turns.map((t) => (
        <div 
          key={`${t.turn_number}-${t.role}`} 
          className={`flex flex-col ${t.role === 'agent' ? 'items-start' : 'items-end'}`}
        >
          <div className="flex items-center gap-2 mb-1 px-2">
             <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 select-none">
              {t.role === 'agent' ? '● Alex (AI)' : 'Prospect Member'}
            </span>
          </div>
          <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
            t.role === 'agent' 
              ? 'bg-[#1A1C3D] text-slate-200 rounded-tl-none border border-white/5' 
              : 'bg-[#D4FF00]/10 text-[#D4FF00] rounded-tr-none border border-[#D4FF00]/10'
          }`}>
            {t.text}
          </div>
        </div>
      ))}
    </div>
  )
}
