import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Camera, RefreshCcw, CheckCircle, Eye, Volume2, Info, AlertTriangle, Zap } from 'lucide-react';
// Late-imported: FaceLandmarker, FilesetResolver from '@mediapipe/tasks-vision'
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { compressPhoto } from '../../utils/compress';
import { useLanguage } from '../../context/LanguageContext';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import ProtectionOverlay from '../ui/ProtectionOverlay';
import SecureCanvas from '../ui/SecureCanvas';
import PrivacyConsent from '../ui/PrivacyConsent';
import { useVoice } from '../../context/VoiceContext';
import { analyzeEnvironment } from '../../utils/cameraUtils';

interface CameraCaptureProps {
  shopId: string;
  onCapture: (dataUrl: string) => void;
}

export default function CameraCapture({ shopId, onCapture }: CameraCaptureProps) {
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<any | null>(null);
  const requestRef = useRef<number>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { speak } = useVoice();
  const [compressing, setCompressing] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const { isBlocked } = useAntiCapture(hasConsent);

  // Status Streaks (Feedback Smoothing)
  const faceStreakRef = useRef(0);
  const darkStreakRef = useRef(0);
  const positionStreakRef = useRef(0);

  const [livenessStep, setLivenessStep] = useState<'blink' | 'success' | 'failed'>('blink');
  const [blinkCount, setBlinkCount] = useState(0);
  const [lastEar, setLastEar] = useState(1);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isPositionIdeal, setIsPositionIdeal] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [envFeedback, setEnvFeedback] = useState<{ isTooDark: boolean; isTooBright: boolean; isBlurry: boolean }>({ isTooDark: false, isTooBright: false, isBlurry: false });
  const [tip, setTip] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(true);
  
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEnvCheckRef = useRef(0);
  
  const [baselineEar, setBaselineEar] = useState<number | null>(null);
  const earBufferRef = useRef<number[]>([]);
  const [showFlash, setShowFlash] = useState(false);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setShowFlash(true);
    vibrate(100);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;

    ctx.drawImage(video, 0, 0);

    const now = new Date();
    const dateStr = now.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
    const watermark = `${shopId} | ${dateStr} ${timeStr}`;

    const fontSize = Math.floor(canvas.width / 32);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, canvas.height - fontSize * 2.2, canvas.width, fontSize * 2.2);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(watermark, 12, canvas.height - fontSize * 1.1);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setCompressing(true);
    setTimeout(() => setShowFlash(false), 200);
    stopCamera();

    const compressed = await compressPhoto(rawDataUrl, 150 * 1024);
    setCaptured(compressed);
    onCapture(compressed);
    setCompressing(false);
  }, [shopId, onCapture, stopCamera, vibrate]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setLivenessStep('failed');
          speak(language === 'hi' ? 'समय समाप्त, कृपया दोबारा कोशिश करें' : 'Timeout, please try again');
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [language, speak]);

  const detectBlink = useCallback((landmarks: any[]) => {
    const getDist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const leftVertical = getDist(landmarks[159], landmarks[145]);
    const leftHorizontal = getDist(landmarks[33], landmarks[133]);
    const rightVertical = getDist(landmarks[386], landmarks[374]);
    const rightHorizontal = getDist(landmarks[362], landmarks[263]);
    const ear = ((leftVertical / leftHorizontal) + (rightVertical / rightHorizontal)) / 2;

    if (baselineEar === null) {
      // Longer calibration for better stability in low light (45 frames)
      earBufferRef.current = [...earBufferRef.current, ear].slice(-45);
      if (earBufferRef.current.length === 45) {
        const avg = earBufferRef.current.reduce((a, b) => a + b, 0) / 45;
        setBaselineEar(avg);
      }
      return;
    }

    const threshold = baselineEar * 0.65;

    if (ear < threshold && lastEar >= threshold) {
      vibrate(40);
      setBlinkCount(prev => {
        const next = prev + 1;
        if (next === 1) speak(language === 'hi' ? 'बहुत बढ़िया, एक और बार' : 'Great, one more time');
        if (next >= 2) {
          vibrate([50, 30, 50]);
          setLivenessStep('success');
          speak(language === 'hi' ? 'सत्यापन सफल, फोटो ली जा रही है' : 'Verification successful, taking photo');
        }
        return next;
      });
    }
    setLastEar(ear);
  }, [lastEar, language, speak, vibrate, baselineEar]);

  const processVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const now = performance.now();
    const results = landmarker.detectForVideo(video, now);
    const detectedFaces = results.faceLandmarks || [];
    const faceCountRaw = detectedFaces.length;
    setFaceCount(faceCountRaw);

    // Face Detection Streak (Smooth out flickering)
    if (faceCountRaw > 0) {
      faceStreakRef.current = Math.min(faceStreakRef.current + 1, 5);
    } else {
      faceStreakRef.current = Math.max(faceStreakRef.current - 1, 0);
    }
    setIsFaceDetected(faceStreakRef.current >= 3);

    // Environment Check Smoothing (1s interval)
    if (now - lastEnvCheckRef.current > 1000) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const analysis = analyzeEnvironment(ctx, canvas.width, canvas.height);
        
        // Dark Streak
        if (analysis.isTooDark) {
          darkStreakRef.current = Math.min(darkStreakRef.current + 1, 3);
        } else {
          darkStreakRef.current = 0;
        }

        setEnvFeedback({ 
          isTooDark: darkStreakRef.current >= 2, 
          isTooBright: analysis.isTooBright, 
          isBlurry: analysis.isBlurry 
        });
        lastEnvCheckRef.current = now;
      }
    }

    if (faceStreakRef.current >= 3) {
      const landmarks = detectedFaces[0];
      const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
      const isIdealRaw = faceWidth > 0.25 && faceWidth < 0.6;

      // Position Streak
      if (isIdealRaw) {
        positionStreakRef.current = Math.min(positionStreakRef.current + 1, 5);
      } else {
        positionStreakRef.current = 0;
      }
      setIsPositionIdeal(positionStreakRef.current >= 4);

      if (faceWidth < 0.25) {
        setTip(language === 'hi' ? 'कैमरा के थोड़ा पास आएं' : 'Come closer to camera');
      } else if (faceWidth > 0.6) {
        setTip(language === 'hi' ? 'थोड़ा दूर हटें' : 'Move a bit back');
      } else {
        setTip(null);
      }

      if (livenessStep === 'blink' && positionStreakRef.current >= 4) {
        detectBlink(landmarks);
      }
    } else {
      setTip(language === 'hi' ? 'चेहरा फ्रेम में लाएं' : 'Bring face into frame');
    }

    requestRef.current = requestAnimationFrame(processVideoFrame);
  }, [livenessStep, detectBlink, language]);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 640 }, 
          height: { ideal: 480 }
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          setLoading(false);
          requestRef.current = requestAnimationFrame(processVideoFrame);
        };
      }
    } catch {
      setError(t('customer.cameraError'));
      setLoading(false);
    }
  }, [t, processVideoFrame]);

  const initLandmarker = useCallback(async () => {
    try {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1
      });
      landmarkerRef.current = landmarker;
    } catch (err) {
      console.error("Failed to load face landmarker:", err);
      setError("Face detection initialization failed.");
    }
  }, []);

  const retake = useCallback(() => {
    setCaptured(null);
    setCompressing(false);
    setLivenessStep('blink');
    setBlinkCount(0);
    setBaselineEar(null);
    earBufferRef.current = [];
    faceStreakRef.current = 0;
    darkStreakRef.current = 0;
    positionStreakRef.current = 0;
    setIsCapturing(false);
    startTimer();
    startCamera();
    onCapture('');
  }, [onCapture, startCamera, startTimer]);

  useEffect(() => {
    if (hasConsent) {
      initLandmarker();
      startCamera();
      startTimer();
    }
    return () => {
      stopCamera();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timerRef.current) {
         clearInterval(timerRef.current);
         timerRef.current = null;
      }
    };
  }, [hasConsent, initLandmarker, startCamera, startTimer, stopCamera]);

  useEffect(() => {
    if (livenessStep === 'success' && !isCapturing) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsCapturing(true);
      const captureTimer = setTimeout(() => {
        capturePhoto();
      }, 500);
      return () => clearTimeout(captureTimer);
    }
  }, [livenessStep, isCapturing, capturePhoto]);

  useEffect(() => {
    if (hasConsent && !loading && livenessStep === 'blink') {
      const voiceTimer = setTimeout(() => {
        speak(language === 'hi' ? 'नमस्ते, कृपया अपनी आँखें दो बार झपकाएं' : 'Hi, please blink your eyes twice');
      }, 1000);
      return () => clearTimeout(voiceTimer);
    }
  }, [hasConsent, loading, speak, language, livenessStep]);

  // Memoized Silhouette Path to prevent flickering
  const SilhouetteSVG = useMemo(() => (
    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <mask id="face-mask">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <ellipse cx="50" cy="45" rx="28" ry="38" fill="black" />
        </mask>
        <radialGradient id="soft-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Soft Box Glow - Only visible in low light or while detecting */}
      <AnimatePresence>
        {isFaceDetected && !captured && !loading && (
          <motion.ellipse
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0 }}
            cx="50" cy="45" rx="40" ry="50"
            fill="url(#soft-glow)"
            className="pointer-events-none"
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          />
        )}
      </AnimatePresence>

      <rect
        x="0" y="0" width="100" height="100"
        fill="rgba(0,0,0,0.4)"
        mask="url(#face-mask)"
      />
      <ellipse
        cx="50" cy="45" rx="28" ry="38"
        fill="none"
        stroke={faceCount > 1 ? '#ef4444' : isPositionIdeal ? '#22c55e' : isFaceDetected ? '#eab308' : 'rgba(255,255,255,0.4)'}
        strokeWidth="0.5"
        className={`transition-all duration-300 ${isPositionIdeal ? 'animate-pulse' : ''}`}
      />

      {isFaceDetected && !captured && (
        <g className="opacity-30">
          {[...Array(8)].map((_, i) => (
            <motion.circle
              key={i}
              cx={50 + 28 * Math.cos(((i * 45) * Math.PI) / 180)}
              cy={45 + 38 * Math.sin(((i * 45) * Math.PI) / 180)}
              r="0.3"
              fill="#22c55e"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </g>
      )}

      {/* Moving Laser Scan Line */}
      {!captured && !loading && isFaceDetected && (
        <motion.rect
          x="22"
          width="56"
          height="0.2"
          fill="url(#laser-gradient)"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 0.15, 0], y: [10, 80, 10] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <defs>
        <linearGradient id="laser-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  ), [isFaceDetected, faceCount, isPositionIdeal, captured, loading]);

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <ProtectionOverlay isVisible={isBlocked} />
      
      {showFlash && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-[100] pointer-events-none" 
        />
      )}

      <AnimatePresence>
        {!hasConsent && (
          <PrivacyConsent onAgree={() => setHasConsent(true)} />
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />

      {!captured ? (
        <div className="w-full flex flex-col items-center gap-4">
          {/* Main Camera Container with Soft Box Outer Glow */}
          <div className={`relative w-full max-w-sm aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-700 ${isFaceDetected ? 'border-kirana-green/40 shadow-kirana-green/10' : 'border-white/10 shadow-black'}`}>
            
            {/* Screen Light Injection (Soft Box) */}
            <AnimatePresence>
              {isFaceDetected && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0 bg-white opacity-10 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 text-white">
                <div className="w-12 h-12 rounded-full border-4 border-kirana-green/20 border-t-kirana-green animate-spin mb-4" />
                <div className="text-sm font-bold opacity-50 tracking-widest uppercase">Initializing AI...</div>
              </div>
            )}

            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale-[20%]" />

            {/* SVG Face Guide Silhouette */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              {SilhouetteSVG}
            </div>

            {/* Premium Liveness Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-between p-6">
              <AnimatePresence mode="wait">
                <motion.div
                   key={livenessStep}
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                   className="w-full space-y-3"
                >
                  <div className={`p-4 rounded-2xl backdrop-blur-xl border-2 transition-all duration-500 ${livenessStep === 'blink' ? 'bg-kirana-green/30 border-kirana-green/50 shadow-lg shadow-kirana-green/20' : 'bg-black/60 border-white/10 opacity-30 scale-95'}`}>
                    {baselineEar === null && isFaceDetected ? (
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="text-sm font-bold uppercase tracking-widest">{language === 'hi' ? 'कैलिब्रेट हो रहा है...' : 'Calibrating...'}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-white text-base font-bold flex items-center gap-3">
                             <div className={`p-1.5 rounded-lg ${blinkCount >= 2 ? 'bg-kirana-green text-white shadow-kirana-green/50' : blinkCount > 0 ? 'bg-yellow-500 text-white' : 'bg-white/20 text-white'}`}>
                               {blinkCount >= 2 ? <CheckCircle size={18} /> : <Eye size={18} className={blinkCount < 2 && isFaceDetected ? 'animate-pulse' : ''} />}
                             </div>
                             {language === 'hi' ? 'आंखें झपकाएं' : 'Blink Naturally'}
                           </span>
                           {blinkCount > 0 && (
                             <motion.span
                               initial={{ scale: 0 }} animate={{ scale: 1 }}
                               className="bg-kirana-green text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider"
                             >
                               {blinkCount}/2
                             </motion.span>
                           )}
                        </div>
                        <div className="flex gap-2">
                           {[1, 2].map(i => (
                             <div key={i} className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                               <motion.div
                                 className="h-full bg-kirana-green"
                                 initial={{ width: 0 }}
                                 animate={{ width: blinkCount >= i ? '100%' : '0%' }}
                               />
                             </div>
                           ))}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Environment & Multi-face Alerts */}
              <AnimatePresence>
                {(tip || livenessStep === 'success' || faceCount > 1 || envFeedback.isTooDark || envFeedback.isBlurry) && (
                  <motion.div
                     initial={{ opacity: 0, scale: 0.8, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.8, y: 20 }}
                     className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-2xl backdrop-blur-2xl ${faceCount > 1
                         ? 'bg-red-500 text-white'
                         : envFeedback.isTooDark
                           ? 'bg-amber-500/80 text-white'
                           : livenessStep === 'success'
                             ? 'bg-kirana-green/90 text-white'
                             : 'bg-white/95 text-slate-900 border border-slate-200'
                       }`}
                  >
                    {faceCount > 1 ? (
                      <><AlertTriangle size={20} /> {language === 'hi' ? 'केवल एक व्यक्ति की अनुमति है' : 'Only one person allowed'}</>
                    ) : envFeedback.isTooDark ? (
                      <><Zap size={20} className="text-yellow-400" /> {language === 'hi' ? 'रोशनी कम है, रोशनी बढ़ाएं' : 'Low light, add more light'}</>
                    ) : envFeedback.isBlurry ? (
                      <><RefreshCcw size={20} /> {language === 'hi' ? 'फोटो धुंधली है' : 'Image is blurry'}</>
                    ) : livenessStep === 'success' ? (
                      <><CheckCircle size={24} className="animate-bounce" /> {language === 'hi' ? 'सफल! फोटो ली जा रही है...' : 'Perfect! Capturing...'}</>
                    ) : (
                      <><Info size={20} className="text-blue-500" /> {tip}</>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <div className={`text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-md border border-white/10 ${timer < 10 ? 'bg-red-500/50 text-white animate-pulse' : 'bg-black/40 text-white/70'}`}>
                {timer}s
              </div>
              <button
                 onClick={() => setShowVoice(!showVoice)}
                 className={`p-2 rounded-full backdrop-blur-md border border-white/20 transition-colors ${showVoice ? 'bg-kirana-green text-white' : 'bg-black/40 text-white/50'}`}
              >
                <Volume2 size={16} />
              </button>
            </div>

            {livenessStep === 'failed' && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center">
                <div className="bg-red-500/20 p-4 rounded-full mb-4">
                   <RefreshCcw size={48} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                   {language === 'hi' ? 'सत्यापन विफल' : 'Verification Failed'}
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                   {language === 'hi'
                     ? 'निर्धारित समय में प्रक्रिया पूरी नहीं हुई। कृपया अच्छी रोशनी में दोबारा प्रयास करें।'
                     : 'Process not completed in time. Please try again in a well-lit area.'}
                </p>
                <Button onClick={retake} variant="primary" className="w-full">
                   {language === 'hi' ? 'दोबारा प्रयास करें' : 'Try Again'}
                </Button>
              </div>
            )}

            {compressing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-40 gap-4">
                <div className="relative">
                   <div className="w-16 h-16 rounded-full border-4 border-kirana-green/20 border-t-kirana-green animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Camera size={20} />
                   </div>
                </div>
                <div className="text-xs font-bold tracking-widest uppercase opacity-50">Processing...</div>
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20 flex gap-3 max-w-sm">
             <Zap size={20} className="text-blue-500 shrink-0" />
             <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold leading-relaxed">
               {language === 'hi' 
                 ? 'टिप: अगर रोशनी कम है, तो स्क्रीन की चमक (Brightness) बढ़ाएं। स्क्रीन की रोशनी आपके चेहरे को पहचान में मदद करेगी।'
                 : 'Tip: If light is low, increase screen brightness. The screen light will help recognize your face.'}
             </p>
          </div>

          {error && (
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="flex flex-col items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100"
            >
              <p className="text-sm text-red-600 font-medium text-center px-4">{error}</p>
              <Button onClick={() => window.location.reload()} variant="ghost" className="px-3 py-1 text-sm text-red-500 hover:bg-red-100">
                 <RefreshCcw size={16} className="mr-2" /> Retry Security Check
              </Button>
            </motion.div>
          )}

          <div className="h-4" />
        </div>
      ) : (
        <>
          <div className="w-full max-w-sm">
            <SecureCanvas
               image={captured}
               width={640}
               height={480}
               tagline=""
            />
          </div>
          <p className="text-sm text-kirana-green font-semibold flex items-center gap-2">
             <div className="p-1 rounded-full bg-kirana-green/10">
               <CheckCircle size={16} />
             </div>
             {t('customer.photoTaken')}
          </p>
          <button
             onClick={retake}
             className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors py-2 px-4 rounded-xl border border-dotted border-slate-200"
          >
             <RefreshCcw size={15} /> {language === 'hi' ? 'साफ फोटो नहीं आई? दोबारा लें' : 'Not clear? Retake'}
          </button>
        </>
      )}
    </div>
  );
}
