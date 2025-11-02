import { Trophy, Sparkles, TrendingUp, Target, Medal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { cn } from '@/lib/utils'
import { useEffect, useState, useRef } from 'react'
import { api } from '@/utils/api'

export interface CompetitiveScreenProps {
  onBack?: () => void
  participantCode?: string
  treatment?: string // Add treatment prop to pass to SSE
}

interface FeedbackMessage {
  message: string
  icon: React.ReactNode
  tone: 'champion' | 'excellent' | 'great' | 'good' | 'encouraging'
}

function generateFeedbackMessage(
  rank: number,
  totalPlayers: number,
  userScore: number,
  leaderboard: Array<{ publicCode: string; totalReports: number }>
): FeedbackMessage {
  const leaderScore = leaderboard.length > 0 ? leaderboard[0].totalReports : 0
  const pointsBehindLeader = leaderScore - userScore
  const placesBehindLeader = rank - 1
  const isLast = rank === totalPlayers

  // Special case: User hasn't submitted any reports yet
  if (userScore === 0) {
    return {
      message: `📊 You haven't submitted any issues yet. That places you #${rank} out of ${totalPlayers} ${totalPlayers === 1 ? 'participant' : 'participants'}. Start reporting to climb the leaderboard!`,
      icon: <Target className="h-6 w-6" strokeWidth={2.4} />,
      tone: 'encouraging',
    }
  }

  // Rank 1 - Leader
  if (rank === 1) {
    return {
      message: `🏆 You're #1! You're leading with ${userScore} ${userScore === 1 ? 'report' : 'reports'}. Stay ahead of the competition!`,
      icon: <Medal className="h-6 w-6" strokeWidth={2.4} />,
      tone: 'champion',
    }
  }

  // Rank 2-3 - Close to leader
  if (rank <= 3) {
    return {
      message: `🥈 You're ranked #${rank} with ${userScore} ${userScore === 1 ? 'report' : 'reports'}. You're ${placesBehindLeader} ${placesBehindLeader === 1 ? 'place' : 'places'} behind the leader and ${pointsBehindLeader} ${pointsBehindLeader === 1 ? 'point' : 'points'} away from first place.`,
      icon: <Medal className="h-6 w-6" strokeWidth={2.4} />,
      tone: 'excellent',
    }
  }

  // Rank 4-5 - In top 5 but further back
  if (rank <= 5) {
    return {
      message: `🎯 You're ranked #${rank} with ${userScore} ${userScore === 1 ? 'report' : 'reports'}. You're ${placesBehindLeader} ${placesBehindLeader === 1 ? 'place' : 'places'} behind the leader. Catch up!`,
      icon: <Target className="h-6 w-6" strokeWidth={2.4} />,
      tone: 'good',
    }
  }

  // Last place - be very direct
  if (isLast && totalPlayers > 1) {
    return {
      message: `🐢 You're in last place with ${userScore} ${userScore === 1 ? 'report' : 'reports'}. You're ${placesBehindLeader} ${placesBehindLeader === 1 ? 'place' : 'places'} behind the leader. Start reporting to climb up!`,
      icon: <TrendingUp className="h-6 w-6" strokeWidth={2.4} />,
      tone: 'encouraging',
    }
  }

  // Not in top 5, but not last - be direct about position
  return {
    message: `📊 You're ranked #${rank} with ${userScore} ${userScore === 1 ? 'report' : 'reports'}. You're ${placesBehindLeader} ${placesBehindLeader === 1 ? 'place' : 'places'} behind the leader and ${pointsBehindLeader} ${pointsBehindLeader === 1 ? 'point' : 'points'} away. Submit more reports to break into the top 5!`,
    icon: <TrendingUp className="h-6 w-6" strokeWidth={2.4} />,
    tone: 'encouraging',
  }
}

export function CompetitiveScreen({ onBack, participantCode, treatment }: CompetitiveScreenProps) {
  const [leaderboard, setLeaderboard] = useState<Array<{ publicCode: string; totalReports: number }>>([])
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null)
  const leaderboardRef = useRef<HTMLUListElement>(null)
  const userEntryRef = useRef<HTMLLIElement>(null)
  const hasScrolledInitially = useRef(false) // Flag to ensure auto-scroll only happens once

  useEffect(() => {
    // Pass treatment to SSE so backend can filter by group even if cookies aren't sent
    const es = api.sse(1, treatment)

    es.onmessage = (e) => {
      try {
        const update = JSON.parse(e.data)
        if (update.type === 'comp' && update.top) {
          const entries = update.top as Array<{ publicCode: string; totalReports: number }>
          setLeaderboard(entries)
          
          if (participantCode) {
            // Get user's rank from SSE data (all participants are included)
            let userRank: number | undefined = update.userRank;
            let userScore: number | undefined = update.userScore;
            const totalParticipantsInGroup = update.totalParticipantsInGroup || 0;

            // Get rank from leaderboard position (user should always be in entries since we show all participants)
            const userEntryInTop = entries.find((e) => e.publicCode === participantCode)
            if (userEntryInTop) {
              userRank = entries.findIndex((e) => e.publicCode === participantCode) + 1
              userScore = userEntryInTop.totalReports
            }

            // Generate feedback if we have rank and score
            if (userRank !== undefined && userScore !== undefined && totalParticipantsInGroup > 0) {
              const feedback = generateFeedbackMessage(userRank, totalParticipantsInGroup, userScore, entries)
              setFeedbackMessage(feedback)
            } else if (userRank !== undefined && totalParticipantsInGroup > 0) {
              // We have rank but not score (shouldn't happen, but handle gracefully)
              // Assume 0 reports if score is undefined
              const feedback = generateFeedbackMessage(userRank, totalParticipantsInGroup, 0, entries)
              setFeedbackMessage(feedback)
            } else if (entries.length > 0) {
              // Fallback if data not available - still show general message
              const feedback: FeedbackMessage = {
                message: `📊 See how you compare! ${entries.length} ${entries.length === 1 ? 'participant' : 'participants'} in your group. Submit reports to see your position!`,
                icon: <Trophy className="h-6 w-6" strokeWidth={2.4} />,
                tone: 'good',
              }
              setFeedbackMessage(feedback)
            } else {
              setFeedbackMessage(null)
            }
          } else if (entries.length > 0) {
            // No participant code yet but we have leaderboard data - show general message
            const feedback: FeedbackMessage = {
              message: `📊 See how you compare! ${entries.length} ${entries.length === 1 ? 'participant' : 'participants'} in your group. Submit reports to see your position!`,
              icon: <Trophy className="h-6 w-6" strokeWidth={2.4} />,
              tone: 'good',
            }
            setFeedbackMessage(feedback)
          } else {
            setFeedbackMessage(null)
          }
        }
      } catch (err) {
        console.error('SSE parse error:', err)
      }
    }

    es.onerror = () => {
      // Error already logged by api.sse
      // Don't spam console with repeated errors
    }

    return () => es.close()
  }, [participantCode, treatment])

  // Auto-scroll to user's position only on initial load (once)
  useEffect(() => {
    if (userEntryRef.current && leaderboardRef.current && leaderboard.length > 0 && !hasScrolledInitially.current) {
      // Small delay to ensure DOM is updated after state change
      const timeoutId = setTimeout(() => {
        userEntryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center', // Center the user's entry in the viewport
        })
        hasScrolledInitially.current = true // Mark as scrolled so it doesn't happen again
      }, 150)
      
      return () => clearTimeout(timeoutId)
    }
  }, [leaderboard, participantCode])

  const leaderboardEntries = leaderboard.map((entry, index) => ({
    rank: index + 1,
    name: entry.publicCode,
    points: entry.totalReports,
    isCurrentUser: entry.publicCode === participantCode,
  }))

  return (
    <div className="h-screen bg-[var(--wu-background)] px-4 py-8 flex flex-col overflow-hidden">
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 animate-fade-in">
        <div className="rounded-2xl border border-[var(--wu-muted)] bg-[var(--wu-muted)]/60 px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--wu-primary)] shadow-soft flex-shrink-0">
              {feedbackMessage?.icon || <Trophy className="h-6 w-6" strokeWidth={2.4} />}
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <p className={wuTypography.secondary + ' uppercase tracking-[0.3em] text-xs'}>
                Competitive framing
              </p>
              <p className="text-sm text-[var(--wu-text)] leading-relaxed">
                {feedbackMessage?.message || 'Loading leaderboard...'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className={wuTypography.headingAccent + ' text-xl'}>Leaderboard</p>
            <Sparkles className="h-5 w-5 text-[var(--wu-primary)]" aria-hidden />
          </div>

          <div className="rounded-3xl border border-[var(--wu-muted)] bg-white shadow-soft overflow-hidden" style={{ height: 'calc(100vh - 380px)', minHeight: '450px' }}>
            <ul ref={leaderboardRef} className="divide-y divide-[var(--wu-muted)]/80 overflow-y-auto h-full">
              {leaderboardEntries.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-[var(--wu-text-secondary)]">
                  No leaderboard data yet
                </li>
              ) : (
                leaderboardEntries.map((entry) => (
                  <li
                    key={entry.rank}
                    ref={entry.isCurrentUser ? userEntryRef : null}
                    className={cn(
                      'flex items-center gap-4 px-5 py-3 text-sm transition-colors duration-150',
                      entry.isCurrentUser
                        ? 'bg-[var(--wu-muted-strong)] border-l-4 border-[var(--wu-primary)]'
                        : 'hover:bg-[var(--wu-muted)]/35'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold uppercase',
                        entry.isCurrentUser
                          ? 'border-[var(--wu-primary)] text-[var(--wu-primary)] bg-white'
                          : 'border-[var(--wu-muted)] text-[var(--wu-text-secondary)]'
                      )}
                    >
                      #{entry.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--wu-text)]">{entry.name}</p>
                      {entry.isCurrentUser && (
                        <p className="text-xs uppercase tracking-wide text-[var(--wu-primary)]">You</p>
                      )}
                    </div>
                    <span className="font-semibold text-[var(--wu-primary)]">{entry.points}p</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full pb-4 flex justify-center flex-shrink-0 mt-auto">
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

export default CompetitiveScreen

