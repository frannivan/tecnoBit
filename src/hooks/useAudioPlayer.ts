import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { useDJStore } from '../store/useDJStore';
import { getTrackBlob } from '../utils/indexedDB';

export const useAudioPlayer = () => {
  // Selectors (Selective subscriptions to avoid mass re-renders)
  const currentStation = useRadioStore(state => state.currentStation);
  const isPlaying = useRadioStore(state => state.isPlaying);
  const masterVolume = useRadioStore(state => state.volume);
  const isMuted = useRadioStore(state => state.isMuted);
  const activeDeck = useRadioStore(state => state.activeDeck);
  
  // Actions (Atomic - these should not trigger re-renders unless changed)
  const setStation = useRadioStore(state => state.setStation);
  const setActiveDeck = useRadioStore(state => state.setActiveDeck);
  const setLoading = useRadioStore(state => state.setLoading);
  const setError = useRadioStore(state => state.setError);
  const pause = useRadioStore(state => state.pause);
  
  // Stable refs for event listeners
  const stateRef = useRef({
    currentStation,
    isPlaying,
    masterVolume,
    isMuted,
    activeDeck,
    nextTrackTriggered: false
  });

  // Sync refs on state change
  useEffect(() => {
    stateRef.current = {
        ...stateRef.current,
        currentStation,
        isPlaying,
        masterVolume,
        isMuted,
        activeDeck
    };
  }, [currentStation, isPlaying, masterVolume, isMuted, activeDeck]);

  const wakeLock = useRef<any>(null);
  const fadeInterval = useRef<number | null>(null);

  const getAudio = (num: 1 | 2) => document.getElementById(`global-audio-player-${num}`) as HTMLAudioElement;

  // --- CROSSFADE LOGIC ---
  const triggerCrossfade = useCallback(() => {
    if (stateRef.current.nextTrackTriggered) return;
    
    const currentSt = stateRef.current.currentStation;
    if (currentSt?.country !== 'Playlist') return;

    // Peek/Get next track
    const djStore = useDJStore.getState();
    const nextTrack = djStore.playNextTrack();
    if (!nextTrack || !nextTrack.audioUrl) {
        console.log("Crossfade: No next track in playlist");
        return; 
    }

    console.log("Crossfade: Initializing transition to", nextTrack.title);
    stateRef.current.nextTrackTriggered = true;

    const currentDeck = stateRef.current.activeDeck;
    const nextPlayerNum = currentDeck === 1 ? 2 : 1;
    const nextPlayer = getAudio(nextPlayerNum);
    const currentPlayer = getAudio(currentDeck);

    if (nextPlayer && currentPlayer) {
        if (fadeInterval.current) clearInterval(fadeInterval.current);

        const initFade = async () => {
            let finalUrl = nextTrack.audioUrl;
            try {
                const blob = await getTrackBlob(nextTrack.id);
                if (blob) {
                    finalUrl = URL.createObjectURL(blob);
                    console.log("Crossfade: loaded from local cache");
                }
            } catch (e) {
                console.warn("Crossfade: failed to read blob", e);
            }

            nextPlayer.setAttribute('crossorigin', 'anonymous');
            nextPlayer.src = finalUrl || '';
            nextPlayer.volume = 0;
            nextPlayer.load();

            nextPlayer.play().then(() => {
                console.log("Crossfade: Next track playing, starting fade...");
                setActiveDeck(nextPlayerNum as 1 | 2);

                setStation({
                    id: nextTrack.id,
                    name: nextTrack.title,
                    streamUrl: nextTrack.audioUrl || '',
                    genre: nextTrack.artist,
                    country: 'Playlist',
                    playlistItemId: nextTrack.playlistItemId
                });

                // Fade volumes over 3 seconds
                let step = 0;
                const totalSteps = 60; // 3 seconds at 20fps
                const initialVol = stateRef.current.masterVolume;

                fadeInterval.current = window.setInterval(() => {
                    step++;
                    const progress = step / totalSteps;

                    currentPlayer.volume = Math.max(0, initialVol * (1 - progress));
                    nextPlayer.volume = Math.min(initialVol, initialVol * progress);

                    if (step >= totalSteps) {
                        if (fadeInterval.current) clearInterval(fadeInterval.current);
                        currentPlayer.pause();
                        currentPlayer.src = "";
                        stateRef.current.nextTrackTriggered = false;
                        console.log("Crossfade: Transition complete");
                    }
                }, 50);
            }).catch((err) => {
                console.warn("Crossfade: Next track failed to play:", err);
                stateRef.current.nextTrackTriggered = false;
            });
        };
        initFade();
    }
  }, [setActiveDeck, setStation]);

  // --- STABLE EVENT LISTENERS ---
  useEffect(() => {
    const audio1 = getAudio(1);
    const audio2 = getAudio(2);
    if (!audio1 || !audio2) return;

    const handleTimeUpdate = (e: Event) => {
        const audio = e.target as HTMLAudioElement;
        const currentActive = stateRef.current.activeDeck;
        if (audio.id === `global-audio-player-${currentActive}`) {
            if (!isFinite(audio.duration)) return;
            
            const remaining = audio.duration - audio.currentTime;
            if (remaining > 0 && remaining <= 3.2 && !stateRef.current.nextTrackTriggered) {
                triggerCrossfade();
            }
        }
    };

    const handleEnded = (e: Event) => {
        const audio = e.target as HTMLAudioElement;
        const currentActive = stateRef.current.activeDeck;
        
        if (audio.id === `global-audio-player-${currentActive}` && !stateRef.current.nextTrackTriggered) {
            const currentSt = stateRef.current.currentStation;
            if (currentSt?.country === 'Playlist') {
                const nextTrack = useDJStore.getState().playNextTrack();
                if (nextTrack && nextTrack.audioUrl) {
                    setStation({
                        id: nextTrack.id,
                        name: nextTrack.title,
                        streamUrl: nextTrack.audioUrl,
                        genre: nextTrack.artist,
                        country: 'Playlist',
                        playlistItemId: nextTrack.playlistItemId
                    });
                } else {
                    pause();
                }
            } else if (stateRef.current.isPlaying) {
                audio.load();
                audio.play().catch(() => pause());
            }
        }
    };

    const handleWaiting = () => setLoading(true);
    const handlePlaying = () => setLoading(false);
    const handleError = (e: any) => {
        const audio = e.target as HTMLAudioElement;
        if (audio.id === `global-audio-player-${stateRef.current.activeDeck}`) {
            setError("SIGNAL LOST - RETRYING...");
            setLoading(false);
        }
    };

    const players = [audio1, audio2];
    players.forEach(p => {
        p.addEventListener('timeupdate', handleTimeUpdate);
        p.addEventListener('ended', handleEnded);
        p.addEventListener('waiting', handleWaiting);
        p.addEventListener('playing', handlePlaying);
        p.addEventListener('error', handleError);
    });

    return () => {
        players.forEach(p => {
            p.removeEventListener('timeupdate', handleTimeUpdate);
            p.removeEventListener('ended', handleEnded);
            p.removeEventListener('waiting', handleWaiting);
            p.removeEventListener('playing', handlePlaying);
            p.removeEventListener('error', handleError);
        });
    };
  }, [triggerCrossfade, setStation, pause, setLoading, setError]);

  // Sync state between store and physical player
  useEffect(() => {
    const audio = getAudio(activeDeck);
    if (!audio || !currentStation) return;

    // Handle manual station changes
    if (!stateRef.current.nextTrackTriggered) {
        // We'll use a local check to ensure we only load once per station change
        // We can check if audio is already playing the same station id basically, but `audio.src` could be slightly different if it's a blob URL.
        if (audio.dataset.stationId !== currentStation.id) {
            setLoading(true);
            audio.dataset.stationId = currentStation.id;

            const loadAudioSrc = async () => {
                let finalUrl = currentStation.streamUrl;
                if (['Playlist', 'Local', 'Shared'].includes(currentStation.country)) {
                    try {
                        const blob = await getTrackBlob(currentStation.id);
                        if (blob) {
                            finalUrl = URL.createObjectURL(blob);
                            console.log("Playing from local cache:", currentStation.name);
                        }
                    } catch (e) {
                        console.warn("Failed to read from cache:", e);
                    }
                }
                
                if (currentStation.noCors) {
                    audio.removeAttribute('crossorigin');
                } else {
                    audio.setAttribute('crossorigin', 'anonymous');
                }
                audio.src = finalUrl;
                audio.load();
                
                if (isPlaying) {
                    audio.play().catch(e => console.warn("Playback blocked by browser:", e));
                }
            };
            loadAudioSrc();
        }
    }

    // Play/Pause sync
    if (isPlaying) {
        if (audio.paused) {
            audio.play().catch(e => console.warn("Playback blocked by browser:", e));
        }
    } else {
        if (!audio.paused) audio.pause();
    }
  }, [currentStation, isPlaying, activeDeck, setLoading]);

  // Volume & Mute Sync
  useEffect(() => {
    const audio = getAudio(activeDeck);
    if (audio && !stateRef.current.nextTrackTriggered) {
        audio.volume = masterVolume;
        audio.muted = isMuted;
    }
  }, [masterVolume, isMuted, activeDeck]);

  // --- AUTOMATED HISTORY WATCHER ---
  useEffect(() => {
    if (!currentStation || !isPlaying) return;

    const isDJTrack = ['Playlist', 'Shared', 'Local'].includes(currentStation.country);
    if (!isDJTrack) return;

    const djStore = useDJStore.getState();
    const allOfflineTracks = djStore.offlineSets.flatMap(set => set.tracks);
    const allTracks = [...djStore.playlist, ...djStore.sharedCrate, ...allOfflineTracks];
    
    let trackToLog = allTracks.find(t => t.id === currentStation.id);

    if (!trackToLog) {
      trackToLog = {
        id: currentStation.id,
        title: currentStation.name,
        artist: currentStation.genre || 'Unknown',
        timestamp: Date.now(),
        audioUrl: currentStation.streamUrl,
        isShared: currentStation.country === 'Shared'
      };
    }

    djStore.addToHistory(trackToLog);
  }, [currentStation?.id, isPlaying]);

  // Wake Lock Logic
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && isPlaying) {
        try {
          wakeLock.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    const releaseWakeLock = () => {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
    };

    if (isPlaying) requestWakeLock();
    else releaseWakeLock();

    return () => releaseWakeLock();
  }, [isPlaying]);

  return null;
};
