import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CompetitiveScreen from '@/components/screens/CompetitiveScreen'
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
      .then((res) => {
        if (!res.ok) {
          // If 401, user needs to log in - redirect to login
          if (res.status === 401) {
            console.warn('[Feedback] Not authenticated, redirecting to login')
            navigate('/')
            return
          }
          throw new Error(`API error: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          if (data.username) {
            sessionStorage.setItem('participantCode', data.username)
            setParticipantCode(data.username)
          }
          if (data.treatment) {
            setTreatment(data.treatment)
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Feedback] Failed to fetch participant data:', err)
        setLoading(false)
      })
  }, [navigate])

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
      return <CompetitiveScreen onBack={() => navigate('/hunt')} participantCode={participantCode} treatment={treatment} />
    case 'cooperative':
      return <CooperativeScreen onBack={() => navigate('/hunt')} />
    case 'individual':
      return <IndividualScreen onBack={() => navigate('/hunt')} participantCode={participantCode} />
    default:
      // Fallback: show control screen if treatment unknown
      return <ControlScreen onBack={() => navigate('/hunt')} />
  }
}

