import { useEffect, useRef } from 'react';
import { useRadioStore } from '../store/useRadioStore';

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

  // 2. Play tracks on Radio (Requested behavior)
  useEffect(() => {
    const handleRadioTrack = (e: any) => {
        const track = e.detail;
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
    window.addEventListener('radio-play-track', (handleRadioTrack as any));
    return () => window.removeEventListener('radio-play-track', (handleRadioTrack as any));
  }, [setStation]);

  // Sync state between store and physical player 
  useEffect(() => {
    const audio = getAudio(activeDeck);
    if (!audio || !currentStation) return;

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
    } else {
        setLoading(false);
        // SECURE SILENT PULSE (1-second 100% silent WAV)
        const SILENCE = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";
        if (audio.src !== SILENCE) {
            audio.src = SILENCE;
            audio.loop = true;
        }
        audio.volume = 1.0; // High volume of pure silence data
        audio.play().catch(() => {});
    }

    audio.muted = isMuted;
  }, [currentStation, isPlaying, activeDeck, masterVolume, isMuted]);

  return null;
};
