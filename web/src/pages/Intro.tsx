import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { LogIn, AlertCircle, Shield, MapPin, Clock } from 'lucide-react'

export default function Intro() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { api } = await import('@/utils/api')
      const res = await api.login(username.trim())
      
      // Check content type before parsing JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('Non-JSON response from API:', text.substring(0, 200))
        setError('Server returned an invalid response. Please check that the API service is configured correctly.')
        setLoading(false)
        return
      }

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || 'This username is already logged in. Please use a different username.')
        } else if (res.status === 404) {
          setError('Username not found. Please check your username and try again.')
        } else {
          setError(data.error || 'Login failed. Please try again.')
        }
        setLoading(false)
        return
      }

      // Store participant code in sessionStorage
      if (data.publicCode) {
        sessionStorage.setItem('participantCode', data.publicCode)
      }

      // Navigate to hunt/map screen
      navigate('/hunt')
    } catch (err) {
      console.error('Login error:', err)
      setError('Unable to connect to server. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col gap-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--wu-muted)] border border-[var(--wu-primary)]/20">
              <Shield className="h-8 w-8 text-[var(--wu-primary)]" strokeWidth={2} />
            </div>
          </div>
          <h1 className={wuTypography.headingAccent + ' text-3xl sm:text-4xl'}>
            Welcome to the Experiment
          </h1>
          <p className="text-sm text-[var(--wu-text-secondary)]">
            WU Vienna • Citizen Reporting Study
          </p>
        </div>

        {/* Experiment Info */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--wu-muted)] bg-[var(--wu-muted)]/30 p-5 space-y-4">
            <h2 className={wuTypography.heading + ' text-lg'}>What you'll do:</h2>
            <ul className="space-y-3 text-sm text-[var(--wu-text)]">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[var(--wu-primary)] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>Walk around campus and find QR codes or issue markers</span>
              </li>
              <li className="flex items-start gap-3">
                <LogIn className="h-5 w-5 text-[var(--wu-primary)] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>Scan QR codes or enter issue codes manually</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[var(--wu-primary)] flex-shrink-0 mt-0.5" strokeWidth={2} />
                <span>Session lasts about 60 minutes</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--wu-muted)] bg-[var(--wu-muted)]/20 p-4">
            <p className="text-xs text-[var(--wu-text-secondary)] leading-relaxed">
              <strong>Note:</strong> This is a research experiment. By continuing, you consent to participate. 
              Location data is optional and will only be used for research purposes.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--wu-muted)] bg-white p-4">
            <h3 className={wuTypography.heading + ' text-sm mb-2'}>Privacy & Ethics</h3>
            <ul className="text-xs text-[var(--wu-text-secondary)] space-y-1">
              <li>• No personal information is collected</li>
              <li>• All data is pseudonymous</li>
              <li>• Data stored securely in EU-based servers</li>
              <li>• You can withdraw at any time</li>
            </ul>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-semibold text-[var(--wu-text)]">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                setError(null)
              }}
              placeholder="Enter your username (e.g., skinny_deer)"
              className="w-full px-4 py-3 rounded-xl border border-[var(--wu-muted)] bg-white text-[var(--wu-text)] placeholder:text-[var(--wu-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--wu-primary)] focus:border-transparent transition-all"
              disabled={loading}
              required
              autoFocus
            />
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !username.trim()}
          >
            {loading ? 'Logging in...' : 'Sign In & Start'}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--wu-text-secondary)] pt-4 border-t border-[var(--wu-muted)]">
          <p>Powered by WU Vienna • Citizen Reporting Experiment</p>
        </div>
      </div>
    </div>
  )
}

