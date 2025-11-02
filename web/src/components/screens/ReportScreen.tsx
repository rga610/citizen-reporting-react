import { useEffect, useRef, useState } from 'react'
import { X, ScanQrCode, Send } from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { wuTypography } from '@/theme/wu'
import { api } from '@/utils/api'

export interface ReportScreenProps {
  onClose: () => void
  onSuccess?: () => void
}

export function ReportScreen({ onClose, onSuccess }: ReportScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [scanning, setScanning] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  function cleanupCamera() {
    // Stop scanning
    if (readerRef.current && typeof (readerRef.current as any).reset === 'function') {
      try {
        ;(readerRef.current as any).reset()
      } catch (e) {
        // Ignore reset errors
      }
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
      })
      streamRef.current = null
    }

    // Clear video element (this will interrupt any pending play() calls gracefully)
    if (videoRef.current) {
      try {
        videoRef.current.pause()
        videoRef.current.srcObject = null
      } catch (e) {
        // Ignore errors during cleanup
      }
    }

    readerRef.current = null
  }

  function handleClose() {
    cleanupCamera()
    onClose()
  }

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = null
    let stream: MediaStream | null = null
    let mounted = true

    async function startScanning() {
      try {
        reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === 'videoinput')

        if (!mounted) return

        if (videoDevices.length === 0) {
          if (mounted) {
            setError('No camera found')
            setScanning(false)
          }
          return
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        streamRef.current = stream

        if (!mounted) {
          // Component unmounted while getting stream, cleanup
          stream.getTracks().forEach(track => track.stop())
          return
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
          } catch (err: any) {
            // Ignore play interruption errors (happens when component unmounts during play)
            if (err.name !== 'AbortError' && !err.message?.includes('play() request was interrupted')) {
              console.warn('Video play error:', err)
            }
            // Don't set error state for play interruptions
            return
          }
        }

        reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
          if (result) {
            const scannedCode = result.getText()
            setCode(scannedCode.toUpperCase())
            setScanning(false)
            setStatus('QR code scanned! Click submit to report.')
            // Stop scanning after successful scan
            if (reader && typeof (reader as any).reset === 'function') {
              try {
                ;(reader as any).reset()
              } catch (e) {
                // Ignore reset errors
              }
            }
          }
          // Suppress normal "no code found" errors - these are expected when scanning
          if (err) {
            const isNormalScanError = 
              err.name === 'NotFoundError' || 
              err.name === 'NotFoundException2' ||
              err.message?.includes('No MultiFormat Readers') ||
              err.message?.includes('No QR code found')
            
            if (!isNormalScanError) {
              console.error('Scan error:', err)
            }
          }
        })
      } catch (err: any) {
        // Don't show play interruption errors to user
        if (err.message?.includes('play() request was interrupted')) {
          return
        }
        if (mounted) {
          setError(err.message || 'Camera access denied')
          setScanning(false)
        }
      }
    }

    startScanning()

    return () => {
      mounted = false
      cleanupCamera()
    }
  }, [])

  async function submitReport() {
    if (!code.trim()) {
      setError('Please enter or scan a code')
      return
    }

    setSubmitting(true)
    setError(null)
    setStatus('Submitting...')

    try {
      const issueId = code.trim().toUpperCase()

      // Get location if available
      let lat: number | undefined
      let lon: number | undefined
      let accuracy: number | undefined

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
          })
          lat = pos.coords.latitude
          lon = pos.coords.longitude
          accuracy = pos.coords.accuracy
        } catch (err) {
          // Location optional, continue without it
        }
      }

      const res = await api.report(issueId, lat, lon, accuracy)
      const data = await res.json()

      if (data.status === 'ok') {
        setStatus('✓ Report submitted successfully!')
        setCode('')
        cleanupCamera()
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else if (data.status === 'duplicate') {
        setError('⚠ This issue has already been reported')
        setStatus(null)
      } else if (data.status === 'invalid') {
        setError(`✗ ${data.message || 'Invalid issue code'}`)
        setStatus(null)
      } else {
        setError(`Error: ${data.message || 'Unknown error'}`)
        setStatus(null)
      }
    } catch (err: any) {
      setError(`✗ ${err.message || 'Failed to submit report'}`)
      setStatus(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--wu-background)] z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-white border-b border-[var(--wu-muted)]">
        <h2 className={wuTypography.headingAccent + ' text-xl'}>Report Issue</h2>
        <button
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-[var(--wu-muted)] transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6 text-[var(--wu-text)]" />
        </button>
      </div>

      {/* Camera Viewport - Top 2/3 */}
      <div className="relative bg-black overflow-hidden" style={{ height: '66vh', flexShrink: 0 }}>
        {error && error.includes('camera') ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--wu-background)]">
            <div className="text-center space-y-4 p-8">
              <ScanQrCode className="h-16 w-16 text-[var(--wu-text-secondary)] mx-auto" />
              <p className="text-[var(--wu-text-secondary)]">Camera not available</p>
              <p className="text-sm text-[var(--wu-text-secondary)]">
                Use the manual input below to enter your code
              </p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <div className="w-64 h-64 border-4 border-[var(--wu-primary)] rounded-lg opacity-80">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
                  </div>
                  <p className="text-white text-center mt-4 text-sm font-medium">
                    Point camera at QR code
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Manual Input Section - Bottom 1/3 */}
      <div className="bg-white border-t border-[var(--wu-muted)] p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--wu-text)] uppercase tracking-wide">
            Or enter code manually
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter issue code (e.g., ISSUE_A01)"
            className="w-full border-2 border-[var(--wu-muted)] rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-[var(--wu-primary)] transition-colors"
            onKeyPress={(e) => e.key === 'Enter' && !submitting && submitReport()}
            disabled={submitting}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm text-center">
            {error}
          </div>
        )}

        {status && (
          <div
            className={`p-3 rounded-lg text-sm text-center ${
              status.startsWith('✓')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-[var(--wu-muted)] border border-[var(--wu-muted)] text-[var(--wu-text)]'
            }`}
          >
            {status}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={submitReport}
          disabled={submitting || !code.trim()}
        >
          <Send className="h-5 w-5 mr-2" />
          {submitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </div>
    </div>
  )
}

export default ReportScreen

