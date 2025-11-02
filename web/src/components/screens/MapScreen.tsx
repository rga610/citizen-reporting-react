import { MapPin, ScanQrCode, Cog, Menu, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { useState, useRef } from 'react'
import DevPanel from '@/components/dev/DevPanel'

const mapMarkers = [
  { id: 1, top: '18%', left: '28%' },
  { id: 2, top: '42%', left: '62%' },
  { id: 3, top: '68%', left: '38%' },
  { id: 4, top: '58%', left: '78%' },
]

export interface MapScreenProps {
  onViewInsights?: () => void
  onEnterCode?: () => void
  onProfile?: () => void
}

export function MapScreen({ onViewInsights, onEnterCode, onProfile }: MapScreenProps) {
  const isDev = import.meta.env.DEV
  const [showDevPanel, setShowDevPanel] = useState(false)
  const menuClickCount = useRef(0)
  const menuClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMenuClick = () => {
    if (!isDev) return

    menuClickCount.current += 1

    // Clear existing timer
    if (menuClickTimer.current) {
      clearTimeout(menuClickTimer.current)
    }

    // If triple-clicked within 1 second, show dev panel
    if (menuClickCount.current >= 3) {
      setShowDevPanel(true)
      menuClickCount.current = 0
    } else {
      // Reset count after 1 second
      menuClickTimer.current = setTimeout(() => {
        menuClickCount.current = 0
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col gap-7 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            aria-label="Menu"
            onClick={handleMenuClick}
            className="p-2 -ml-2 text-[var(--wu-text-secondary)] hover:text-[var(--wu-text)] transition-colors"
          >
            <Menu className="h-6 w-6" strokeWidth={2} />
          </button>
          <button
            aria-label="Profile"
            onClick={onProfile}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--wu-background)] text-[var(--wu-text-secondary)] hover:text-[var(--wu-text)] transition-colors"
          >
            <UserRound className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="text-center space-y-2">
          <p className={wuTypography.headingAccent + ' text-2xl sm:text-3xl leading-snug'}>
            Help make Campus a better place
          </p>
          <p className="text-sm text-[var(--wu-text-secondary)]">
            Spot and report sustainability or accessibility issues across the university grounds.
          </p>
        </div>

        <div
          className="relative aspect-[9/13] w-full overflow-hidden rounded-[28px] border border-[var(--wu-muted)] bg-gradient-to-br from-[rgba(217,240,244,0.9)] via-white to-[rgba(217,240,244,0.9)]"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 16% 24%, rgba(11,128,167,0.25) 0, rgba(11,128,167,0) 45%), linear-gradient(120deg, rgba(11,128,167,0.15) 25%, transparent 25%), linear-gradient(300deg, rgba(11,128,167,0.18) 45%, transparent 45%)',
            }}
          />
          <div className="absolute inset-[14%] rounded-3xl border border-white/70 backdrop-blur-[2px]" />
          {mapMarkers.map((marker) => (
            <div
              key={marker.id}
              className="absolute transition-transform duration-200 ease-out hover:scale-110"
              style={{ top: marker.top, left: marker.left }}
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-[var(--wu-primary)]/40">
                <MapPin className="h-6 w-6 text-[var(--wu-primary)]" strokeWidth={2.2} />
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--wu-primary)]">
                  <Cog className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                </div>
              </div>
            </div>
          ))}
          
          <Button
            aria-label="Enter report code"
            variant="secondary"
            size="icon"
            className="absolute bottom-6 right-6 h-16 w-16 rounded-full border-2 border-[var(--wu-primary)] bg-white text-[var(--wu-primary)] shadow-soft hover:shadow-lg hover:border-[var(--wu-primary-dark)]"
            onClick={onEnterCode}
          >
            <ScanQrCode className="h-8 w-8" strokeWidth={2.4} />
          </Button>
        </div>

        <div className="space-y-3">
          <Button className="w-full" variant="secondary" onClick={onViewInsights}>
            View scores
          </Button>
        </div>

        <div className="flex justify-between items-center text-xs text-[var(--wu-text-secondary)]">
          <span>Powered by WU Vienna • Citizen Reporting Experiment</span>
          <span>v0.9</span>
        </div>
      </div>

      {/* Dev Panel - only shown in development */}
      {isDev && showDevPanel && (
        <DevPanel
          onClose={() => setShowDevPanel(false)}
          onSwitchUser={() => {
            setShowDevPanel(false)
            // Page will reload after switch
          }}
        />
      )}
    </div>
  )
}

export default MapScreen

