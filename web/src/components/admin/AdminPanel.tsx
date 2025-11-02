import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, Edit2, X, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { api } from '@/utils/api'
import { getGroupLetter } from '@/utils/treatment'
import { cn } from '@/lib/utils'

interface Participant {
  id: string
  publicCode: string
  treatment: string
  totalReports: number
  isActive: boolean
}

interface AdminPanelProps {
  adminToken: string
  onClose?: () => void
}

export function AdminPanel({ adminToken, onClose }: AdminPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [editingScores, setEditingScores] = useState<Record<string, string>>({})
  const [activeActions, setActiveActions] = useState<Record<string, boolean>>({})

  const treatments = ['control', 'competitive', 'cooperative', 'individual'] as const
  const treatmentColors: Record<string, string> = {
    control: 'bg-blue-100 text-blue-800',
    competitive: 'bg-purple-100 text-purple-800',
    cooperative: 'bg-green-100 text-green-800',
    individual: 'bg-orange-100 text-orange-800',
  }

  useEffect(() => {
    fetchParticipants()
  }, [])

  const fetchParticipants = async () => {
    try {
      const res = await api.admin.getParticipants(adminToken)
      if (!res.ok) {
        throw new Error('Failed to fetch participants')
      }
      const data = await res.json()
      setParticipants(data)
      // Expand all groups by default
      const groups = new Set(treatments.map(t => getGroupLetter(t)))
      setExpandedGroups(groups)
    } catch (err) {
      console.error('Failed to fetch participants:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupLetter: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupLetter)) {
      newExpanded.delete(groupLetter)
    } else {
      newExpanded.add(groupLetter)
    }
    setExpandedGroups(newExpanded)
  }

  const handleResetGroup = async (treatment: string) => {
    const groupLetter = getGroupLetter(treatment)
    const actionKey = `reset-group-${treatment}`
    setActiveActions({ ...activeActions, [actionKey]: true })
    
    try {
      const res = await api.admin.resetGroup(adminToken, treatment)
      if (!res.ok) {
        throw new Error('Failed to reset group')
      }
      await fetchParticipants()
    } catch (err) {
      console.error('Failed to reset group:', err)
      alert('Failed to reset group scores. Check console for details.')
    } finally {
      setActiveActions({ ...activeActions, [actionKey]: false })
    }
  }

  const handleResetUser = async (participantId: string) => {
    const actionKey = `reset-user-${participantId}`
    setActiveActions({ ...activeActions, [actionKey]: true })
    
    try {
      const res = await api.admin.resetUser(adminToken, participantId)
      if (!res.ok) {
        throw new Error('Failed to reset user')
      }
      await fetchParticipants()
    } catch (err) {
      console.error('Failed to reset user:', err)
      alert('Failed to reset user score. Check console for details.')
    } finally {
      setActiveActions({ ...activeActions, [actionKey]: false })
    }
  }

  const handleSetScore = async (participantId: string, score: string) => {
    const numScore = parseInt(score, 10)
    if (isNaN(numScore) || numScore < 0) {
      alert('Score must be a non-negative number')
      return
    }

    const actionKey = `set-score-${participantId}`
    setActiveActions({ ...activeActions, [actionKey]: true })
    
    try {
      const res = await api.admin.setScore(adminToken, participantId, numScore)
      if (!res.ok) {
        throw new Error('Failed to set score')
      }
      setEditingScores({ ...editingScores, [participantId]: '' })
      await fetchParticipants()
    } catch (err) {
      console.error('Failed to set score:', err)
      alert('Failed to set score. Check console for details.')
    } finally {
      setActiveActions({ ...activeActions, [actionKey]: false })
    }
  }

  const startEditingScore = (participantId: string, currentScore: number) => {
    setEditingScores({ ...editingScores, [participantId]: currentScore.toString() })
  }

  const cancelEditingScore = (participantId: string) => {
    const newEditing = { ...editingScores }
    delete newEditing[participantId]
    setEditingScores(newEditing)
  }

  const groupedParticipants = participants.reduce((acc, p) => {
    const groupLetter = getGroupLetter(p.treatment)
    if (!acc[groupLetter]) {
      acc[groupLetter] = []
    }
    acc[groupLetter].push(p)
    return acc
  }, {} as Record<string, Participant[]>)

  const sortedGroups = Object.entries(groupedParticipants).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-soft max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-[var(--wu-muted)]">
          <h2 className={wuTypography.heading + ' text-2xl'}>Admin Panel</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-[var(--wu-text-secondary)] hover:text-[var(--wu-text)] transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-[var(--wu-text-secondary)]">Loading participants...</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-[var(--wu-text-secondary)]">
              No participants found.
            </div>
          ) : (
            sortedGroups.map(([groupLetter, group]) => {
              const treatment = group[0]?.treatment || ''
              const isExpanded = expandedGroups.has(groupLetter)
              const groupTotalReports = group.reduce((sum, p) => sum + p.totalReports, 0)
              
              return (
                <div key={groupLetter} className="border border-[var(--wu-muted)] rounded-2xl overflow-hidden">
                  {/* Group Header - Accordion */}
                  <button
                    onClick={() => toggleGroup(groupLetter)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--wu-muted)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${treatmentColors[treatment] || 'bg-gray-100 text-gray-800'}`}>
                        Group {groupLetter} - {treatment}
                      </span>
                      <span className="text-sm text-[var(--wu-text-secondary)]">
                        ({group.length} {group.length === 1 ? 'user' : 'users'})
                      </span>
                      <span className="text-sm font-medium text-[var(--wu-text)]">
                        Total: {groupTotalReports} {groupTotalReports === 1 ? 'report' : 'reports'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-[var(--wu-text-secondary)]" strokeWidth={2} />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[var(--wu-text-secondary)]" strokeWidth={2} />
                      )}
                    </div>
                  </button>

                  {/* Group Content - Accordion Body */}
                  {isExpanded && (
                    <div className="border-t border-[var(--wu-muted)] p-4 space-y-3">
                      {/* Reset Group Button */}
                      <div className="flex justify-end pb-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Reset all scores for Group ${groupLetter} (${treatment})?`)) {
                              handleResetGroup(treatment)
                            }
                          }}
                          disabled={activeActions[`reset-group-${treatment}`]}
                        >
                          {activeActions[`reset-group-${treatment}`] ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Group Scores
                            </>
                          )}
                        </Button>
                      </div>

                      {/* User List */}
                      <div className="space-y-2">
                        {group.map((participant) => {
                          const isEditing = editingScores.hasOwnProperty(participant.id)
                          const editingValue = editingScores[participant.id] || ''
                          const isResetting = activeActions[`reset-user-${participant.id}`]
                          const isSettingScore = activeActions[`set-score-${participant.id}`]

                          return (
                            <div
                              key={participant.id}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-xl border transition-all',
                                participant.isActive
                                  ? 'border-[var(--wu-primary)] bg-[var(--wu-muted)]'
                                  : 'border-[var(--wu-muted)] bg-white'
                              )}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-[var(--wu-text)] truncate">
                                    {participant.publicCode}
                                  </span>
                                  {participant.isActive && (
                                    <span className="text-xs text-[var(--wu-primary)] font-semibold">
                                      Active
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                {/* Score Display/Edit */}
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={editingValue}
                                      onChange={(e) => setEditingScores({ ...editingScores, [participant.id]: e.target.value })}
                                      className="w-20 px-2 py-1 rounded-lg border border-[var(--wu-primary)] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--wu-primary)]"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSetScore(participant.id, editingValue)
                                        } else if (e.key === 'Escape') {
                                          cancelEditingScore(participant.id)
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSetScore(participant.id, editingValue)}
                                      disabled={isSettingScore}
                                      className="p-1 text-[var(--wu-primary)] hover:bg-[var(--wu-muted)] rounded transition-colors"
                                      aria-label="Save score"
                                    >
                                      {isSettingScore ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" strokeWidth={2} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => cancelEditingScore(participant.id)}
                                      className="p-1 text-[var(--wu-text-secondary)] hover:bg-[var(--wu-muted)] rounded transition-colors"
                                      aria-label="Cancel"
                                    >
                                      <X className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-lg font-bold text-[var(--wu-primary)] min-w-[3rem] text-right">
                                      {participant.totalReports}p
                                    </span>
                                    <button
                                      onClick={() => startEditingScore(participant.id, participant.totalReports)}
                                      className="p-1.5 text-[var(--wu-text-secondary)] hover:text-[var(--wu-primary)] hover:bg-[var(--wu-muted)] rounded transition-colors"
                                      aria-label="Edit score"
                                    >
                                      <Edit2 className="h-4 w-4" strokeWidth={2} />
                                    </button>
                                  </>
                                )}

                                {/* Reset User Button */}
                                <button
                                  onClick={() => {
                                    if (confirm(`Reset score for ${participant.publicCode}?`)) {
                                      handleResetUser(participant.id)
                                    }
                                  }}
                                  disabled={isResetting || isEditing}
                                  className="p-1.5 text-[var(--wu-text-secondary)] hover:text-[var(--wu-danger)] hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                  aria-label="Reset score"
                                >
                                  {isResetting ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="h-4 w-4" strokeWidth={2} />
                                  )}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="p-6 border-t border-[var(--wu-muted)]">
          <Button className="w-full" variant="secondary" onClick={fetchParticipants}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdminPanel

