import { useEffect, useRef } from 'react';
import { useRadioStore } from '../store/useRadioStore';

export const useAudioPlayer = () => {
  const { 
    currentStation, 
    isPlaying, 
    volume, 
    isMuted,
    setLoading,
    setError,
    pause
  } = useRadioStore();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none'; // Don't preload until requested
    }
    
    const audio = audioRef.current;

    const handleWaiting = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handlePlaying = () => {
        setLoading(false);
        setError(null);
    };
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setLoading(false);
      setError("STREAM ERROR");
      pause();
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
    };
  }, [setLoading, pause]);

  // Handle Station Change
  useEffect(() => {
    if (!audioRef.current || !currentStation) return;

    const audio = audioRef.current;
    
    // Only update src if it's different and we want to play
    if (audio.src !== currentStation.streamUrl) {
        audio.src = currentStation.streamUrl;
        audio.load();
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Auto-play was prevented:", error);
          pause();
        });
      }
    } else {
      audio.pause();
    }

  }, [currentStation, isPlaying]);

  // Handle Volume Change
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  return null; // This hook doesn't render anything
};
