import React, { useRef, useState, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  userName: string;
  onCancel: () => void;
}

type LegacyNavigator = Navigator & {
  webkitGetUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (err: unknown) => void
  ) => void;
  mozGetUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (err: unknown) => void
  ) => void;
  msGetUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (err: unknown) => void
  ) => void;
};

const getMediaStream = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const legacyNavigator = navigator as LegacyNavigator;
  const legacyGetUserMedia =
    legacyNavigator.webkitGetUserMedia ||
    legacyNavigator.mozGetUserMedia ||
    legacyNavigator.msGetUserMedia;

  if (!legacyGetUserMedia) {
    throw new Error('Camera API is not supported in this browser.');
  }

  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(legacyNavigator, constraints, resolve, reject);
  });
};

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, userName, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('Camera API is not supported in this browser.');
        setHasPermission(false);
        return;
      }

      try {
        let s: MediaStream;
        try {
          s = await getMediaStream({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
          });
        } catch (initialErr) {
          console.warn("Environment camera failed, falling back to generic camera", initialErr);
          // Fallback to any available camera if environment fails (e.g., Samsung browser issues)
          s = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }

        streamRef.current = s;
        setStream(s);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.muted = true;
          videoRef.current.play().catch((playErr) => {
            console.warn('Video autoplay failed, waiting for user interaction.', playErr);
          });
        }
        setHasPermission(true);
      } catch (err) {
        console.error('Camera access totally failed:', err);
        setHasPermission(false);
      }
    }

    setupCamera();

    return () => {
      stopStream();
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      context.fillStyle = 'rgba(0, 0, 0, 0.6)';
      context.fillRect(0, canvas.height - 60, canvas.width, 60);

      const formattedUserName = userName.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

      const now = new Date();
      const timestamp = now.toLocaleString('lt-LT');
      context.fillStyle = 'white';
      context.font = 'bold 20px Inter, Arial';
      context.fillText(`${timestamp} | Op: ${formattedUserName}`, 20, canvas.height - 25);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPreviewImage(dataUrl);
    }
  };

  const confirmPhoto = () => {
    if (previewImage) {
      onCapture(previewImage);
      stopStream();
    }
  };

  const retakePhoto = () => {
    setPreviewImage(null);
  };

  const handleCancel = () => {
    stopStream();
    onCancel();
  };

  if (hasPermission === false) {
    return (
      <div className="p-10 text-center bg-red-50 rounded-2xl border border-red-200">
        <p className="text-red-600 font-bold">Klaida: Nepavyko pasiekti kameros.</p>
        <button onClick={handleCancel} className="mt-4 text-slate-600 underline">Grįžti</button>
      </div>
    );
  }

  const toggleFlash = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      // @ts-ignore
      if (capabilities.torch) {
        try {
          // @ts-ignore
          await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
          setFlashOn(!flashOn);
        } catch (e) {
          console.error('Flash error:', e);
        }
      }
    }
  };

  return (
    <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-[500px] object-cover ${previewImage ? 'hidden' : 'block'}`}
      />
      {previewImage && (
        <img src={previewImage} alt="Preview" className="w-full h-[500px] object-cover" />
      )}
      <canvas ref={canvasRef} className="hidden" />

      {!previewImage && (
        <div className="absolute inset-0 border-4 border-dashed border-white/30 pointer-events-none m-8 rounded-2xl"></div>
      )}

      {!previewImage && (
        <button
          onClick={toggleFlash}
          className={`absolute top-8 right-8 p-4 rounded-full backdrop-blur-md transition-all ${flashOn ? 'bg-yellow-400 text-yellow-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-center bg-gradient-to-t from-black/80 to-transparent">
        {previewImage ? (
          <>
            <button
              onClick={retakePhoto}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-xl font-bold backdrop-blur-md transition-all uppercase tracking-wider text-sm"
            >
              KARTOTI
            </button>
            <button
              onClick={confirmPhoto}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-black shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-widest"
            >
              PATVIRTINTI
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold backdrop-blur-md transition-all"
            >
              Atšaukti
            </button>

            <button
              onClick={takePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform group"
            >
              <div className="w-16 h-16 border-4 border-slate-900 rounded-full group-hover:bg-slate-100 transition-colors"></div>
            </button>

            <div className="w-24"></div>
          </>
        )}
      </div>
    </div>
  );
};
