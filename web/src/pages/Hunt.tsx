import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MapScreen from '@/components/screens/MapScreen'
import { api } from '@/utils/api'

export default function Hunt() {
  const navigate = useNavigate()

  useEffect(() => {
    void api
      .join()
      .then((res) => res.json())
      .then((data) => {
        // Store participantCode if we get it (new participant)
        if (data.publicCode) {
          sessionStorage.setItem('participantCode', data.publicCode)
        }
      })
      .catch(() => {
        // Error already logged by api.join
        // Silently handle - app can work without backend connection
      })
  }, [])

  return (
    <MapScreen
      onViewInsights={() => navigate('/feedback')}
      onEnterCode={() => navigate('/report')}
      onProfile={() => navigate('/profile')}
    />
  )
}
