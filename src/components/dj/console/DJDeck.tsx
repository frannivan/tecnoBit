import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Music, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { DJWaveform } from './DJWaveform';
import { useDJStore } from '../../../store/useDJStore';

export interface Props {
  name: string;
  crossfadeValue: number;
  audioController: any;
  themeColor: string;
  externalVolume: number;
  url: string;
  trackName: string;
  isLoaded: boolean;
  bpm: number;
  track?: any;
  pitch: number;
  setPitch: React.Dispatch<React.SetStateAction<number>>;
  onSync: () => void;
  beatOffset: number;
}

const RotaryKnob: React.FC<{ 
    label: string, value: number, onChange: (val: number) => void, min: number, max: number, themeColor: string 
}> = ({ label, value, onChange, min, max, themeColor }) => {
  const [isDragging, setIsDragging] = useState(false);
  const lastY = useRef(0);
  const handleMouseDown = (e: React.MouseEvent) => { setIsDragging(true); lastY.current = e.clientY; document.body.style.cursor = 'ns-resize'; };
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (!isDragging) return; const deltaY = lastY.current - e.clientY; onChange(Math.max(min, Math.min(max, value + deltaY * 0.5))); lastY.current = e.clientY; };
    const handleMouseUp = () => { setIsDragging(false); document.body.style.cursor = 'default'; };
    if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, value, onChange, min, max]);
  const rotation = ((value - min) / (max - min)) * 270 - 135;
  return (
    <div className="flex flex-col items-center gap-0.5 group">
      <div onMouseDown={handleMouseDown} className="w-10 h-10 rounded-full bg-zinc-900 border-2 border-white/5 relative cursor-ns-resize shadow-lg overflow-hidden" style={{ background: 'conic-gradient(from 0deg, #111, #222, #111)', boxShadow: isDragging ? `0 0 15px ${themeColor}33` : 'none' }}>
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75" style={{ transform: `rotate(${rotation}deg)` }}><div className="w-1 h-2 rounded-full -translate-y-3 bg-white shadow-[0_0_5px_white]"></div></div>
      </div>
      <span className="text-[6px] font-black uppercase text-zinc-600 tracking-tighter">{label}</span>
    </div>
  );
};

export const ProfessionalFader: React.FC<{ 
    value: number, onChange: (val: number) => void, min: number, max: number, label: string, isHorizontal?: boolean, color?: string
}> = ({ value, onChange, min, max, label, isHorizontal = false, color = "#fff" }) => {
    const p = ((value - min) / (max - min)) * 100;
    return (
        <div className={`flex items-center justify-center flex-col ${isHorizontal ? 'w-48 h-14' : 'w-10 h-64'} gap-1 md:gap-1.5 group relative`}>
            <div className={`absolute ${isHorizontal ? 'left-2 right-2 top-0 h-2 flex-row' : 'top-2 bottom-2 -left-4 w-2 flex-col'} flex justify-between pointer-events-none opacity-30 z-0`}>
                {[...Array(11)].map((_, i) => (<div key={i} className={`bg-white ${isHorizontal ? 'w-px' : 'h-px'} ${i === 5 ? 'bg-sky-400 h-full w-full' : (isHorizontal ? 'h-2/3' : 'w-2/3')}`}></div>))}
            </div>
            <div className={`relative ${isHorizontal ? 'w-full h-8' : 'h-full w-full'} bg-zinc-950 border border-white/10 rounded-sm shadow-2xl flex items-center justify-center p-1 md:p-1.5 z-10`}>
                <div className="absolute bg-zinc-900 shadow-inner w-1 h-full opacity-30"></div>
                <input type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`absolute ${isHorizontal ? 'w-full h-full' : 'w-56 h-10 -rotate-90 origin-center'} opacity-0 cursor-pointer z-30`} />
                <div className="absolute pointer-events-none z-20" style={{ width: isHorizontal ? '30px' : '34px', height: '14px', background: 'linear-gradient(to bottom, #444, #000, #444)', [isHorizontal ? 'left' : 'bottom']: `calc(${p}% - ${isHorizontal ? (30 * p / 100) : (14 * p / 100)}px)`, transition: 'all 0.05s ease-out' }}>
                    <div className={`absolute ${isHorizontal ? 'inset-y-0 left-1/2 w-[1.5px]' : 'inset-x-0 top-1/2 h-[1.5px]'} shadow-lg`} style={{ backgroundColor: color }}></div>
                </div>
            </div>
            <span className="text-[7px] font-black uppercase text-zinc-600 tracking-tighter font-mono">{label}</span>
        </div>
    );
};

export const DJDeck: React.FC<Props> = ({ name, crossfadeValue, audioController, themeColor, externalVolume, url, trackName, isLoaded, bpm, track, pitch, setPitch, onSync }) => {
  const { isPlaying, togglePlay, handleCue, stopCue, applyVolume, applyEQ, applyPitch, cueCount, getTimeInfo } = audioController;
  const addToHistory = useDJStore(state => state.addToHistory);
  const [eq, setEQ] = useState({ low: 0, mid: 0, high: 0 });
  const [localGain, setLocalGain] = useState(100);
  
  const repeatRef = useRef<any>(null);
  const startRepeat = (dir: number) => {
      const step = 0.0001;
      const action = () => {
          setPitch(prev => {
              const next = Math.max(0.9, Math.min(1.1, prev + step * dir));
              applyPitch(next);
              return next;
          });
      };
      action();
      let count = 0;
      const interval = () => {
          action();
          count++;
          const speed = count > 10 ? 20 : 60;
          repeatRef.current = setTimeout(interval, speed);
      };
      repeatRef.current = setTimeout(interval, 400);
  };
  const stopRepeat = () => {
      if (repeatRef.current) { clearTimeout(repeatRef.current); repeatRef.current = null; }
  };

  const handleSearchDown = (dir: number) => {
      audioController.startScrub(dir);
  };
  const handleSearchUp = () => {
      audioController.stopScrub();
  };

  const elapsedRef = useRef<HTMLSpanElement>(null);
  const remainRef = useRef<HTMLSpanElement>(null);
  const pitchPercent = useMemo(() => ((pitch - 1) * 100).toFixed(2), [pitch]);

  useEffect(() => {
    const xMult = name === "A" ? Math.min(1, (1 - crossfadeValue) * 2) : Math.min(1, crossfadeValue * 2);
    applyVolume((externalVolume / 100) * (localGain / 100) * xMult * 100);
  }, [externalVolume, localGain, crossfadeValue, name, applyVolume]);

  const handleEQChange = (band: 'low' | 'mid' | 'high', val: number) => { 
    setEQ(prev => ({ ...prev, [band]: val })); 
    applyEQ(band, val); 
  };

  useEffect(() => {
    applyEQ('low', eq.low);
    applyEQ('mid', eq.mid);
    applyEQ('high', eq.high);
  }, [eq, applyEQ]);

  useEffect(() => {
    let raf: number;
    const format = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms}`;
    };
    const update = () => {
        if (getTimeInfo) {
            const { current, duration } = getTimeInfo();
            if (elapsedRef.current) elapsedRef.current.innerText = format(current);
            if (remainRef.current) remainRef.current.innerText = format(Math.max(0, duration - current));
        }
        raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [getTimeInfo]);

  return (
    <div className={`bg-[#1a1c1e] border-[3px] border-zinc-500 p-2 md:p-3 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-[500px] landscape:max-w-none flex flex-col gap-1 md:gap-2 shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative select-none overflow-hidden origin-top`}>
      
      {/* GLOW DECORATION */}
      <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[100px] pointer-events-none opacity-20" style={{ backgroundColor: themeColor }}></div>

      {/* TOP AREA: INFO & WAVEFORM DISPLAY */}
      <div className="bg-black/80 rounded-2xl md:rounded-3xl border border-white/5 p-2 md:p-3 flex flex-col gap-1 md:gap-2 shadow-inner relative overflow-hidden backdrop-blur-md">
          <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                      <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_#0ea5e9]"></div>
                      <h3 className="text-[9px] md:text-[11px] font-black text-white/90 uppercase tracking-[0.2em] truncate">{trackName}</h3>
                  </div>
                  <div className="text-[7px] md:text-[8px] font-bold text-white/30 truncate ml-3 md:ml-3.5 uppercase tracking-widest leading-none">
                      {track?.artist || 'Unknown Artist'}
                  </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 md:gap-1">
                  <div className="text-[8px] md:text-[10px] font-mono font-black text-white/80 tabular-nums">
                      <span ref={elapsedRef}>0:00.0</span> / <span className="opacity-40" ref={remainRef}>0:00.0</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-1.5">
                      <span className="text-[10px] md:text-[12px] font-black italic text-emerald-400">{(bpm * pitch).toFixed(1)}</span>
                      <span className="text-[6px] md:text-[7px] font-bold text-zinc-600 uppercase tracking-widest">BPM</span>
                  </div>
              </div>
          </div>

          {/* INTEGRATED WAVEFORM */}
          <div className="h-[25px] md:h-[35px] rounded-lg bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
              {!isLoaded ? (
                  <div className="flex items-center gap-2">
                       <div className="w-1 h-1 bg-orange-500 rounded-full animate-ping"></div>
                       <span className="text-[6px] text-white/20 font-black tracking-[0.4em] uppercase">Audio...</span>
                  </div>
              ) : (
                  <DJWaveform url={url} trackId={track?.id} color={themeColor} isOverview resetTrigger={cueCount} getTimeInfo={getTimeInfo} />
              )}
          </div>
      </div>

      <div className="flex flex-row gap-1 md:gap-2 mt-0">
          {/* LEFT COLUMN: EQ & FX */}
          <div className="flex flex-col gap-1 md:gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl md:rounded-2xl landscape:scale-90 origin-top">
              <div className="flex flex-col gap-2 md:gap-4 p-1 md:p-2">
                <RotaryKnob label="HI" value={eq.high} onChange={(v) => handleEQChange('high', v)} min={-15} max={15} themeColor={themeColor} />
                <RotaryKnob label="MID" value={eq.mid} onChange={(v) => handleEQChange('mid', v)} min={-15} max={15} themeColor={themeColor} />
                <RotaryKnob label="LOW" value={eq.low} onChange={(v) => handleEQChange('low', v)} min={-15} max={15} themeColor={themeColor} />
                <div className="h-px bg-white/5 w-full"></div>
                <RotaryKnob label="GAIN" value={localGain} onChange={setLocalGain} min={0} max={150} themeColor={themeColor} />
              </div>
          </div>

          {/* CENTER area: JOG WHEEL & TRANSPORT */}
          <div className="flex-1 flex flex-col items-center justify-start p-1 md:p-2 relative min-h-[260px] md:min-h-[320px] gap-1 md:gap-2">
             {/* Jog Wheel Container */}
             <div className="relative group flex items-center justify-center">
                <div 
                    className={`w-44 h-44 md:w-56 md:h-56 landscape:w-40 landscape:h-40 rounded-full border-[6px] md:border-[10px] border-[#111] shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,1)] relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing`} 
                    style={{ background: 'conic-gradient(from 0deg, #111, #181c20, #0d0f12, #181c20, #111)' }}
                >
                    {/* Spinning ring */}
                    <div 
                        className="absolute inset-1 md:inset-2 rounded-full border-[0.5px] border-white/10"
                        style={{ animation: isPlaying ? `spin ${1.8 / pitch}s linear infinite` : 'none' }}
                    >
                        <div className="absolute top-0 left-1/2 w-0.5 md:w-1 h-2 md:h-3 bg-sky-500 shadow-[0_0_10px_#0ea5e9] -translate-x-1/2 rounded-full"></div>
                    </div>

                    {/* Center Artwork / Label */}
                    <div className="absolute inset-4 md:inset-6 rounded-full border-2 border-white/5 bg-[#050505] shadow-2xl flex items-center justify-center overflow-hidden">
                        {track?.artwork ? (
                            <img src={track.artwork} className={`w-full h-full object-cover opacity-60 ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`} alt="" />
                        ) : (
                            <div className="flex flex-col items-center gap-0.5">
                                <Music size={14} className="text-zinc-800" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
                    </div>
                </div>
             </div>

             {/* TRANSPORT CONTROLS & SCRUB (Unified Row) */}
             <div className="flex items-center justify-center gap-1 md:gap-1.5 w-full mt-3 md:mt-8">
                  <div className="flex gap-1 md:gap-1.5">
                      <button 
                        onMouseDown={() => handleCue()} 
                        onMouseUp={() => stopCue()} 
                        className="w-10 h-10 md:w-16 md:h-16 bg-zinc-900 border-[2px] md:border-[3px] border-zinc-700 rounded-full flex flex-col items-center justify-center active:scale-95 transition-all shadow-xl hover:border-zinc-500 group"
                      >
                          <span className="text-[8px] md:text-[11px] font-black text-zinc-500 group-active:text-white tracking-widest leading-none uppercase">CUE</span>
                      </button>
                      
                      <button 
                        onClick={() => { if (!isPlaying && track) addToHistory(track); togglePlay(); }} 
                        className={`w-10 h-10 md:w-16 md:h-16 rounded-full border-[2px] md:border-[3px] flex flex-col items-center justify-center transition-all shadow-2xl active:scale-95 ${isPlaying ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'}`}
                      >
                          <Play size={16} className={isPlaying ? 'text-emerald-500' : 'text-zinc-500'} fill="currentColor" />
                      </button>
                  </div>

                  <button onClick={onSync} className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-[2px] md:border-[3px] transition-all shadow-xl active:scale-95 flex flex-col items-center justify-center ${themeColor === '#10b981' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10' : 'border-orange-500/30 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10'}`}>
                      <span className="text-[8px] md:text-[10px] font-black tracking-widest">SYNC</span>
                  </button>

                  <div className="flex gap-1 ml-1">
                      <button onMouseDown={() => handleSearchDown(-1)} onMouseUp={handleSearchUp} onMouseLeave={handleSearchUp} className="w-9 md:w-12 h-9 md:h-14 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center active:bg-zinc-800 shadow-lg group"><ChevronsLeft size={16} className="text-zinc-600 group-active:text-white transition-colors" /></button>
                      <button onMouseDown={() => handleSearchDown(1)} onMouseUp={handleSearchUp} onMouseLeave={handleSearchUp} className="w-9 md:w-12 h-9 md:h-14 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center active:bg-zinc-800 shadow-lg group"><ChevronsRight size={16} className="text-zinc-600 group-active:text-white transition-colors" /></button>
                  </div>
             </div>
          </div>

          {/* RIGHT COLUMN: PITCH */}
          <div className="flex flex-col items-center justify-between gap-1 md:gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-xl md:rounded-2xl min-w-[45px] md:min-w-[75px] origin-top h-auto">
              <div className="flex flex-col items-center gap-1">
                 <div className="bg-black/60 border border-white/5 px-1 py-0.5 rounded shadow-inner mb-0.5 md:mb-1">
                    <span className="text-[8px] md:text-[9px] font-mono font-black text-emerald-400">{Number(pitchPercent) > 0 ? '+' : ''}{pitchPercent}%</span>
                 </div>
                 
                 <button 
                    onClick={() => { setPitch(1.0); applyPitch(1.0); }}
                    className="w-4 h-4 md:w-5 md:h-5 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-lg hover:border-emerald-500 group"
                 >
                    <span className="text-[6px] md:text-[7px] font-black text-zinc-600 group-hover:text-emerald-500">0</span>
                 </button>
              </div>

              <div className="h-44 md:h-56 flex items-center justify-center my-2">
                 <ProfessionalFader 
                    label="TEMPO" 
                    value={pitch * 100} 
                    onChange={(v) => { setPitch(v/100); applyPitch(v/100); }} 
                    min={90} 
                    max={110} 
                    color={themeColor} 
                 />
              </div>

              <div className="flex flex-col gap-1 md:gap-1.5 mt-auto">
                 <button onMouseDown={() => startRepeat(-1)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat} className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border border-white/10 rounded-lg md:rounded-xl flex items-center justify-center active:bg-zinc-800 shadow-lg hover:text-white transition-colors"><ChevronLeft size={16} className="text-zinc-600" /></button>
                 <button onMouseDown={() => startRepeat(1)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat} className="w-8 h-8 md:w-10 md:h-10 bg-zinc-900 border border-white/10 rounded-lg md:rounded-xl flex items-center justify-center active:bg-zinc-800 shadow-lg hover:text-white transition-colors"><ChevronRight size={16} className="text-zinc-600" /></button>
              </div>
          </div>
      </div>
    </div>
  );
};
