import { useEffect, useRef } from 'react';
import { useRadioStore } from '../store/useRadioStore';
import { useDJStore } from '../store/useDJStore';

export const useAudioPlayer = () => {
  const currentStation = useRadioStore(state => state.currentStation);
  const isPlaying = useRadioStore(state => state.isPlaying);
  const masterVolume = useRadioStore(state => state.volume);
  const isMuted = useRadioStore(state => state.isMuted);
  const activeDeck = useRadioStore(state => state.activeDeck);
  
  const isPlayingA = useDJStore(state => state.isPlayingA);
  const isPlayingB = useDJStore(state => state.isPlayingB);
  
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
        audio.volume = masterVolume;
        audio.play().then(() => {
            setLoading(false);
        }).catch(() => {
            setLoading(false);
        });
    } else if (isPlayingA || isPlayingB) {
        // MIXER IS ACTIVE: Keep the audio session alive with a SILENT LOOP
        // DO NOT PAUSE! Use the radio player as a "carrier" for the session.
        if (audio.src !== "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/") {
            audio.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";
            audio.load();
        }
        audio.volume = 0; // Completely silent
        audio.loop = true;
        audio.play().catch(() => {});
        setLoading(false);
    } else {
        setLoading(false);
        audio.pause();
        audio.volume = 0;
    }

    audio.muted = isMuted;
  }, [currentStation, isPlaying, isPlayingA, isPlayingB, activeDeck, masterVolume, isMuted]);

  return null;
};
