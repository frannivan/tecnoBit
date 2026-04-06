import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useRadioStore } from '../store/useRadioStore';
import { useDJStore } from '../store/useDJStore';

// High-precision timing
Tone.context.lookAhead = 0.05;

export interface DJAudioController {
  isPlaying: boolean;
  isBufferLoaded: boolean;
  getLevel: () => number;
  togglePlay: () => void;
  handleCue: () => void;
  stopCue: () => void;
  applyVolume: (val: number) => void;
  applyEQ: (band: 'low' | 'mid' | 'high', val: number) => void;
  applyPitch: (val: number) => void;
  nudge: (delta: number) => void;
  syncPhase: (masterTime: number, masterBPM: number, masterBeatOffset: number, myBaseBPM: number) => void;
  beatOffset: number;
  cueCount: number;
  getTimeInfo: () => { current: number; duration: number };
  audioData: { rms: Float32Array; duration: number } | null;
  startScrub: (dir: number) => void;
  scrubTo: (delta: number) => void;
  stopScrub: () => void;
}

export const useDJAudio = (url: string, trackId: string | null = null, name: 'A' | 'B'): DJAudioController => {
  const playerRef = useRef<Tone.Player | null>(null);
  const eqRef = useRef<Tone.EQ3 | null>(null);
  const meterRef = useRef<Tone.Meter | null>(null);
  const channelRef = useRef<Tone.Channel | null>(null);
  
  const isPlaying = useDJStore(state => name === 'A' ? state.isPlayingA : state.isPlayingB);
  const setIsPlaying = (playing: boolean) => {
      if (name === 'A') useDJStore.getState().setIsPlayingA(playing);
      else useDJStore.getState().setIsPlayingB(playing);
  };
  
  const [isBufferLoaded, setIsBufferLoaded] = useState(false);
  const [cueCount, setCueCount] = useState(0);
  const [audioData, setAudioData] = useState<{ rms: Float32Array, duration: number } | null>(null);

  const isScrubbingRef = useRef(false);
  const scrubPositionRef = useRef(0);
  const internalRestartCountRef = useRef(0);
  const lastScrubUpdateTimeRef = useRef(0);
  const scrubLoopRef = useRef<number | null>(null);

  const durationRef = useRef<number>(0);
  const accumulatedPositionRef = useRef<number>(0);
  const lastSyncTimeRef = useRef<number>(0);
  const currentPitchRef = useRef<number>(1.0);
  const beatOffsetRef = useRef<number>(0); 

  const handleBufferLoaded = useCallback((player: Tone.Player) => {
    if (Tone.context.state !== 'running') Tone.start();
    durationRef.current = player.buffer.duration;
    
    // SCAN FOR BEAT OFFSET (TRANSIENT DETECTION)
    const sampleRate = player.buffer.sampleRate;
    const buffer = player.buffer.getChannelData(0); 
    const scanWindow = Math.min(buffer.length, sampleRate * 4); // Scan first 4 seconds
    let maxVal = 0;
    let maxIdx = 0;
    // Look for the first strong peak, not just the absolute max
    const threshold = 0.5; 
    for (let i = 0; i < scanWindow; i++) {
        const absVal = Math.abs(buffer[i]);
        if (absVal > threshold) { 
            maxIdx = i; 
            break; 
        }
        if (absVal > maxVal) { maxVal = absVal; maxIdx = i; }
    }
    beatOffsetRef.current = Math.max(0, (maxIdx / sampleRate) - 0.005); // Tighter offset

    // === [EXPERIMENTAL SINGLE-LOAD OPTIMIZATION] ===
    const dur = player.buffer.duration;
    const targetPoints = 500; // Standard 500 points for mobile waves
    const blockSize = Math.floor(buffer.length / targetPoints);
    const rmsArray = new Float32Array(targetPoints);
    for (let i = 0; i < targetPoints; i++) {
        let sumSq = 0;
        for (let j = 0; j < blockSize; j++) {
            const val = buffer[i * blockSize + j];
            sumSq += val * val;
        }
        rmsArray[i] = Math.sqrt(sumSq / blockSize);
    }
    
    const visualData = { rms: Array.from(rmsArray), duration: dur };
    setAudioData({ rms: rmsArray, duration: dur });
    
    // SHARED STORE FOR PERSISTENCE
    if (trackId) {
        useDJStore.getState().setAudioData(trackId, { rms: visualData.rms, duration: dur });
    }
    // ===============================================

    setIsBufferLoaded(true);
  }, [trackId]);

  useEffect(() => {
    const player = new Tone.Player({
      loop: false,
      onload: () => handleBufferLoaded(player),
      onstop: () => {
          if (internalRestartCountRef.current > 0) {
              internalRestartCountRef.current--;
          } else {
              setIsPlaying(false);
          }
      }
    });
    const eq = new Tone.EQ3(0, 0, 0);
    const meter = new Tone.Meter();
    const channel = new Tone.Channel(0, 0);

    player.chain(eq, channel, Tone.Destination);
    channel.connect(meter);

    playerRef.current = player;
    eqRef.current = eq;
    meterRef.current = meter;
    channelRef.current = channel;

    return () => {
      // Disconnect before disposing
      player.disconnect();
      eq.disconnect();
      channel.disconnect();
      meter.disconnect();
      
      player.dispose();
      eq.dispose();
      meter.dispose();
      channel.dispose();
      if (scrubLoopRef.current) cancelAnimationFrame(scrubLoopRef.current);
    };
  }, [handleBufferLoaded]);

  useEffect(() => {
    if (!playerRef.current || !url) return;
    setIsPlaying(false);
    setIsBufferLoaded(false);
    setAudioData(null);
    accumulatedPositionRef.current = 0;
    lastSyncTimeRef.current = 0;
    if (playerRef.current.state === 'started') {
        internalRestartCountRef.current = 0; // Real stop
        playerRef.current.stop();
    }

    playerRef.current.load(url).then(() => {
        if (playerRef.current) handleBufferLoaded(playerRef.current);
    }).catch(() => console.error("Tone load error"));
  }, [url, handleBufferLoaded]);

  // ===============================================
  // EXTERNAL PAUSE ENFORCER (Radio Mutual Exclusion)
  // If the global store sets isPlaying to false, we MUST stop the engine.
  // ===============================================
  useEffect(() => {
      if (!isPlaying && playerRef.current && playerRef.current.state === "started") {
          const now = Tone.now();
          internalRestartCountRef.current = 0;
          playerRef.current.stop(now);
      }
  }, [isPlaying]);

  const togglePlay = useCallback(async () => {
    if (!playerRef.current || !isBufferLoaded) return;

    // SYNC RESUME (User Gesture)
    Tone.start();
    Tone.context.resume();
    
    // AWAIT to be sure (optional but helpful)
    await Tone.context.resume();
    
    const now = Tone.now();
    if (isPlaying) {
      accumulatedPositionRef.current += (now - lastSyncTimeRef.current) * currentPitchRef.current;
      internalRestartCountRef.current = 0; // Real intentional stop
      playerRef.current.stop(now);
      setIsPlaying(false);
    } else {
      // PAUSE RADIO WHEN MIXER STARTS
      useRadioStore.getState().pause();

      const offset = accumulatedPositionRef.current % (durationRef.current || 1);
      playerRef.current.start(Tone.now(), offset); // Use fresh now after await
      lastSyncTimeRef.current = Tone.now();
      setIsPlaying(true);
    }
  }, [isPlaying, isBufferLoaded, setIsPlaying]);

  const handleCue = useCallback(async () => {
    if (!playerRef.current || !isBufferLoaded) return;

    // SYNC RESUME (User Gesture)
    Tone.start();
    Tone.context.resume();
    await Tone.context.resume();

    // PAUSE RADIO WHEN MIXER STARTS
    useRadioStore.getState().pause();

    const now = Tone.now();
    playerRef.current.start(now, beatOffsetRef.current);
    lastSyncTimeRef.current = now;
    setIsPlaying(true);
    setCueCount((c: number) => c + 1);
  }, [isBufferLoaded, setIsPlaying]);

  const stopCue = useCallback(() => {
    if (!playerRef.current || !isBufferLoaded) return;
    const now = Tone.now();
    internalRestartCountRef.current = 0; // Back to cue
    playerRef.current.stop(now);
    accumulatedPositionRef.current = beatOffsetRef.current;
    setIsPlaying(false);
  }, [isBufferLoaded, setIsPlaying]);

  const applyVolume = useCallback((val: number) => {
    if (channelRef.current) channelRef.current.volume.value = Tone.gainToDb(val / 100);
  }, []);

  const applyEQ = useCallback((band: 'low' | 'mid' | 'high', val: number) => {
    if (eqRef.current) eqRef.current[band].value = val;
  }, []);

  const applyPitch = useCallback((val: number) => {
    if (!playerRef.current) return;
    if (isPlaying) {
        const now = Tone.now();
        accumulatedPositionRef.current += (now - lastSyncTimeRef.current) * currentPitchRef.current;
        lastSyncTimeRef.current = now;
    }
    currentPitchRef.current = val;
    playerRef.current.playbackRate = val;
  }, [isPlaying]);

  const nudge = useCallback((delta: number) => {
    if (!playerRef.current || !isBufferLoaded || !isPlaying) return;
    const now = Tone.now();
    const myCurrentTime = (accumulatedPositionRef.current + (now - lastSyncTimeRef.current) * currentPitchRef.current) % (durationRef.current || 1);
    accumulatedPositionRef.current += delta;
    const newOffset = (myCurrentTime + delta) % (durationRef.current || 1);
    internalRestartCountRef.current++;
    playerRef.current.stop(now);
    playerRef.current.start(now, Math.max(0, newOffset));
    lastSyncTimeRef.current = now;
  }, [isPlaying, isBufferLoaded]);

  const syncPhase = useCallback((masterTime: number, masterBPM: number, masterBeatOffset: number, myBaseBPM: number) => {
    if (!playerRef.current || !isBufferLoaded || !isPlaying) return;
    const now = Tone.now();
    
    // Calculate precise master beat phase
    const masterElapsed = Math.max(0, masterTime - masterBeatOffset);
    const masterBeatPhase = (masterElapsed * masterBPM / 60) % 1;
    
    const myCurrentBPM = myBaseBPM * currentPitchRef.current;
    const myTime = (accumulatedPositionRef.current + (now - lastSyncTimeRef.current) * currentPitchRef.current) % (durationRef.current || 1);
    const myElapsed = Math.max(0, myTime - beatOffsetRef.current);
    const myBeatPhase = (myElapsed * myCurrentBPM / 60) % 1;
    
    let diff = masterBeatPhase - myBeatPhase;
    if (diff > 0.5) diff -= 1;
    if (diff < -0.5) diff += 1;
    
    // Conversion of phase difference to seconds
    const correctionSecs = (diff * 60) / myCurrentBPM;
    
    // Hard sync: apply correction and restart player for perfect alignment
    if (Math.abs(correctionSecs) > 0.002) { // Only sync if > 2ms difference
        const newOffset = (myTime + correctionSecs) % (durationRef.current || 1);
        internalRestartCountRef.current++;
        playerRef.current.stop(now);
        playerRef.current.start(now, Math.max(0, newOffset));
        accumulatedPositionRef.current = newOffset;
        lastSyncTimeRef.current = now;
    }
  }, [isPlaying, isBufferLoaded]);

  const startScrub = useCallback((dir: number) => {
    isScrubbingRef.current = true;
    const now = Tone.now();
    scrubPositionRef.current = (accumulatedPositionRef.current + (isPlaying ? (now - lastSyncTimeRef.current) * currentPitchRef.current : 0)) % (durationRef.current || 1);
    
    let lastTime = performance.now();
    lastScrubUpdateTimeRef.current = lastTime;
    const startTimeStamp = lastTime;

    const tick = () => {
        if (!isScrubbingRef.current) return;
        const nowPerf = performance.now();
        const dt = Math.min(50, nowPerf - lastTime); // Limit dt
        lastTime = nowPerf;
        
        // Calculamos cuánto lleva apretado
        const heldDurationMs = nowPerf - startTimeStamp;
        
        // Velocidad inicial algo más rápida para que reaccione mejor al primer toque (5x la velocidad real)
        let speedMultiplier = 0.002; 
        
        // Después de mantenerlo apretado 2 segundos (2000ms), empieza a acelerar progresivamente
        if (heldDurationMs > 2000) {
           // Aumenta progresivamente durante los siguientes 3 segundos
           const extraTime = Math.min(3000, heldDurationMs - 2000);
           const bonusMultiplier = (extraTime / 3000) * 0.03; // Aumenta hasta sumar un +0.03 (30x velocidad máxima)
           speedMultiplier += bonusMultiplier; 
        }

        scrubPositionRef.current = Math.max(0, Math.min(durationRef.current, scrubPositionRef.current + dir * dt * speedMultiplier));
        
        // Update audio position throttled to ~40ms if playing
        if (isPlaying && playerRef.current && isBufferLoaded && (nowPerf - lastScrubUpdateTimeRef.current > 40)) {
            const toneNow = Tone.now();
            internalRestartCountRef.current++;
            playerRef.current.stop(toneNow);
            playerRef.current.start(toneNow, scrubPositionRef.current % (durationRef.current || 1));
            lastSyncTimeRef.current = toneNow;
            accumulatedPositionRef.current = scrubPositionRef.current;
            lastScrubUpdateTimeRef.current = nowPerf;
        }
        scrubLoopRef.current = requestAnimationFrame(tick);
    };
    
    if (scrubLoopRef.current) cancelAnimationFrame(scrubLoopRef.current);
    scrubLoopRef.current = requestAnimationFrame(tick);
  }, [isPlaying, isBufferLoaded]);

  const scrubTo = useCallback((delta: number) => {
      // Legacy func unused when startScrub handles loop
      scrubPositionRef.current = Math.max(0, Math.min(durationRef.current, scrubPositionRef.current + delta));
  }, []);

  const stopScrub = useCallback(() => {
    if (!isScrubbingRef.current) return; // Ignora eventos falsos si no estábamos buscando activamente
    
    isScrubbingRef.current = false;
    if (scrubLoopRef.current) cancelAnimationFrame(scrubLoopRef.current);
    accumulatedPositionRef.current = scrubPositionRef.current;
    
    if (isPlaying && playerRef.current && isBufferLoaded) {
       const now = Tone.now();
       internalRestartCountRef.current++;
       playerRef.current.stop(now);
       playerRef.current.start(now, scrubPositionRef.current % (durationRef.current || 1));
       lastSyncTimeRef.current = now;
    }
  }, [isPlaying, isBufferLoaded]);

  const getLevel = useCallback(() => {
    if (!meterRef.current) return -100;
    return meterRef.current.getValue() as number;
  }, []);

  const getTimeInfo = useCallback(() => {
    if (!playerRef.current || !isBufferLoaded) return { current: 0, duration: 0 };
    if (isScrubbingRef.current) return { current: scrubPositionRef.current, duration: durationRef.current };
    const now = Tone.now();
    const elapsed = isPlaying ? (now - lastSyncTimeRef.current) * currentPitchRef.current : 0;
    const current = (accumulatedPositionRef.current + elapsed) % (durationRef.current || 1);
    return { current, duration: durationRef.current };
  }, [isPlaying, isBufferLoaded]);

  return {
    isPlaying,
    isBufferLoaded,
    getLevel,
    togglePlay,
    handleCue,
    stopCue,
    applyVolume,
    applyEQ,
    applyPitch,
    nudge,
    syncPhase,
    beatOffset: beatOffsetRef.current,
    cueCount,
    getTimeInfo,
    audioData,
    startScrub,
    scrubTo,
    stopScrub
  };
};
