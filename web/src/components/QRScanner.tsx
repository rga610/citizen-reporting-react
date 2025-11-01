import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = null;
    let stream: MediaStream | null = null;

    async function startScanning() {
      try {
        reader = new BrowserMultiFormatReader();
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === "videoinput");
        
        if (videoDevices.length === 0) {
          setError("No camera found");
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
          if (result) {
            const code = result.getText();
            setScanning(false);
            onScan(code);
          }
          if (err && err.name !== "NotFoundError") {
            console.error("Scan error:", err);
          }
        });
      } catch (err: any) {
        setError(err.message || "Camera access denied");
        setScanning(false);
      }
    }

    startScanning();

    return () => {
      if (reader && typeof (reader as any).reset === "function") {
        (reader as any).reset();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-black/80 text-white">
        <h2 className="text-lg font-semibold">Scan QR Code</h2>
        <button onClick={onClose} className="px-4 py-2 bg-gray-700 rounded">Close</button>
      </div>
      
      <div className="flex-1 relative flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <div className="absolute inset-0 border-4 border-white rounded-lg m-8 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900 text-white text-center">
          {error}
        </div>
      )}

      {scanning && !error && (
        <div className="p-4 bg-black/80 text-white text-center">
          Point camera at QR code
        </div>
      )}
    </div>
  );
}

