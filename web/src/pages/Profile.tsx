import { useNavigate } from 'react-router-dom'
import ProfileScreen from '@/components/screens/ProfileScreen'

export default function Profile() {
  const navigate = useNavigate()

  return <ProfileScreen onBack={() => navigate('/hunt')} />
}

