import { useCallback } from 'react';

/**
 * A hook to play synthesized notification sounds using Web Audio API.
 * This avoids the need for external assets and ensures instant playback.
 */
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return sharedAudioCtx;
}

export function useSound() {
  const playNotification = useCallback(() => {
    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      const playTone = (freq: number, start: number, duration: number, volume: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = audioCtx.currentTime;
      playTone(880, now, 0.5, 0.1); 
      playTone(1108.73, now + 0.1, 0.4, 0.08); 
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, []);

  const playSuccess = useCallback(() => {
    try {
      const audioCtx = getAudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(523.25, now, 0.3); 
      playTone(659.25, now + 0.1, 0.3); 
      playTone(783.99, now + 0.2, 0.5); 
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, []);

  return { playNotification, playSuccess };
}

export default useSound;
