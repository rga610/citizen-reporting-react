import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminPanel from '@/components/admin/AdminPanel'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { Shield, Lock } from 'lucide-react'

export default function Admin() {
  const navigate = useNavigate()
  const [adminToken, setAdminToken] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // In dev mode, allow bypassing token (for testing)
  const isDev = import.meta.env.DEV

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedToken = adminToken.trim()
    if (!trimmedToken) {
      setError('Admin token is required')
      return
    }

    // Test the token by making a simple admin request
    try {
      const { api } = await import('@/utils/api')
      const res = await api.admin.getParticipants(trimmedToken)
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        if (res.status === 401) {
          setError(`Invalid admin token. Make sure you're using the exact token from Railway (currently: "${trimmedToken}")`)
        } else if (res.status === 500) {
          setError('Server error: Admin token not configured on backend. Check Railway environment variables.')
        } else {
          setError(`Authentication failed: ${errorData.error || 'Unknown error'}`)
        }
        return
      }

      setAuthenticated(true)
    } catch (err) {
      console.error('Admin login error:', err)
      setError('Failed to connect to backend. Check your connection and ensure the API server is running.')
    }
  }

  if (authenticated) {
    return (
      <div className="min-h-screen bg-[var(--wu-background)]">
        <AdminPanel adminToken={adminToken.trim()} onClose={() => navigate('/')} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col gap-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--wu-muted)] border border-[var(--wu-primary)]/20">
              <Lock className="h-8 w-8 text-[var(--wu-primary)]" strokeWidth={2} />
            </div>
          </div>
          <h1 className={wuTypography.headingAccent + ' text-3xl sm:text-4xl'}>
            Admin Access
          </h1>
          <p className="text-sm text-[var(--wu-text-secondary)]">
            Enter admin token to access the admin panel
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="adminToken" className="block text-sm font-semibold text-[var(--wu-text)]">
              Admin Token
            </label>
            <input
              id="adminToken"
              type="password"
              value={adminToken}
              onChange={(e) => {
                setAdminToken(e.target.value)
                setError(null)
              }}
              placeholder="Enter admin token"
              className="w-full px-4 py-3 rounded-xl border border-[var(--wu-muted)] bg-white text-[var(--wu-text)] placeholder:text-[var(--wu-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--wu-primary)] focus:border-transparent transition-all"
              required
              autoFocus
            />
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {isDev && (
              <p className="text-xs text-[var(--wu-text-secondary)]">
                Development mode: Token validation required
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            <Shield className="h-4 w-4 mr-2" />
            Access Admin Panel
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--wu-text-secondary)] pt-4 border-t border-[var(--wu-muted)]">
          <p>WU Vienna • Admin Panel</p>
        </div>
      </div>
    </div>
  )
}

