import { useLeadScore } from '../hooks/useLeadScore'

export default function CdrPanel({ leadId }) {
  const { score } = useLeadScore(leadId, 4000)
  const cdr = score?.cdr_json

  if (!cdr) {
    return (
      <div className="text-white/15 text-[12px] text-center py-8 italic">
        CDR analysis appears after the call completes.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Next action highlight */}
      {cdr.next_action && (
        <div className="bg-emerald-500/[0.06] border border-emerald-500/10 rounded-2xl p-4">
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Next Step</div>
          <p className="text-[13px] text-white/70 font-medium leading-relaxed">{cdr.next_action}</p>
        </div>
      )}

      {/* Key insights */}
      {cdr.key_insights?.length > 0 && (
        <div>
          <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mb-3">Key Insights</div>
          <ul className="space-y-2.5">
            {cdr.key_insights.map((insight, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-1 h-1 rounded-full bg-purple-500 mt-2 shrink-0" />
                <span className="text-[12px] text-white/40 leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw JSON toggle */}
      <details className="group pt-3 border-t border-white/[0.04]">
        <summary className="text-[10px] text-white/15 hover:text-white/40 cursor-pointer select-none font-bold uppercase tracking-widest flex justify-between items-center transition-colors list-none">
          Raw data
          <span className="group-open:rotate-180 transition-transform text-[10px]">▼</span>
        </summary>
        <pre className="mt-3 p-4 rounded-xl bg-black/30 text-[9px] font-mono text-white/20 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/[0.04]">
          {JSON.stringify(cdr, null, 2)}
        </pre>
      </details>
    </div>
  )
}
