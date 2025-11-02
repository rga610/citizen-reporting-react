import { UserRound, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { useEffect, useState } from 'react'
import { api } from '@/utils/api'
import { getGroupLetter } from '@/utils/treatment'
import { useNavigate } from 'react-router-dom'

export interface ProfileScreenProps {
  onBack?: () => void
}

interface ParticipantData {
  publicCode?: string
  treatment?: string
  totalReports?: number
  email?: string
  phone?: string
  age?: number
  gender?: string
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const navigate = useNavigate()
  const [participant, setParticipant] = useState<ParticipantData | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    api
      .join()
      .then((res) => res.json())
      .then((data) => {
        setParticipant(data)
      })
      .catch(() => {
        // Error already logged by api.join
      })
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      const res = await api.logout()
      const data = await res.json()
      
      if (!res.ok) {
        console.error('Logout failed:', data)
        // Still clear local storage and navigate even if API fails
        sessionStorage.removeItem('participantCode')
        navigate('/')
        return
      }

      // Clear sessionStorage
      sessionStorage.removeItem('participantCode')
      // Navigate to login screen
      navigate('/')
    } catch (err) {
      console.error('Logout error:', err)
      // Still navigate to login even if logout API fails
      sessionStorage.removeItem('participantCode')
      navigate('/')
    } finally {
      setLoggingOut(false)
    }
  }

  const groupLetter = participant?.treatment ? getGroupLetter(participant.treatment) : '?'
  const displayName = participant?.publicCode || 'Participant'

  // Profile details - only show email and group assignment (phone, age, gender hidden as not relevant)
  const profileDetails = [
    { label: 'Email', value: participant?.email || 'Not provided' },
  ]

  return (
    <div className="min-h-screen bg-white px-4 py-6 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 animate-fade-in flex-1">
        {/* Welcome Section with Logout */}
        <div className="flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--wu-background)] border border-[var(--wu-muted)] flex-shrink-0">
              <UserRound className="h-8 w-8 text-[var(--wu-text-secondary)]" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-[var(--wu-text-secondary)]">Welcome back!</p>
              <p className={wuTypography.heading + ' text-xl leading-tight'}>{displayName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-[var(--wu-text-secondary)] hover:text-[var(--wu-text)] hover:bg-[var(--wu-muted)]"
            onClick={handleLogout}
            disabled={loggingOut}
            title={loggingOut ? 'Logging out...' : 'Logout'}
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
          </Button>
        </div>

        {/* Profile Details Box */}
        <div className="rounded-2xl border border-[var(--wu-muted)] bg-[var(--wu-muted)]/30 p-5">
          <dl className="space-y-0">
            {profileDetails.map((detail, index) => (
              <div
                key={detail.label}
                className={`flex justify-between items-start py-3 ${
                  index < profileDetails.length - 1 ? 'border-b border-[#E0E0E0]' : ''
                }`}
              >
                <dt className="text-sm text-[var(--wu-text)] font-medium pr-4">{detail.label}:</dt>
                <dd className="text-sm text-[var(--wu-text)] text-right flex-shrink-0 min-w-0 break-words">
                  {detail.value}
                </dd>
              </div>
            ))}
            {/* Group Assignment */}
            <div className="flex justify-between items-start py-3 border-t border-[#E0E0E0] mt-3 pt-3">
              <dt className="text-sm text-[var(--wu-text)] font-medium pr-4">Group Assignment:</dt>
              <dd className="text-sm font-semibold text-[var(--wu-primary)] flex-shrink-0">
                Group {groupLetter}
              </dd>
            </div>
          </dl>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full bg-[var(--wu-primary)] hover:bg-[var(--wu-primaryDark)] text-white">
            Terms &amp; Conditions
          </Button>
          <Button className="w-full bg-[var(--wu-primary)] hover:bg-[var(--wu-primaryDark)] text-white">
            Edit profile
          </Button>
          <Button className="w-full bg-[var(--wu-primary)] hover:bg-[var(--wu-primaryDark)] text-white">
            About the experiment
          </Button>
          <Button className="w-full bg-[var(--wu-primary)] hover:bg-[var(--wu-primaryDark)] text-white">
            Withdraw from  experiment :(
          </Button>
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

export default ProfileScreen

