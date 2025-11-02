import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LeaderboardScreen from '@/components/screens/LeaderboardScreen'
import ControlScreen from '@/components/screens/ControlScreen'
import IndividualScreen from '@/components/screens/IndividualScreen'
import CooperativeScreen from '@/components/screens/CooperativeScreen'
import { api } from '@/utils/api'

export default function Feedback() {
  const navigate = useNavigate()
  const [participantCode, setParticipantCode] = useState<string | undefined>(() => {
    // Try to get from sessionStorage first
    return sessionStorage.getItem('participantCode') || undefined
  })
  const [treatment, setTreatment] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .join()
      .then((res) => res.json())
      .then((data) => {
        if (data.publicCode) {
          sessionStorage.setItem('participantCode', data.publicCode)
          setParticipantCode(data.publicCode)
        }
        if (data.treatment) {
          setTreatment(data.treatment)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  // Show loading state briefly
  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 flex items-center justify-center">
        <p className="text-[var(--wu-text-secondary)]">Loading...</p>
      </div>
    )
  }

  // Route to correct screen based on treatment
  // Group A = control, Group B = competitive, Group C = cooperative, Group D = individual
  switch (treatment) {
    case 'control':
      return <ControlScreen onBack={() => navigate('/hunt')} />
    case 'competitive':
      return <LeaderboardScreen onBack={() => navigate('/hunt')} participantCode={participantCode} />
    case 'cooperative':
      return <CooperativeScreen onBack={() => navigate('/hunt')} />
    case 'individual':
      return <IndividualScreen onBack={() => navigate('/hunt')} participantCode={participantCode} />
    default:
      // Fallback: show control screen if treatment unknown
      return <ControlScreen onBack={() => navigate('/hunt')} />
  }
}

