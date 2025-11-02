import { Users, ChevronLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { useEffect, useState } from 'react'
import { api } from '@/utils/api'

export interface CooperativeScreenProps {
  onBack?: () => void
}

export function CooperativeScreen({ onBack }: CooperativeScreenProps) {
  const [found, setFound] = useState<number>(0)
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const es = api.sse(1)

    es.onmessage = (e) => {
      try {
        const update = JSON.parse(e.data)
        if (update.type === 'coop') {
          setFound(update.found || 0)
          setTotal(update.total || 0)
          setLoading(false)
        }
      } catch (err) {
        console.error('SSE parse error:', err)
      }
    }

    es.onerror = () => {
      console.warn('[SSE] Connection error')
      setLoading(false)
    }

    return () => {
      es.close()
    }
  }, [])

  const percentage = total > 0 ? Math.round((found / total) * 100) : 0

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 animate-fade-in">
        <div className="rounded-2xl border border-[var(--wu-muted)] bg-[var(--wu-muted)]/60 px-5 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--wu-primary)] shadow-soft flex-shrink-0">
              <Users className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={wuTypography.secondary + ' uppercase tracking-[0.3em] text-xs mb-1'}>
                Cooperative feedback
              </p>
              <p className="text-sm text-[var(--wu-text)] leading-relaxed">
                Together, we're making campus better
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E0E0E0]">
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-[var(--wu-primary)] mb-2">
                {loading ? '...' : `${found} / ${total}`}
              </p>
              <p className="text-sm text-[var(--wu-text-secondary)] mb-4">
                Issues found by the group
              </p>
              <div className="w-full bg-[var(--wu-muted)] rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-[var(--wu-primary)] transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-[var(--wu-text-secondary)] mt-2">
                {loading ? 'Loading...' : `${percentage}% complete`}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E0E0E0]">
              <div className="flex items-center gap-2 text-sm text-[var(--wu-text)]">
                <CheckCircle className="h-4 w-4 text-[var(--wu-primary)] flex-shrink-0" strokeWidth={2.4} />
                <p>
                  {found === total && total > 0
                    ? '🎉 All issues found! Great teamwork!'
                    : total - found > 0
                      ? `Keep going! ${total - found} more ${total - found === 1 ? 'issue' : 'issues'} to find.`
                      : 'Start reporting to help the group discover issues!'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            className="w-full bg-[var(--wu-text)] hover:bg-[var(--wu-text)]/90 text-white"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CooperativeScreen

