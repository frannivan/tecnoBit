import React, { useState, useEffect, useRef } from 'react';
import { DJDeck, ProfessionalFader } from './DJDeck';
import { DJWaveform } from './DJWaveform';
import { DJPlaylist } from './DJPlaylist';
import { useDJAudio } from '../../../hooks/useDJAudio';
import { type Track, useDJStore } from '../../../store/useDJStore';
import { useRadioStore } from '../../../store/useRadioStore';
import { Plus } from 'lucide-react';
import { getTrackBlob, saveTrackBlob } from '../../../utils/indexedDB';
import { detectBPM } from '../../../utils/bpmDetector';
import * as Tone from 'tone';
import jsmediatags from 'jsmediatags';

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
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [analyzingTrackIds, setAnalyzingTrackIds] = useState<Set<string>>(new Set());

  // ESTADO DE PITCH CENTRALIZADO PARA SYNC
  const [pitchA, setPitchA] = useState(1.0);
  const [pitchB, setPitchB] = useState(1.0);
  
  const playlist = useDJStore(state => state.playlist);
  const sharedCrate = useDJStore(state => state.sharedCrate);
  const history = useDJStore(state => state.history);
  const setTrackBPM = useDJStore(state => state.setTrackBPM);
  const hasInteracted = useRadioStore(state => state.hasInteracted);

  const audioA = useDJAudio(urlA, trackIdA);
  const audioB = useDJAudio(urlB, trackIdB);

  const findTrackBPM = (u: string, n: string) => {
      const all = [...playlist, ...sharedCrate, ...history];
      return all.find(t => t.audioUrl === u || t.title === n)?.bpm || 128;
  };

  const analyzeTrack = async (track: Track) => {
      if (track.bpm || analyzingTrackIds.has(track.id)) return;
      setAnalyzingTrackIds(prev => new Set(prev).add(track.id));
      try {
          const cachedBlob = await getTrackBlob(track.id);
          let blob = cachedBlob;
          if (!blob && track.audioUrl) {
              const response = await fetch(track.audioUrl);
              blob = await response.blob();
              await saveTrackBlob({ id: track.id, blob, name: track.title, type: blob.type });
          }
          if (blob) {
              const id3BPM = await new Promise<number | null>((resolve) => {
                  jsmediatags.read(blob as Blob, {
                      onSuccess: (tag) => {
                          const bpmTag = tag.tags.TBPM || (tag.tags as any).bpm;
                          if (bpmTag && bpmTag.data) resolve(parseFloat(bpmTag.data));
                          else resolve(null);
                      },
                      onError: () => resolve(null)
                  });
              });
              if (id3BPM) {
                  setTrackBPM(track.id, id3BPM);
              } else {
                  const arrayBuffer = await blob.arrayBuffer();
                  const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
                  const bpm = await detectBPM(audioBuffer);
                  setTrackBPM(track.id, bpm);
              }
          }
      } catch (e) {
          console.warn(`Analysis failed for ${track.title}:`, e);
      } finally {
          setAnalyzingTrackIds(prev => {
              const next = new Set(prev);
              next.delete(track.id);
              return next;
          });
      }
  };

  // BACKGROUND SCAN
  useEffect(() => {
    if (!hasInteracted) return;
    const allTracks = [...playlist, ...sharedCrate];
    const scan = async () => {
        for (const track of allTracks) {
            if (!track.bpm) {
                await analyzeTrack(track);
                await new Promise(r => setTimeout(r, 500));
            }
        }
    };
    scan();
  }, [playlist.length, sharedCrate.length, hasInteracted]);

  // SYNC LOGIC
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

  const handleLoadA = async (item: Track) => {
      const cachedBlob = await getTrackBlob(item.id);
      const loadUrl = cachedBlob ? URL.createObjectURL(cachedBlob) : item.audioUrl;
      if (loadUrl) {
          setUrlA(loadUrl);
          setTrackNameA(item.title);
          setTrackIdA(item.id);
          setFullTrackA(item);
          setPitchA(1.0);
      }
  };

  const handleLoadB = async (item: Track) => {
      const cachedBlob = await getTrackBlob(item.id);
      const loadUrl = cachedBlob ? URL.createObjectURL(cachedBlob) : item.audioUrl;
      if (loadUrl) {
          setUrlB(loadUrl);
          setTrackNameB(item.title);
          setTrackIdB(item.id);
          setFullTrackB(item);
          setPitchB(1.0);
      }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 w-full bg-[#030303] min-h-screen text-white/90 font-sans selection:bg-sky-500/30 overflow-hidden">
      
      {/* MASTER WAVEFORM AREA - Compact in Landscape */}
      <div className="w-full max-w-[1400px] bg-[#0c0c0c] border border-white/5 p-1 px-4 shadow-[0_30px_60px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col bg-gradient-to-b from-transparent via-white/[0.02] to-transparent landscape:max-w-none">
          <div className="relative h-[80px] landscape:h-[40px] overflow-hidden group">
             <DJWaveform url={urlA} trackId={trackIdA} color="#10b981" resetTrigger={audioA.cueCount} getTimeInfo={audioA.getTimeInfo} />
             <div className="absolute top-2 left-6 text-[10px] font-black italic text-emerald-500/90 uppercase tracking-[0.5em] z-40 landscape:top-1 landscape:left-2 landscape:text-[8px] transition-all">MASTER DECK A - {trackNameA}</div>
          </div>
          <div className="h-0.5 bg-white/5 w-full relative z-50"></div>
          <div className="relative h-[80px] landscape:h-[40px] overflow-hidden group">
             <DJWaveform url={urlB} trackId={trackIdB} color="#f97316" resetTrigger={audioB.cueCount} getTimeInfo={audioB.getTimeInfo} />
             <div className="absolute bottom-2 left-6 text-[10px] font-black italic text-orange-500/90 uppercase tracking-[0.5em] z-40 landscape:bottom-1 landscape:left-2 landscape:text-[8px] transition-all">MASTER DECK B - {trackNameB}</div>
          </div>
          <div className="absolute inset-y-0 left-1/2 w-[2px] bg-yellow-400 pointer-events-none z-[100] shadow-[0_0_15px_#fbbf24]">
              <div className="absolute top-0 -left-1.5 w-4 h-4 bg-yellow-400 rotate-45" />
              <div className="absolute bottom-0 -left-1.5 w-4 h-4 bg-yellow-400 rotate-45" />
          </div>
      </div>

      <div className="flex flex-col landscape:flex-row lg:flex-row lg:flex-nowrap gap-4 xl:gap-8 justify-center items-center lg:items-end w-full relative z-10 px-4 mt-2">
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

        {/* MIXER */}
        <div className="flex flex-col items-center gap-4 bg-zinc-950 border-x-4 border-zinc-900 px-3 md:px-6 py-6 rounded-3xl shadow-[0_45px_90px_rgba(0,0,0,0.9)] min-w-[240px] md:min-w-[260px]">
          <div className="flex items-center gap-3 md:gap-8 h-64">
             <div className="flex flex-col items-center h-full gap-6">
                <button 
                  onClick={() => selectedTrack && handleLoadA(selectedTrack)}
                  className={`w-16 h-10 rounded-lg border font-black text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-1 shadow-2xl relative ${selectedTrack ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black cursor-pointer' : 'bg-zinc-950 border-white/5 text-zinc-800'}`}
                >
                  <Plus size={12} /> Load
                </button>
                <ProfessionalFader label="CH 1" value={volA} onChange={setVolA} min={0} max={100} color="#10b981" />
             </div>
             <div className="flex gap-2 pt-16 pb-6 h-full border-x border-white/5 px-2 md:px-3 bg-[#050505] rounded-xl shadow-inner">
                <VUMeter getLevel={audioA.getLevel} isPlaying={audioA.isPlaying} />
                <VUMeter getLevel={audioB.getLevel} isPlaying={audioB.isPlaying} />
             </div>
             <div className="flex flex-col items-center h-full gap-6">
                <button 
                  onClick={() => selectedTrack && handleLoadB(selectedTrack)}
                  className={`w-16 h-10 rounded-lg border font-black text-[10px] uppercase transition-all flex flex-col items-center justify-center gap-1 shadow-2xl relative ${selectedTrack ? 'bg-orange-500/20 border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-black cursor-pointer' : 'bg-zinc-950 border-white/5 text-zinc-800'}`}
                >
                  <Plus size={12} /> Load
                </button>
                <ProfessionalFader label="CH 2" value={volB} onChange={setVolB} min={0} max={100} color="#f97316" />
             </div>
          </div>
          <div className="pt-2 w-full flex justify-center">
             <ProfessionalFader label="X-FADE" value={crossfade * 100} onChange={(v) => setCrossfade(v/100)} min={0} max={100} isHorizontal color="#ffffff" />
          </div>
        </div>

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

      <div className="w-full max-w-[1400px] mt-8 bg-zinc-950/20 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[400px] mb-8">
         <DJPlaylist 
           selectedTrackId={selectedTrack?.id || null}
           onSelect={setSelectedTrack}
           analyzingTrackIds={analyzingTrackIds}
           deckAId={trackIdA}
           deckBId={trackIdB}
         />
      </div>
    </div>
  );
};

export const DJConsole = React.memo(DJConsoleComponent);
