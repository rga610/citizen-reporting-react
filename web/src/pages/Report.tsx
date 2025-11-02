import { useNavigate } from 'react-router-dom'
import ReportScreen from '@/components/screens/ReportScreen'

export default function Report() {
  const navigate = useNavigate()

  return (
    <ReportScreen
      onClose={() => navigate('/hunt')}
      onSuccess={() => {
        // Optionally navigate to feedback or show success message
      }}
    />
  )
}

