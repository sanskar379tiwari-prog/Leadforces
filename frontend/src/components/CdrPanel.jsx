import { useLeadScore } from '../hooks/useLeadScore'

export default function CdrPanel({ leadId }) {
  const { score } = useLeadScore(leadId, 4000)
  const cdr = score?.cdr_json
  
  if (!cdr) {
    return (
      <div className="text-slate-500 text-[11px] font-medium uppercase tracking-widest text-center py-10 bg-white/5 rounded-3xl border border-white/5 border-dashed">
        CDR analysis will appear here after the call.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {cdr.next_action && (
        <div className="bg-[#D4FF00]/10 border border-[#D4FF00]/20 rounded-2xl p-4">
          <div className="text-[#D4FF00] text-[10px] font-bold uppercase tracking-wider mb-1">Recommended Next Step</div>
          <p className="text-sm text-slate-100 font-medium">{cdr.next_action}</p>
        </div>
      )}

      {cdr.key_insights && cdr.key_insights.length > 0 && (
         <div className="space-y-3 px-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Key Insights</div>
            <ul className="space-y-3">
              {cdr.key_insights.map((insight, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2 shrink-0"></span>
                  <span className="text-sm text-slate-300 leading-relaxed font-light">{insight}</span>
                </li>
              ))}
            </ul>
         </div>
      )}

      <details className="group border-t border-white/5 pt-4">
        <summary className="text-[10px] text-zinc-500 hover:text-zinc-300 cursor-pointer select-none font-bold uppercase tracking-widest list-none flex justify-between items-center transition-colors">
          View Raw Report Data
          <span className="group-open:rotate-180 transition-transform text-xs">▼</span>
        </summary>
        <pre className="mt-4 p-4 rounded-2xl bg-black/40 text-[10px] font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap border border-white/5 leading-relaxed">
          {JSON.stringify(cdr, null, 2)}
        </pre>
      </details>
    </div>
  )
}
