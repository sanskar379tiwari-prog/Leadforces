import { useState, useEffect } from 'react'
import { api } from '../api/client'

export function useLeadScore(leadId, interval = 2000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!leadId) return undefined
    const fetch = async () => {
      try {
        const { data: d } = await api.get(`/api/leads/${leadId}`)
        setData(d)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetch()
    const t = setInterval(fetch, interval)
    return () => clearInterval(t)
  }, [leadId, interval])

  return { score: data, loading }
}
