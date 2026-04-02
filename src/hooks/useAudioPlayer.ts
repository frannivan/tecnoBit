import { useEffect, useRef, useCallback } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { useDJStore } from '../store/useDJStore';
import { getTrackBlob } from '../utils/indexedDB';

export const useAudioPlayer = () => {
  const currentStation = useRadioStore(state => state.currentStation);
  const isPlaying = useRadioStore(state => state.isPlaying);
  const masterVolume = useRadioStore(state => state.volume);
  const isMuted = useRadioStore(state => state.isMuted);
  const activeDeck = useRadioStore(state => state.activeDeck);
  
  const setStation = useRadioStore(state => state.setStation);
  const setActiveDeck = useRadioStore(state => state.setActiveDeck);
  const setLoading = useRadioStore(state => state.setLoading);
  const setError = useRadioStore(state => state.setError);
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

  const fadeInterval = useRef<number | null>(null);

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

  const triggerCrossfade = useCallback(() => {
    if (stateRef.current.nextTrackTriggered) return;
    const currentSt = stateRef.current.currentStation;
    if (currentSt?.country !== 'Playlist') return;

    const djStore = useDJStore.getState();
    const nextTrack = djStore.playNextTrack();
    if (!nextTrack || !nextTrack.audioUrl) return; 

    stateRef.current.nextTrackTriggered = true;
    const currentDeck = stateRef.current.activeDeck;
    const nextPlayerNum = currentDeck === 1 ? 2 : 1;
    const nextPlayer = getAudio(nextPlayerNum as 1 | 2);
    const currentPlayer = getAudio(currentDeck as 1 | 2);

    if (nextPlayer && currentPlayer) {
        if (fadeInterval.current) clearInterval(fadeInterval.current);
        const initFade = async () => {
            let finalUrl = nextTrack.audioUrl;
            nextPlayer.src = finalUrl || '';
            nextPlayer.volume = 0;
            nextPlayer.load();

            nextPlayer.play().then(() => {
                setActiveDeck(nextPlayerNum as 1 | 2);
                setStation({
                    id: nextTrack.id,
                    name: nextTrack.title,
                    streamUrl: nextTrack.audioUrl || '',
                    genre: nextTrack.artist,
                    country: 'Playlist',
                    playlistItemId: nextTrack.playlistItemId
                });

                let step = 0;
                const totalSteps = 60; 
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
                    }
                }, 50);
            }).catch(() => {
                stateRef.current.nextTrackTriggered = false;
            });
        };
        initFade();
    }
  }, [setActiveDeck, setStation]);

  useEffect(() => {
    const audio1 = getAudio(1);
    const audio2 = getAudio(2);

    const handleEnded = (e: Event) => {
        const audio = e.target as HTMLAudioElement;
        if (audio.id === `global-audio-player-${stateRef.current.activeDeck}` && !stateRef.current.nextTrackTriggered) {
            const currentSt = stateRef.current.currentStation;
            if (currentSt?.country === 'Playlist') {
                pause();
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

  // Sync state between store and physical player - FORCE MUTE IF CONSOLE ACTIVE
  useEffect(() => {
    const audio = getAudio(activeDeck);
    if (!audio || !currentStation) return;

    // SIEMPRE FUERA DE PLAY SI NO ESTAMOS EN MODO RADIO ACTIVO
    if (isPlaying) {
        if (audio.src !== currentStation.streamUrl) {
            audio.src = currentStation.streamUrl;
            audio.load();
        }
        audio.play().catch(() => {});
    } else {
        audio.pause();
        audio.src = ""; // DESTREUIMOS EL AUDIO PARA EVITAR ECOS
    }

    // MUTE AGRESIVO
    audio.volume = 0; 
    audio.muted = true;
  }, [currentStation, isPlaying, activeDeck]);

  return null;
};
