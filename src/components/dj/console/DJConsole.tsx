import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DJDeck, ProfessionalFader } from './DJDeck';
import { DJWaveform } from './DJWaveform';
import { useDJAudio } from '../../../hooks/useDJAudio';
import { type Track, useDJStore } from '../../../store/useDJStore';
import { getTrackBlob } from '../../../utils/indexedDB';
import * as Tone from 'tone';

const VUMeter: React.FC<{ getLevel: () => number, isPlaying: boolean }> = ({ getLevel, isPlaying }) => {
  const [level, setLevel] = useState(-100);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      setLevel(-100);
      return;
    }
    const updateLevel = () => {
      setLevel(getLevel());
      rafRef.current = requestAnimationFrame(updateLevel);
    };
    rafRef.current = requestAnimationFrame(updateLevel);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, getLevel]);

  const normalizedLevel = Math.min(100, Math.pow(10, level / 20) * 110);
  
  return (
    <div className="w-2.5 h-full bg-[#050505] rounded-full flex flex-col-reverse p-[2px] gap-[1.5px] border border-white/5 shadow-[inset_0_0_10px_rgba(0,0,0,1)]">
      {[...Array(13)].map((_, i) => (
         <div key={i} className={`flex-1 w-full rounded-[0.5px] transition-all duration-75 ${
            normalizedLevel > (i * 7.7) 
               ? (i < 8 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : i < 10 ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]') 
               : 'bg-zinc-900/20'
         }`}></div>
      ))}
    </div>
  );
};

const DJConsoleComponent: React.FC = () => {
  const [urlA, setUrlA] = useState("/Audios/Vociferous (Club Mix).mp3");
  const [urlB, setUrlB] = useState("/Audios/Vociferous (Club Mix).mp3");
  const [trackNameA, setTrackNameA] = useState('Deck A');
  const [trackNameB, setTrackNameB] = useState('Deck B');
  const [fullTrackA, setFullTrackA] = useState<Track | undefined>();
  const [fullTrackB, setFullTrackB] = useState<Track | undefined>();
  const [trackIdA, setTrackIdA] = useState<string | undefined>();
  const [trackIdB, setTrackIdB] = useState<string | undefined>();
  
  const [crossfade, setCrossfade] = useState(0.5);
  const [volA, setVolA] = useState(100);
  const [volB, setVolB] = useState(100);
  const [pitchA, setPitchA] = useState(1.0);
  const [pitchB, setPitchB] = useState(1.0);
  const [isPoweredOn, setIsPoweredOn] = useState(false);

  const playlist = useDJStore(state => state.playlist);
  const sharedCrate = useDJStore(state => state.sharedCrate);
  const history = useDJStore(state => state.history);

  const audioA = useDJAudio(urlA, trackIdA, 'A');
  const audioB = useDJAudio(urlB, trackIdB, 'B');

  const handlePowerOn = async () => {
      setIsPoweredOn(!isPoweredOn);
      if (isPoweredOn) {
          Tone.Destination.mute = true;
          return;
      }
      
      try {
          await Tone.start();
          await Tone.context.resume();
          Tone.Destination.mute = false;
          const osc = new Tone.Oscillator(100, "sine").toDestination();
          osc.frequency.rampTo(40, 0.05);
          osc.volume.value = -6;
          osc.start().stop("+0.05");
      } catch (e) {
          console.error("Audio engine failed to start", e);
      }
  };

  // Use refs to store current URLs to avoid dependency loops in callbacks
  const urlARef = useRef(urlA);
  const urlBRef = useRef(urlB);
  useEffect(() => { urlARef.current = urlA; }, [urlA]);
  useEffect(() => { urlBRef.current = urlB; }, [urlB]);

  const handleLoadA = useCallback(async (item: Track) => {
      const cachedBlob = await getTrackBlob(item.id);
      const loadUrl = cachedBlob ? URL.createObjectURL(cachedBlob) : item.audioUrl;
      if (loadUrl) {
          const oldUrl = urlARef.current;
          if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
          
          setUrlA(loadUrl);
          setTrackNameA(item.title);
          setTrackIdA(item.id);
          setFullTrackA(item);
          setPitchA(1.0);
          // V2.6.0: DECODING MOVED ENTIRELY TO useDJAudio TO AVOID LAG
      }
  }, []); 

  const handleLoadB = useCallback(async (item: Track) => {
      const cachedBlob = await getTrackBlob(item.id);
      const loadUrl = cachedBlob ? URL.createObjectURL(cachedBlob) : item.audioUrl;
      if (loadUrl) {
          const oldUrl = urlBRef.current;
          if (oldUrl && oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
          
          setUrlB(loadUrl);
          setTrackNameB(item.title);
          setTrackIdB(item.id);
          setFullTrackB(item);
          setPitchB(1.0);
      }
  }, []);

  useEffect(() => {
    const loadA = (e: any) => handleLoadA(e.detail);
    const loadB = (e: any) => handleLoadB(e.detail);
    window.addEventListener('dj-load-deck-a', loadA);
    window.addEventListener('dj-load-deck-b', loadB);
    return () => {
      window.removeEventListener('dj-load-deck-a', loadA);
      window.removeEventListener('dj-load-deck-b', loadB);
    };
  }, [handleLoadA, handleLoadB]);

  const findTrackBPM = (u: string, n: string) => {
      const all = [...playlist, ...sharedCrate, ...history];
      return all.find(t => t.audioUrl === u || t.title === n)?.bpm || 128;
  };

  const handleSyncA = () => {
    const bpmA = findTrackBPM(urlA, trackNameA);
    const bpmB = findTrackBPM(urlB, trackNameB);
    const targetBPM = bpmB * pitchB;
    const newPitchA = targetBPM / bpmA;
    setPitchA(newPitchA);
    audioA.applyPitch(newPitchA);
    const infoB = audioB.getTimeInfo();
    audioA.syncPhase(infoB.current, targetBPM, audioB.beatOffset, bpmA);
  };

  const handleSyncB = () => {
    const bpmA = findTrackBPM(urlA, trackNameA);
    const bpmB = findTrackBPM(urlB, trackNameB);
    const targetBPM = bpmA * pitchA;
    const newPitchB = targetBPM / bpmB;
    setPitchB(newPitchB);
    audioB.applyPitch(newPitchB);
    const infoA = audioA.getTimeInfo();
    audioB.syncPhase(infoA.current, targetBPM, audioA.beatOffset, bpmB);
  };

  useEffect(() => {
    const handleAutoLoad = async (e: any) => {
        const track = e.detail;
        if (!isPoweredOn) {
            await handlePowerOn();
            await new Promise(r => setTimeout(r, 300));
        }

        if (!audioA.isPlaying) {
             await handleLoadA(track);
             setTimeout(() => audioA.togglePlay(), 500);
        } else if (!audioB.isPlaying) {
             await handleLoadB(track);
             setTimeout(() => audioB.togglePlay(), 500);
        } else if (volA < volB) {
             await handleLoadA(track);
             setTimeout(() => audioA.togglePlay(), 500);
        } else {
             await handleLoadB(track);
             setTimeout(() => audioB.togglePlay(), 500);
        }
    };
    window.addEventListener('dj-auto-load', (handleAutoLoad as any));
    return () => window.removeEventListener('dj-auto-load', (handleAutoLoad as any));
  }, [audioA.isPlaying, audioB.isPlaying, volA, volB, handleLoadA, handleLoadB, isPoweredOn]);

  return (
    <div className="flex flex-col items-center gap-1 md:gap-2 py-0 md:py-2 w-full bg-[#030303] min-h-screen text-white/90 font-sans selection:bg-sky-500/30 overflow-hidden">
      
      {/* Top Waveforms - Optimized height for Landscape (iPhone 12 Fix) */}
      <div className="w-full max-w-[1440px] bg-[#0c0c0c] border-b border-white/5 p-1 px-2 md:px-4 shadow-[0_30px_60px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col shrink-0">
          <div className="flex flex-col w-full gap-0.5 md:gap-2 relative">
              <div className="relative h-[28px] md:h-[100px] overflow-hidden group rounded-lg border border-white/5 bg-black">
                 <DJWaveform url={urlA} trackId={trackIdA} color="#10b981" resetTrigger={audioA.cueCount} getTimeInfo={audioA.getTimeInfo} />
                 <div className="absolute top-1 left-2 text-[6px] md:text-[10px] font-black italic text-emerald-500/90 uppercase tracking-[0.3em] z-40 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">DECK A</div>
              </div>
              <div className="relative h-[28px] md:h-[100px] overflow-hidden group rounded-lg border border-white/5 bg-black">
                 <DJWaveform url={urlB} trackId={trackIdB} color="#f97316" resetTrigger={audioB.cueCount} getTimeInfo={audioB.getTimeInfo} />
                 <div className="absolute top-1 left-2 text-[6px] md:text-[10px] font-black italic text-orange-500/90 uppercase tracking-[0.3em] z-40 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">DECK B</div>
              </div>
          </div>
      </div>

      <div className="flex flex-col landscape:flex-row items-center md:items-stretch landscape:items-start justify-center gap-2 max-md:landscape:gap-0 md:gap-4 xl:gap-8 w-full max-w-[1440px] px-1 md:px-4 mt-0.5 md:mt-1 flex-1 overflow-y-auto landscape:overflow-visible">
        <div className="w-full landscape:w-[42%] flex justify-center max-md:landscape:scale-[0.8] origin-top">
            <DJDeck 
                name="A" 
                crossfadeValue={crossfade} 
                audioController={audioA} 
                themeColor="#10b981" 
                externalVolume={volA} 
                url={urlA} 
                trackName={trackNameA} 
                isLoaded={audioA.isBufferLoaded} 
                bpm={findTrackBPM(urlA, trackNameA)} 
                track={fullTrackA} 
                pitch={pitchA} 
                setPitch={setPitchA} 
                onSync={handleSyncA} 
                beatOffset={audioA.beatOffset} 
            />
        </div>

        {/* CENTER MIXER SECTION - Scaled for iPhone 12 Landscape */}
        <div className="flex flex-col items-center gap-1 max-md:landscape:gap-0.5 md:gap-4 bg-zinc-950 border-x-4 border-zinc-900 px-1 md:px-4 py-1.5 md:py-6 rounded-3xl shadow-[0_45px_90px_rgba(0,0,0,0.9)] w-full landscape:w-[16%] min-w-[160px] shrink-0 max-md:landscape:scale-[0.78] max-md:landscape:-mt-4 origin-top">
          
          <button 
             onClick={handlePowerOn}
             className={`mb-1 group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 w-full justify-center ${isPoweredOn ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-red-500/10 border-red-500/50 text-red-500 animate-pulse'}`}
          >
             <div className={`w-1.5 h-1.5 rounded-full ${isPoweredOn ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
             <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{isPoweredOn ? 'Engine On' : 'Start Engine'}</span>
          </button>

          <div className="w-full bg-black/60 border border-white/5 rounded-xl p-1.5 flex flex-col items-center justify-center shadow-inner">
             <div className="text-[6px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-0.5">Global BPM</div>
             <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                <div className="text-xl md:text-2xl font-black italic text-white leading-none tracking-tighter">
                   {((findTrackBPM(urlA, trackNameA) * pitchA + findTrackBPM(urlB, trackNameB) * pitchB) / 2).toFixed(1)}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 h-40 md:h-64">
             <div className="flex flex-col items-center h-full gap-1">
                <ProfessionalFader label="CH 1" value={volA} onChange={setVolA} min={0} max={100} color="#10b981" />
             </div>
             <div className="flex gap-0.5 pt-8 md:pt-12 pb-2 md:pb-4 h-full border-x border-white/5 px-0.5 md:px-2 bg-[#050505] rounded-lg shadow-inner">
                <VUMeter getLevel={audioA.getLevel} isPlaying={audioA.isPlaying} />
                <VUMeter getLevel={audioB.getLevel} isPlaying={audioB.isPlaying} />
             </div>
             <div className="flex flex-col items-center h-full gap-1">
                <ProfessionalFader label="CH 2" value={volB} onChange={setVolB} min={0} max={100} color="#f97316" />
             </div>
          </div>

          <div className="w-full flex justify-center mt-1 md:mt-2">
             <ProfessionalFader label="X-FADER" value={crossfade * 100} onChange={(v) => setCrossfade(v/100)} min={0} max={100} isHorizontal color="#ffffff" />
          </div>
        </div>

        <div className="w-full landscape:w-[42%] flex justify-center max-md:landscape:scale-[0.8] origin-top">
            <DJDeck 
                name="B" 
                crossfadeValue={crossfade} 
                audioController={audioB} 
                themeColor="#f97316" 
                externalVolume={volB} 
                url={urlB} 
                trackName={trackNameB} 
                isLoaded={audioB.isBufferLoaded} 
                bpm={findTrackBPM(urlB, trackNameB)} 
                track={fullTrackB} 
                pitch={pitchB} 
                setPitch={setPitchB} 
                onSync={handleSyncB} 
                beatOffset={audioB.beatOffset} 
            />
        </div>
      </div>
    </div>
  );
};

export const DJConsole = React.memo(DJConsoleComponent);
