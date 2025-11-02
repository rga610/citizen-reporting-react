import { X, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { useEffect, useState } from 'react'
import { api } from '@/utils/api'
import { getGroupLetter } from '@/utils/treatment'

export interface DevPanelProps {
  onClose: () => void
}

interface Participant {
  id: string
  publicCode: string
  treatment: string
  totalReports: number
}

export function DevPanel({ onClose }: DevPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [switching, setSwitching] = useState<string | null>(null)

  useEffect(() => {
    fetchParticipants()
  }, [])

  const fetchParticipants = async () => {
    try {
      // Fetch participants list and current user info in parallel
      const [participantsRes, joinRes] = await Promise.all([
        api.dev.listParticipants(),
        api.join()
      ])
      
      const participantsData = await participantsRes.json()
      const joinData = await joinRes.json()
      
      setParticipants(participantsData)
      
      // Get current user's participant ID (available in dev mode)
      if (joinData.participantId) {
        setCurrentUserId(joinData.participantId)
      } else if (joinData.publicCode) {
        // Fallback: find by publicCode (might not be unique, but better than nothing)
        const current = participantsData.find((p: Participant) => p.publicCode === joinData.publicCode)
        if (current) {
          setCurrentUserId(current.id)
        }
      }
    } catch (err) {
      console.error('Failed to fetch participants:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchUser = async (participantId: string) => {
    setSwitching(participantId)
    try {
      await api.dev.switchUser(participantId)
      setCurrentUserId(participantId)
      // Clear sessionStorage to force refresh
      sessionStorage.removeItem('participantCode')
      // Reload page to apply new user
      window.location.reload()
    } catch (err) {
      console.error('Failed to switch user:', err)
      alert('Failed to switch user. Check console for details.')
    } finally {
      setSwitching(null)
    }
  }

  const groupedParticipants = participants.reduce((acc, p) => {
    const groupLetter = getGroupLetter(p.treatment)
    if (!acc[groupLetter]) {
      acc[groupLetter] = []
    }
    acc[groupLetter].push(p)
    return acc
  }, {} as Record<string, Participant[]>)

  // Sort groups by letter (A, B, C, D)
  const sortedGroups = Object.entries(groupedParticipants).sort(([a], [b]) => a.localeCompare(b))

  const treatmentColors: Record<string, string> = {
    control: 'bg-blue-100 text-blue-800',
    competitive: 'bg-purple-100 text-purple-800',
    cooperative: 'bg-green-100 text-green-800',
    individual: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft max-w-md w-full max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[var(--wu-muted)]">
          <h2 className={wuTypography.heading + ' text-xl'}>Dev Panel - Switch User</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[var(--wu-text-secondary)] hover:text-[var(--wu-text)] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-[var(--wu-text-secondary)]">Loading participants...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-[var(--wu-text-secondary)]">
              No participants found. Create some by visiting the app.
            </div>
          ) : (
            sortedGroups.map(([groupLetter, group]) => {
              const treatment = group[0]?.treatment || ''
              return (
                <div key={groupLetter} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${treatmentColors[treatment] || 'bg-gray-100 text-gray-800'}`}>
                      Group {groupLetter} - {treatment}
                    </span>
                    <span className="text-xs text-[var(--wu-text-secondary)]">
                      ({group.length} {group.length === 1 ? 'user' : 'users'})
                    </span>
                  </div>
                <div className="space-y-1">
                  {group.map((participant) => {
                    const isCurrent = participant.id === currentUserId
                    return (
                      <button
                        key={participant.id}
                        onClick={() => handleSwitchUser(participant.id)}
                        disabled={switching !== null || isCurrent}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? 'border-[var(--wu-primary)] bg-[var(--wu-muted)]'
                            : 'border-[var(--wu-muted)] hover:border-[var(--wu-primary)] hover:bg-[var(--wu-muted)]/50'
                        } ${switching !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[var(--wu-text-secondary)]" strokeWidth={2} />
                            <span className="font-medium text-[var(--wu-text)]">
                              {participant.publicCode}
                            </span>
                            {isCurrent && (
                              <span className="text-xs text-[var(--wu-primary)] font-semibold">
                                (Current)
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-[var(--wu-text)]">
                              {participant.totalReports} {participant.totalReports === 1 ? 'report' : 'reports'}
                            </div>
                            {switching === participant.id && (
                              <RefreshCw className="h-4 w-4 animate-spin text-[var(--wu-primary)] mt-1" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
            })
          )}
        </div>

        <div className="p-6 border-t border-[var(--wu-muted)]">
          <Button className="w-full" variant="secondary" onClick={fetchParticipants}>
            Refresh List
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DevPanel

