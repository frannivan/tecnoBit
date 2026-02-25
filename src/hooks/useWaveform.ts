import { useState, useEffect, useRef } from 'react';

interface UseWaveformReturn {
  currentTime: number;
  duration: number;
  frequencies: Uint8Array;
  seek: (time: number) => void;
}

export const useWaveform = (audioElement: HTMLAudioElement | null): UseWaveformReturn => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frequencies, setFrequencies] = useState(new Uint8Array(64));
  
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!audioElement) return;

    // Create Web Audio API context and connect to audio element
    const setupAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaElementSource(audioElement);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128; // 64 frequency bins
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
      }
    };

    // Time update listener
    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    // Animation loop for frequency data
    const updateFrequencies = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setFrequencies(dataArray);
      }
      animationFrameRef.current = requestAnimationFrame(updateFrequencies);
    };

    try {
      setupAudioContext();
    } catch (error) {
      console.warn('Web Audio API setup failed:', error);
    }

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    if (audioElement.duration) {
      setDuration(audioElement.duration);
    }

    updateFrequencies();

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioElement]);

  const seek = (time: number) => {
    if (audioElement) {
      audioElement.currentTime = time;
    }
  };

  return { currentTime, duration, frequencies, seek };
};
