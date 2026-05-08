import { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCcw, CheckCircle, Eye, Volume2, Info, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { compressPhoto } from '../../utils/compress';
import { useLanguage } from '../../context/LanguageContext';
import { useAntiCapture } from '../../hooks/useAntiCapture';
import ProtectionOverlay from '../ui/ProtectionOverlay';
import SecureCanvas from '../ui/SecureCanvas';
import PrivacyConsent from '../ui/PrivacyConsent';
import { useVoice } from '../../context/VoiceContext';

// Fast environment check using a tiny 64x64 canvas to prevent lag on low-end devices
function analyzeEnvironmentFast(video: HTMLVideoElement): { isTooDark: boolean; isTooBright: boolean; isBlurry: boolean } {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { isTooDark: false, isTooBright: false, isBlurry: false };
    
    ctx.drawImage(video, 0, 0, 64, 64);
    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;
    
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      // relative luminance
      const brightness = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
      totalBrightness += brightness;
    }
    const avgBrightness = totalBrightness / (64 * 64);
    
    return {
      isTooDark: avgBrightness < 30, // 0-255 scale
      isTooBright: avgBrightness > 240,
      isBlurry: false // Blurry check skipped to save CPU cycles
    };
  } catch (e) {
    return { isTooDark: false, isTooBright: false, isBlurry: false };
  }
}

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
  const lastInferenceTimeRef = useRef<number>(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { speak } = useVoice();
  const [compressing, setCompressing] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const { isBlocked } = useAntiCapture(hasConsent);

  const faceStreakRef = useRef(0);
  
  const [livenessStep, setLivenessStep] = useState<'action' | 'success' | 'failed'>('action');
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isPositionIdeal, setIsPositionIdeal] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [envFeedback, setEnvFeedback] = useState({ isTooDark: false, isTooBright: false, isBlurry: false });
  const [tip, setTip] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(true);
  
  const [timer, setTimer] = useState(20);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastEnvCheckRef = useRef(0);
  
  const initialNoseXRef = useRef<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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

    // Mirror image so the captured photo matches the preview exactly
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform for watermark

    const now = new Date();
    const dateStr = now.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });
    const watermark = `${shopId} | ${dateStr} ${timeStr}`;

    const fontSize = Math.max(14, Math.floor(canvas.width / 30));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, canvas.height - fontSize * 2.5, canvas.width, fontSize * 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(watermark, 10, canvas.height - fontSize * 1.25);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.80);

    setCompressing(true);
    setTimeout(() => setShowFlash(false), 150);
    stopCamera();

    try {
      const compressed = await compressPhoto(rawDataUrl, 100 * 1024);
      setCaptured(compressed);
      onCapture(compressed);
    } catch (e) {
      console.error(e);
      setCaptured(rawDataUrl);
      onCapture(rawDataUrl);
    } finally {
      setCompressing(false);
    }
  }, [shopId, onCapture, stopCamera, vibrate]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimer(20); // Faster timeout for better flow
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

  const detectLivenessAction = useCallback((landmarks: any[]) => {
    // Check Blink (Eye Aspect Ratio)
    const getDist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    const leftVertical = getDist(landmarks[159], landmarks[145]);
    const leftHorizontal = getDist(landmarks[33], landmarks[133]);
    const rightVertical = getDist(landmarks[386], landmarks[374]);
    const rightHorizontal = getDist(landmarks[362], landmarks[263]);
    const ear = ((leftVertical / leftHorizontal) + (rightVertical / rightHorizontal)) / 2;

    // Check Head Movement (Yaw approximation using nose vs frame boundaries)
    const nose = landmarks[1];
    if (initialNoseXRef.current === null) {
      initialNoseXRef.current = nose.x;
      return; // Need at least one frame to compare
    }
    const headMoved = Math.abs(nose.x - initialNoseXRef.current) > 0.02; // Very sensitive head movement detection

    // Hardcoded EAR threshold for immediate detection without any baseline calibration wait
    const blinkDetected = ear < 0.22;

    // Pass liveness immediately if user blinks OR moves head slightly
    if (blinkDetected || headMoved) {
      vibrate([50, 30, 50]);
      setLivenessStep('success');
      speak(language === 'hi' ? 'सत्यापन सफल, फोटो ली जा रही है' : 'Verification successful, capturing');
    }
  }, [language, speak, vibrate]);

  const processVideoFrame = useCallback(async () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState !== 4) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const now = performance.now();
    // Throttle FaceLandmarker to ~16 FPS (60ms) to catch fast blinks while still being performant
    if (now - lastInferenceTimeRef.current < 60) {
      requestRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }
    lastInferenceTimeRef.current = now;

    let detectedFaces = [];
    try {
      const results = landmarker.detectForVideo(video, now);
      detectedFaces = results.faceLandmarks || [];
    } catch (e) {
      console.error('Landmarker error', e);
    }
    
    setFaceCount(detectedFaces.length);

    // Fast Environment Check (once per second)
    if (now - lastEnvCheckRef.current > 1000) {
      const env = analyzeEnvironmentFast(video);
      setEnvFeedback(env);
      lastEnvCheckRef.current = now;
    }

    if (detectedFaces.length > 0) {
      faceStreakRef.current = Math.min(faceStreakRef.current + 1, 3);
    } else {
      faceStreakRef.current = 0;
      initialNoseXRef.current = null; // Reset head movement baseline when face lost
    }
    setIsFaceDetected(faceStreakRef.current >= 1); // Instantly detect face

    if (faceStreakRef.current >= 1) {
      const landmarks = detectedFaces[0];
      const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
      const isIdeal = faceWidth > 0.20 && faceWidth < 0.70; // Highly tolerant ideal position
      setIsPositionIdeal(isIdeal);

      if (faceWidth < 0.20) {
        setTip(language === 'hi' ? 'थोड़ा पास आएं' : 'Move closer');
      } else if (faceWidth > 0.70) {
        setTip(language === 'hi' ? 'थोड़ा दूर हटें' : 'Move back');
      } else {
        setTip(null);
      }

      if (livenessStep === 'action' && isIdeal) {
        detectLivenessAction(landmarks);
      }
    } else {
      setIsPositionIdeal(false);
      setTip(language === 'hi' ? 'चेहरा फ्रेम में लाएं' : 'Bring face into frame');
    }

    requestRef.current = requestAnimationFrame(processVideoFrame);
  }, [livenessStep, detectLivenessAction, language]);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 480 }, 
          height: { ideal: 640 },
          frameRate: { ideal: 15, max: 30 } // Optimized frame rate for low end phones
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
    } catch (err) {
      setError(t('customer.cameraError'));
      setLoading(false);
    }
  }, [t, processVideoFrame]);

  const initSystem = useCallback(async () => {
    startCamera();
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
      setError("Face detection failed to load. Check network.");
    }
  }, [startCamera]);

  const retake = useCallback(() => {
    setCaptured(null);
    setCompressing(false);
    setLivenessStep('action');
    initialNoseXRef.current = null;
    faceStreakRef.current = 0;
    setIsCapturing(false);
    startTimer();
    initSystem();
    onCapture('');
  }, [onCapture, startTimer, initSystem]);

  useEffect(() => {
    if (hasConsent) {
      initSystem();
      startTimer();
    }
    return () => {
      // Memory Leak Fix: Cleanup properly
      stopCamera();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (landmarkerRef.current) {
        try { landmarkerRef.current.close(); } catch (e) {}
        landmarkerRef.current = null;
      }
    };
  }, [hasConsent, initSystem, startTimer, stopCamera]);

  useEffect(() => {
    if (livenessStep === 'success' && !isCapturing) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsCapturing(true);
      const captureTimer = setTimeout(() => {
        capturePhoto();
      }, 100); // Super fast capture delay
      return () => clearTimeout(captureTimer);
    }
  }, [livenessStep, isCapturing, capturePhoto]);

  useEffect(() => {
    if (hasConsent && !loading && livenessStep === 'action') {
      const voiceTimer = setTimeout(() => {
        if (showVoice) speak(language === 'hi' ? 'कैमरे में देखें और पलकें झपकाएं' : 'Look at camera and blink');
      }, 500); // Shorter voice prompt delay
      return () => clearTimeout(voiceTimer);
    }
  }, [hasConsent, loading, speak, language, livenessStep, showVoice]);

  return (
    <div className="flex flex-col items-center gap-4 relative">
      <ProtectionOverlay isVisible={isBlocked} />
      
      {showFlash && (
        <div className="fixed inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-150" />
      )}

      <AnimatePresence>
        {!hasConsent && (
          <PrivacyConsent onAgree={() => setHasConsent(true)} />
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />

      {!captured ? (
        <div className="w-full flex flex-col items-center gap-4">
          <div className={`relative w-full max-w-sm aspect-[3/4] bg-slate-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl border-4 transition-all duration-300 ${isFaceDetected ? 'border-kirana-green/60 shadow-kirana-green/20' : 'border-white/10'}`}>
            
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950 text-white">
                <div className="w-10 h-10 rounded-full border-4 border-kirana-green/20 border-t-kirana-green animate-spin mb-4" />
                <div className="text-xs font-bold opacity-60 tracking-wider uppercase">Loading Camera...</div>
              </div>
            )}

            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />

            {/* Fast CSS-based Face Guide Silhouette - No laggy SVG! */}
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
               {/* Center Oval Hole created with box-shadow */}
               <div className={`w-[75%] h-[60%] md:w-[65%] md:h-[55%] rounded-[50%] border-2 transition-colors duration-300 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ${isPositionIdeal ? 'border-kirana-green' : isFaceDetected ? 'border-yellow-400' : 'border-white/30'}`}>
                  {isPositionIdeal && !captured && (
                     <div className="absolute inset-0 rounded-[50%] border-4 border-kirana-green/30 animate-ping" />
                  )}
               </div>
            </div>

            {/* Top Bar for Timer and Voice */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <div className={`text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${timer < 10 ? 'bg-red-500/80 text-white animate-pulse' : 'bg-black/50 text-white'}`}>
                {timer}s
              </div>
              <button
                 onClick={() => setShowVoice(!showVoice)}
                 className={`p-2 rounded-full backdrop-blur-md transition-colors ${showVoice ? 'bg-kirana-green/90 text-white' : 'bg-black/50 text-white/50'}`}
              >
                <Volume2 size={16} />
              </button>
            </div>

            {/* Bottom Status Panel */}
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-20 flex flex-col items-center px-4">
               <AnimatePresence mode="wait">
                 {(tip || livenessStep === 'success' || faceCount > 1 || envFeedback.isTooDark) && (
                   <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg mb-3 ${faceCount > 1
                          ? 'bg-red-500 text-white'
                          : envFeedback.isTooDark
                            ? 'bg-amber-500 text-white'
                            : livenessStep === 'success'
                              ? 'bg-kirana-green text-white'
                              : 'bg-white text-slate-900'
                        }`}
                   >
                     {faceCount > 1 ? (
                       <><AlertTriangle size={16} /> {language === 'hi' ? 'केवल एक व्यक्ति' : 'One person only'}</>
                     ) : envFeedback.isTooDark ? (
                       <><Zap size={16} /> {language === 'hi' ? 'रोशनी कम है' : 'Low light'}</>
                     ) : livenessStep === 'success' ? (
                       <><CheckCircle size={18} /> {language === 'hi' ? 'सफल!' : 'Success!'}</>
                     ) : (
                       <><Info size={16} className="text-blue-500" /> {tip}</>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>

               {isPositionIdeal && livenessStep === 'action' && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                   className="bg-kirana-green/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-xl border border-kirana-green/50"
                 >
                   <Eye size={24} className="animate-pulse" />
                   {language === 'hi' ? 'पलक झपकाएं या सिर हिलाएं' : 'Blink or nod your head'}
                 </motion.div>
               )}
            </div>

            {livenessStep === 'failed' && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 text-white p-6 text-center backdrop-blur-sm">
                <div className="bg-red-500/20 p-4 rounded-full mb-4">
                   <AlertTriangle size={40} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                   {language === 'hi' ? 'सत्यापन विफल' : 'Verification Failed'}
                </h3>
                <p className="text-sm text-slate-300 mb-6 px-4">
                   {language === 'hi'
                     ? 'कृपया अच्छी रोशनी में दोबारा प्रयास करें।'
                     : 'Please try again in better lighting.'}
                </p>
                <Button onClick={retake} variant="primary" className="w-full max-w-[200px] shadow-lg shadow-kirana-green/30">
                   {language === 'hi' ? 'दोबारा प्रयास करें' : 'Try Again'}
                </Button>
              </div>
            )}

            {compressing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white z-40 backdrop-blur-sm gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-kirana-green/20 border-t-kirana-green animate-spin" />
                <div className="text-sm font-bold tracking-widest uppercase opacity-80">Saving...</div>
              </div>
            )}
          </div>

          {error && (
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="flex flex-col items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100 w-full max-w-sm"
            >
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
              <Button onClick={retake} variant="ghost" className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 bg-red-100/50">
                 <RefreshCcw size={16} className="mr-2" /> Retry Camera
              </Button>
            </motion.div>
          )}

          <div className="h-4" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-kirana-green/30 bg-slate-100 relative">
             <SecureCanvas image={captured} width={480} height={640} tagline="" />
          </div>
          <div className="bg-kirana-green/10 text-kirana-green px-4 py-3 rounded-xl font-bold flex justify-center items-center gap-2">
             <CheckCircle size={20} />
             {t('customer.photoTaken')}
          </div>
          <button
             onClick={retake}
             className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-red-300 hover:bg-red-50 w-full"
          >
             <RefreshCcw size={18} /> {language === 'hi' ? 'साफ फोटो नहीं आई? दोबारा लें' : 'Not clear? Retake'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
