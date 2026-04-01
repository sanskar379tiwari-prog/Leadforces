import { useLeadScore } from '../hooks/useLeadScore'

export default function CdrPanel({ leadId }) {
  const { score } = useLeadScore(leadId, 4000)
  const cdr = score?.cdr_json
  if (!cdr) {
    return (
      <div className="text-slate-500 text-sm border border-[#1A2550] rounded-xl p-4 bg-[#060a1a]">
        CDR appears after the call completes.
      </div>
    )
  }
  return (
    <div className="border border-[#1A2550] rounded-xl p-4 bg-[#060a1a] text-left text-sm space-y-3">
      <div className="text-[#D4FF00] font-semibold">CDR summary</div>
      {cdr.next_action && (
        <p>
          <span className="text-slate-500">Next action:</span> {cdr.next_action}
        </p>
      )}
      {cdr.key_insights?.length > 0 && (
        <ul className="list-disc pl-5 text-slate-300 space-y-1">
          {cdr.key_insights.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
      <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap break-words">
        {JSON.stringify(cdr, null, 2)}
      </pre>
    </div>
  )
}
