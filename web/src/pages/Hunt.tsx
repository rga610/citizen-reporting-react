import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MapScreen from '@/components/screens/MapScreen'
import { api } from '@/utils/api'

export default function Hunt() {
  const navigate = useNavigate()

  useEffect(() => {
    api
      .join()
      .then((res) => {
        if (!res.ok) {
          // If 401, user needs to log in - redirect to login
          if (res.status === 401) {
            console.warn('[Hunt] Not authenticated, redirecting to login')
            navigate('/')
            return
          }
          throw new Error(`API error: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data) {
          // Store participantCode if we get it (new participant)
          if (data.publicCode) {
            sessionStorage.setItem('participantCode', data.publicCode)
          }
        }
      })
      .catch((err) => {
        console.error('[Hunt] Failed to fetch participant data:', err)
        // Error already logged by api.join
        // Silently handle - app can work without backend connection
      })
  }, [navigate])

  return (
    <MapScreen
      onViewInsights={() => navigate('/feedback')}
      onEnterCode={() => navigate('/report')}
      onProfile={() => navigate('/profile')}
    />
  )
}
