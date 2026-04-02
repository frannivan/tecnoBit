import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight, Music, Clock, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
        <div className={`flex items-center justify-center ${isHorizontal ? 'flex-col-reverse w-48 h-12' : 'flex-row w-12 h-56'} gap-1.5 group relative`}>
            <div className={`absolute ${isHorizontal ? 'left-2 right-2 -bottom-1 h-2 flex-row' : 'top-2 bottom-2 -left-3 w-2 flex-col'} flex justify-between pointer-events-none opacity-30 z-0`}>
                {[...Array(11)].map((_, i) => (<div key={i} className={`bg-white ${isHorizontal ? 'w-px' : 'h-px'} ${i === 5 ? 'bg-sky-400 h-full w-full' : (isHorizontal ? 'h-2/3' : 'w-2/3')}`}></div>))}
            </div>
            <div className={`relative ${isHorizontal ? 'w-full h-8' : 'h-full w-10'} bg-zinc-950 border border-white/10 rounded-sm shadow-2xl flex items-center justify-center p-1.5 z-10`}>
                <div className="absolute bg-zinc-900 shadow-inner w-1 h-full opacity-30"></div>
                <input type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`absolute ${isHorizontal ? 'w-full h-full' : 'w-56 h-10 -rotate-90 origin-center'} opacity-0 cursor-pointer z-30`} />
                <div className="absolute pointer-events-none z-20" style={{ width: isHorizontal ? '30px' : '34px', height: '14px', background: 'linear-gradient(to bottom, #444, #000, #444)', [isHorizontal ? 'left' : 'bottom']: `calc(${p}% - ${isHorizontal ? (30 * p / 100) : (14 * p / 100)}px)`, transition: 'all 0.05s ease-out' }}>
                    <div className={`absolute ${isHorizontal ? 'inset-y-0 left-1/2 w-[1.5px]' : 'inset-x-0 top-1/2 h-[1.5px]'} shadow-lg`} style={{ backgroundColor: color }}></div>
                </div>
            </div>
            <span className="text-[6px] font-black uppercase text-zinc-600 tracking-tighter font-mono p-0.5">{label}</span>
        </div>
    );
};

export const DJDeck: React.FC<Props> = ({ name, crossfadeValue, audioController, themeColor, externalVolume, url, trackName, isLoaded, bpm, track, pitch, setPitch, onSync }) => {
  const { isPlaying, togglePlay, handleCue, stopCue, applyVolume, applyEQ, applyPitch, nudge, cueCount, getTimeInfo } = audioController;
  const playlist = useDJStore(state => state.playlist);
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
    <div className={`bg-zinc-950 border-4 border-zinc-900 p-4 rounded-3xl w-full max-w-[480px] flex gap-4 shadow-2xl relative select-none ${name === 'A' ? 'flex-row' : 'flex-row-reverse'}`}>
      
      {/* PITCH COLUMN */}
      <div className="flex flex-col items-center">
          <div className="mb-2 w-12 bg-zinc-900 rounded border border-white/5 text-center px-1 py-0.5 shadow-inner">
             <span className="text-[8px] font-mono font-black text-emerald-400">{Number(pitchPercent) > 0 ? '+' : ''}{pitchPercent}%</span>
          </div>
          <button 
              onClick={() => { setPitch(1.0); applyPitch(1.0); }}
              className="mb-2 w-6 h-6 bg-zinc-900 border border-white/20 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-xl hover:border-emerald-400 group"
              title="Reset Pitch to 0"
          >
             <span className="text-[9px] font-black text-zinc-500 group-hover:text-emerald-400">0</span>
          </button>
          <ProfessionalFader 
            label="Pitch" 
            value={pitch * 100} 
            onChange={(v) => { setPitch(v/100); applyPitch(v/100); }} 
            min={90} 
            max={110} 
            color={themeColor} 
          />
          <div className="flex flex-row gap-2 mt-2">
              <button onMouseDown={() => startRepeat(-1)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat} className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center active:bg-zinc-800 shadow-xl"><ChevronLeft size={14} className="text-zinc-500" /></button>
              <button onMouseDown={() => startRepeat(1)} onMouseUp={stopRepeat} onMouseLeave={stopRepeat} className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center active:bg-zinc-800 shadow-xl"><ChevronRight size={14} className="text-zinc-500" /></button>
          </div>
      </div>

      {/* MAIN SCREEN AREA */}
      <div className="flex-1 flex flex-col gap-3">
          <div className="bg-[#0c0c0c] p-3 rounded-xl border-x-4 border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
               <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5"><Music size={10} className="text-sky-400" /><span className="text-[10px] font-black text-white/90 truncate uppercase tracking-wider">{trackName}</span></div>
                  <div className="text-[8px] font-bold text-white/40 truncate ml-4 uppercase">{isLoaded ? 'READY TO PLAY' : 'DECODING...'}</div>
               </div>
               <div className="flex flex-col items-center justify-center w-12 h-12">
                  <div className="text-2xl font-black italic text-emerald-400 leading-none tracking-tighter">{(bpm * pitch).toFixed(2)}</div>
                  <div className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest mt-1">BPM</div>
               </div>
            </div>
            <div className="flex justify-between items-center text-[8px] font-mono font-bold">
               <div className="flex gap-3">
                  <div className="flex items-center gap-1 text-white/60"><Clock size={8} /> <span ref={elapsedRef} className="text-white w-10 text-right">0:00.0</span></div>
                  <div className="flex items-center gap-1 text-white/60"><span className="text-white/40 uppercase">Rem</span> <span ref={remainRef} className="text-emerald-400 w-10 text-right">0:00.0</span></div>
               </div>
            </div>
            <div className="h-[30px] rounded bg-black/60 overflow-hidden relative border border-white/5 flex items-center justify-center">
               {!audioController.isBufferLoaded ? (
                   <span className="text-[7px] text-white/30 font-black tracking-[0.3em] uppercase animate-pulse">Analizando...</span>
               ) : (
                   <div 
                      className="w-full h-full origin-left"
                      style={{ animation: 'revealLtoR 4.5s linear forwards' }}
                   >
                      <style>{`
                         @keyframes revealLtoR {
                            0% { clip-path: inset(0 100% 0 0); opacity: 0; }
                            5% { clip-path: inset(0 95% 0 0); opacity: 1; }
                            100% { clip-path: inset(0 0 0 0); opacity: 1; }
                         }
                      `}</style>
                      <DJWaveform url={url} color={themeColor} isOverview resetTrigger={cueCount} getTimeInfo={getTimeInfo} />
                   </div>
               )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
             {/* JOG AREA / CD */}
             <div className="relative">
                <div className={`w-32 h-32 rounded-full border-[6px] border-zinc-900 shadow-2xl relative flex items-center justify-center overflow-hidden`} style={{ background: 'repeating-conic-gradient(from 0deg, #0d0f12 0deg 10deg, #181c20 10deg 20deg)' }}>
                    <div className="absolute inset-0 flex items-center justify-center" style={{ animation: isPlaying ? 'spin 1.8s linear infinite' : 'none' }}>
                      <div className="w-[110%] h-[1px] bg-sky-400/20"></div>
                    </div>
                    <div className="absolute inset-6 rounded-full border border-white/5 bg-[#121212] flex items-center justify-center shadow-inner">
                        <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-sky-400 shadow-[0_0_15px_#0ea5e9]' : 'bg-zinc-800'}`}></div>
                    </div>
                </div>
             </div>
          </div>

          {/* TRANSPORT CONTROLS */}
          <div className="flex items-center justify-center gap-3 mt-2">
              <div className="flex gap-1">
                 <button onMouseDown={() => handleSearchDown(-1)} onMouseUp={handleSearchUp} onMouseLeave={handleSearchUp} className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center active:scale-90 shadow-xl group"><ChevronsLeft size={16} className="text-zinc-600 group-active:text-white" /></button>
                 <button onMouseDown={() => handleSearchDown(1)} onMouseUp={handleSearchUp} onMouseLeave={handleSearchUp} className="w-10 h-10 bg-zinc-900 border border-white/5 rounded-full flex items-center justify-center active:scale-90 shadow-xl group"><ChevronsRight size={16} className="text-zinc-600 group-active:text-white" /></button>
              </div>

              <button onClick={onSync} className={`px-4 h-10 rounded-full border-2 font-black text-[10px] transition-all shadow-xl active:scale-95 ${themeColor === '#10b981' ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10' : 'border-orange-500/30 text-orange-500 hover:bg-orange-500/10'}`}>SYNC</button>
              
              <button onMouseDown={() => handleCue()} onMouseUp={() => stopCue()} className="w-12 h-12 bg-zinc-900 border-2 border-white/10 rounded-full flex items-center justify-center active:scale-95 shadow-xl group"><span className="text-[10px] font-black text-zinc-500 group-active:text-white">CUE</span></button>
              
              <button 
                onClick={() => { if (!isPlaying && track) addToHistory(track); togglePlay(); }} 
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-2xl active:scale-90 ${isPlaying ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'border-white/10 bg-zinc-900'}`}
              >
                  <Play size={24} className={isPlaying ? 'text-emerald-500' : 'text-zinc-600'} fill="currentColor" />
              </button>
          </div>
      </div>

      {/* GAIN AND EQ SLIDER STRIP ON THE SIDE (VERTICAL) */}
      <div className="flex flex-col justify-center items-center bg-zinc-900/40 p-2 py-4 rounded-2xl border border-white/5 gap-3 shadow-inner h-full shrink-0 min-w-[50px]">
          <RotaryKnob label="HI" value={eq.high} onChange={(v) => handleEQChange('high', v)} min={-15} max={15} themeColor={themeColor} />
          <RotaryKnob label="MID" value={eq.mid} onChange={(v) => handleEQChange('mid', v)} min={-15} max={15} themeColor={themeColor} />
          <RotaryKnob label="LOW" value={eq.low} onChange={(v) => handleEQChange('low', v)} min={-15} max={15} themeColor={themeColor} />
          <div className="w-full h-px bg-white/10 my-1"></div>
          <RotaryKnob label="GAIN" value={localGain} onChange={setLocalGain} min={0} max={150} themeColor={themeColor} />
      </div>
    </div>
  );
};
