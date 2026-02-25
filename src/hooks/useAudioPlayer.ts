import { useEffect, useRef } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { useDJStore } from '../store/useDJStore';

export const useAudioPlayer = () => {
  const { 
    currentStation, 
    isPlaying, 
    volume, 
    isMuted,
    setLoading,
    setError,
    pause,
    play
  } = useRadioStore();
  
  const wakeLock = useRef<any>(null);

  // --- WAKE LOCK LOGIC ---
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying) {
        try {
          wakeLock.current = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock is active');
        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    const releaseWakeLock = () => {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
        console.log('Wake Lock released');
      }
    };

    if (isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    // Handle re-acquisition when tab becomes visible again
    const handleVisibilityChange = () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  // --- MEDIA SESSION LOGIC ---
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentStation) return;

    // Update metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentStation.name,
      artist: currentStation.genre || 'TecnoBit Radio',
      album: 'TecnoBit Player',
      artwork: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ]
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Action handlers
    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    
    // Add skip handlers if playing from playlist
    if (currentStation.country === 'Playlist') {
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        // Implementation for previous track could be added here if needed
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        const audio = document.getElementById('global-audio-player') as HTMLAudioElement;
        if (audio) {
          audio.dispatchEvent(new Event('ended')); // Trigger the "ended" logic to skip
        }
      });
    } else {
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [currentStation, isPlaying, play, pause]);
  
  
  useEffect(() => {
    const audio = document.getElementById('global-audio-player') as HTMLAudioElement;
    if (!audio) return;

    const updateLoading = () => setLoading(false);
    const handleWaiting = () => setLoading(true);
    
    // Play when ready if state says we should be playing
    const handleCanPlay = () => {
        setLoading(false);
        setError(null); // Clear errors on success
        // Check strict equality to ensure we don't play if user paused during load
        if (useRadioStore.getState().isPlaying) {
             audio.play().catch(e => console.error("Auto-resume failed:", e));
        }
    };

    const handleError = (e: Event) => {
      console.error("Stream Error:", e);
      setLoading(false);
      
      // Only report 'Signal Lost' but DO NOT STOP.
      // Most streams allow reconnecting.
      if (audio.error && audio.error.code !== 1) {
           setError("SIGNAL LOST - RETRYING...");
           // We do NOT pause here. We let the auto-reconnect logic handle it or user intervention.
      }
    };
    
    const handleEnded = () => {
        const currentState = useRadioStore.getState();
        
        // Check if we're playing a playlist track (by country field)
        if (currentState.currentStation?.country === 'Playlist') {
            console.log("Playlist track ended, attempting to play next...");
            
            const nextTrack = useDJStore.getState().playNextTrack();
            
            if (nextTrack && nextTrack.audioUrl) {
                // Play next track in playlist
                useRadioStore.getState().setStation({
                    id: nextTrack.id,
                    name: nextTrack.title,
                    streamUrl: nextTrack.audioUrl,
                    genre: nextTrack.artist,
                    country: 'Playlist'
                });
            } else {
                console.log("End of playlist reached");
                pause();
            }
        } else {
            // Auto-restart if it just ended (streams sometimes drop)
            if (currentState.isPlaying) {
                console.log("Stream ended, attempting reconnect...");
                audio.load();
                audio.play().catch(() => pause());
            } else {
                pause();
            }
        }
    };

    // Attach listeners
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', updateLoading);
    audio.addEventListener('canplay', handleCanPlay); // This will trigger play()
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', updateLoading);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle Playback & Source
  useEffect(() => {
    const audio = document.getElementById('global-audio-player') as HTMLAudioElement;
    if (!audio || !currentStation) return;

    // 1. Handle Source Change
    if (audio.src !== currentStation.streamUrl || audio.error) {
        setLoading(true);
        setError(null);
        
        // Pause and reset before loading new source
        audio.pause();
        audio.src = currentStation.streamUrl;
        audio.load();
        // We DO NOT call play() here. We wait for 'canplay' event.
        return; 
    }

    // 2. Handle Play/Pause Toggle (Same Source)
    if (isPlaying) {
        if (audio.paused) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error("Playback failed:", e);
                });
            }
        }
    } else {
        if (!audio.paused) {
            audio.pause();
        }
    }
  }, [currentStation, isPlaying]);

  // Sync Volume & Mute
  useEffect(() => {
    const audio = document.getElementById('global-audio-player') as HTMLAudioElement;
    if (audio) {
        audio.volume = volume;
        audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  return null; // This hook doesn't render anything
};
