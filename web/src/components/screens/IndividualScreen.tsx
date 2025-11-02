import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { useEffect, useState } from 'react'
import { api } from '@/utils/api'

export interface IndividualScreenProps {
  onBack?: () => void
  participantCode?: string
}

export function IndividualScreen({ onBack, participantCode }: IndividualScreenProps) {
  const [myCount, setMyCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch initial count
    api
      .join()
      .then((res) => res.json())
      .then((data) => {
        if (data.totalReports !== undefined) {
          setMyCount(data.totalReports)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    // Subscribe to SSE for real-time updates of individual scores
    // Even though individual treatment doesn't have leaderboard, we can get user's own score updates
    const es = api.sse(1)

    es.onmessage = (e) => {
      try {
        const update = JSON.parse(e.data)
        // Update individual count from SSE individual type or fallback to comp userScore
        if (update.type === 'individual' && update.myCount !== undefined) {
          setMyCount(update.myCount)
          setLoading(false)
        } else if (update.type === 'comp' && update.userScore !== undefined && participantCode) {
          // Fallback: Update from competitive SSE data if individual type not available
          const userInTop = update.top?.find((entry: any) => entry.publicCode === participantCode)
          if (userInTop) {
            setMyCount(userInTop.totalReports)
            setLoading(false)
          } else if (update.userScore !== undefined) {
            setMyCount(update.userScore)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err)
      }
    }

    es.onerror = () => {
      // Error already logged by api.sse
    }

    return () => {
      es.close()
    }
  }, [participantCode])

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 animate-fade-in flex-1">
        <div className="rounded-2xl border border-[var(--wu-muted)] bg-[var(--wu-muted)]/60 px-5 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--wu-primary)] shadow-soft flex-shrink-0">
              <User className="h-6 w-6" strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={wuTypography.secondary + ' uppercase tracking-[0.3em] text-xs mb-1'}>
                Individual feedback
              </p>
              <p className="text-sm text-[var(--wu-text)] leading-relaxed">
                Your personal contribution to improving campus
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[#E0E0E0]">
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--wu-primary)] mb-2">
                {loading ? '...' : myCount}
              </p>
              <p className="text-sm text-[var(--wu-text-secondary)]">
                {myCount === 1 ? 'Report submitted' : 'Reports submitted'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full pb-4 flex justify-center">
        <Button
          className="bg-[var(--wu-text)] hover:bg-[var(--wu-text)]/90 text-white rounded-full px-6 py-2 shadow-soft"
          onClick={onBack}
        >
          BACK
        </Button>
      </div>
    </div>
  )
}

export default IndividualScreen

