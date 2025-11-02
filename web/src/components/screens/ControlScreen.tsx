import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'

export interface ControlScreenProps {
  onBack?: () => void
}

export function ControlScreen({ onBack }: ControlScreenProps) {
  return (
    <div className="min-h-screen bg-white px-4 py-8 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col gap-6 animate-fade-in flex-1">
        <div className="rounded-2xl border border-[var(--wu-muted)] bg-[var(--wu-muted)]/60 px-5 py-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--wu-primary)] shadow-soft">
              <CheckCircle className="h-6 w-6" strokeWidth={2.4} />
            </div>
          </div>
          <p className={wuTypography.secondary + ' uppercase tracking-[0.3em] text-xs mb-2'}>
            Control feedback
          </p>
          <p className="text-sm text-[var(--wu-text)] leading-relaxed">
            Your reports are being recorded. Thank you for contributing to making campus a better place.
          </p>
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

export default ControlScreen

