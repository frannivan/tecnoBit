import { useEffect, useRef } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { useDJStore } from '../store/useDJStore';

export const useAudioPlayer = () => {
  const currentStation = useRadioStore(state => state.currentStation);
  const isPlaying = useRadioStore(state => state.isPlaying);
  const masterVolume = useRadioStore(state => state.volume);
  const isMuted = useRadioStore(state => state.isMuted);
  const activeDeck = useRadioStore(state => state.activeDeck);
  
  const setStation = useRadioStore(state => state.setStation);
  const setLoading = useRadioStore(state => state.setLoading);
  const pause = useRadioStore(state => state.pause);
  
  const stateRef = useRef({
    currentStation,
    isPlaying,
    masterVolume,
    isMuted,
    activeDeck,
    nextTrackTriggered: false
  });

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



  // FUNCIÓN PARA SILENCIAR TODO LO QUE NO SEA CONSOLA
  const getAudio = (num: 1 | 2) => {
     let el = document.getElementById(`global-audio-player-${num}`) as HTMLAudioElement;
     if (!el) {
        // SI NO EXISTE, LO CREAMOS OCULTO PARA QUE EL HOOK NO ROMPA
        el = document.createElement('audio');
        el.id = `global-audio-player-${num}`;
        el.style.display = 'none';
        document.body.appendChild(el);
     }
     return el;
  };



  useEffect(() => {
    const audio1 = getAudio(1);
    const audio2 = getAudio(2);

    const handleEnded = (e: Event) => {
        const audio = e.target as HTMLAudioElement;
        if (audio.id === `global-audio-player-${stateRef.current.activeDeck}` && !stateRef.current.nextTrackTriggered) {
            const currentSt = stateRef.current.currentStation;
            if (currentSt?.country === 'Playlist') {
                // AUTO-ADVANCE LOGIC
                const nextTrack = useDJStore.getState().getNextPlaylistTrack(currentSt.id);
                if (nextTrack) {
                    setStation({
                        id: nextTrack.id,
                        name: nextTrack.title,
                        streamUrl: nextTrack.audioUrl || '',
                        genre: nextTrack.artist || 'Library',
                        country: 'Playlist'
                    });
                } else {
                    pause();
                }
            }
        }
    };

    [audio1, audio2].forEach(p => {
        p.addEventListener('ended', handleEnded);
    });

    return () => {
        [audio1, audio2].forEach(p => {
            p.removeEventListener('ended', handleEnded);
        });
    };
  }, [setStation, pause]);

  // 2. Play tracks on Radio (Requested behavior)
  useEffect(() => {
    const handleRadioTrack = (e: Event) => {
        const customEvent = e as CustomEvent<{ id: string; title: string; audioUrl: string; artist?: string }>;
        const track = customEvent.detail;
        if (track) {
            setStation({
                id: track.id,
                name: track.title,
                streamUrl: track.audioUrl,
                genre: track.artist || 'Library',
                country: 'Playlist'
            });
        }
    };
    window.addEventListener('radio-play-track', handleRadioTrack);
    return () => window.removeEventListener('radio-play-track', handleRadioTrack);
  }, [setStation]);

  // 3. Real-time Volume & Mute Synchronization (Desktop & Android)
  useEffect(() => {
    const audio1 = getAudio(1);
    const audio2 = getAudio(2);
    const target = isMuted ? 0 : masterVolume;
    [audio1, audio2].forEach(a => {
      try {
        a.volume = target;
      } catch {
        // Platform or browser restricted
      }
      try {
        a.muted = isMuted;
      } catch {
        // Platform or browser restricted
      }
    });
  }, [masterVolume, isMuted]);

  // Reactively track mixer state
  const isPlayingA = useDJStore(state => state.isPlayingA);
  const isPlayingB = useDJStore(state => state.isPlayingB);

  // 4. Playback and Station Management
  useEffect(() => {
    const audio1 = getAudio(1);
    const audio2 = getAudio(2);
    const mixerActive = isPlayingA || isPlayingB;

    // Handle Active Deck
    const mainAudio = activeDeck === 1 ? audio1 : audio2;
    const secondAudio = activeDeck === 1 ? audio2 : audio1;

    if (isPlaying && !mixerActive) {
        if (mainAudio.src !== currentStation?.streamUrl) {
            mainAudio.src = currentStation?.streamUrl || '';
            mainAudio.load();
        }
        try {
            mainAudio.volume = isMuted ? 0 : masterVolume;
        } catch {
            // Platform or browser restricted
        }
        mainAudio.play().then(() => setLoading(false)).catch(() => setLoading(false));

        // Ensure secondary is stopped
        secondAudio.pause();
    } else {
        setLoading(false);
        audio1.pause();
        audio2.pause();
    }
  // Volume and mute are reactively handled in effect #3 to avoid re-triggering playback/reload
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStation, isPlaying, activeDeck, isPlayingA, isPlayingB]);

  return null;
};
