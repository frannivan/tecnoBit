import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Gauge } from 'lucide-react';
import { useDJAudio } from '../../../hooks/useDJAudio';
import { DJWaveform } from './DJWaveform';

interface Props {
  name: string;
  audioUrl: string;
  crossfadeValue: number;
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
      <div onMouseDown={handleMouseDown} className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 relative cursor-ns-resize shadow-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75" style={{ transform: `rotate(${rotation}deg)` }}><div className="w-1 h-2 rounded-full -translate-y-3 bg-white shadow-[0_0_5px_white]"></div></div>
      </div>
      <span className="text-[6px] font-black uppercase text-zinc-600 tracking-tighter" style={{ color: isDragging ? themeColor : '' }}>{label}</span>
    </div>
  );
};

export const ProfessionalFader: React.FC<{ 
    value: number, onChange: (val: number) => void, min: number, max: number, label: string, isHorizontal?: boolean, color?: string 
}> = ({ value, onChange, min, max, label, isHorizontal = false, color = "#fff" }) => {
    const p = ((value - min) / (max - min)) * 100;
    return (
        <div className={`flex items-center justify-center ${isHorizontal ? 'flex-col-reverse w-40 h-10' : 'flex-row w-10 h-48'} gap-1.5 group relative`}>
            <div className={`relative ${isHorizontal ? 'w-full h-8' : 'h-full w-10'} bg-zinc-950 border border-white/10 rounded-sm shadow-inner flex items-center justify-center p-1 z-10`}>
                <input type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`absolute ${isHorizontal ? 'w-full h-full' : 'w-48 h-10 -rotate-90 origin-center'} opacity-0 cursor-pointer z-30`} />
                <div className="absolute pointer-events-none z-20" style={{ width: isHorizontal ? '30px' : '34px', height: '14px', background: 'linear-gradient(to bottom, #444, #000, #444)', [isHorizontal ? 'left' : 'bottom']: `calc(${p}% - ${isHorizontal ? (30 * p / 100) : (14 * p / 100)}px)`, transition: 'all 0.05s ease-out' }}>
                    <div className={`absolute ${isHorizontal ? 'inset-y-0 left-1/2 w-[1px]' : 'inset-x-0 top-1/2 h-[1px]'}`} style={{ backgroundColor: color }}></div>
                </div>
            </div>
            <span className="text-[6px] font-black uppercase text-zinc-600 tracking-tighter font-mono p-0.5">{label}</span>
        </div>
    );
};

export const DJDeck: React.FC<Props> = ({ name, audioUrl, crossfadeValue }) => {
  const { isPlaying, togglePlay, applyVolume, applyEQ, applyPitch, getLevel, getTimeInfo } = useDJAudio(audioUrl);
  const [localVolume, setLocalVolume] = useState(100);
  const [eq, setEQ] = useState({ low: 0, mid: 0, high: 0 });
  const [pitch, setPitch] = useState(1.0);

  useEffect(() => {
    const xMult = name === "A" ? Math.min(1, (1 - crossfadeValue) * 2) : Math.min(1, crossfadeValue * 2);
    applyVolume((localVolume / 100) * xMult * 100);
  }, [localVolume, crossfadeValue, name, applyVolume]);

  const handleEQChange = (band: 'low' | 'mid' | 'high', val: number) => { 
    setEQ(prev => ({ ...prev, [band]: val })); 
    applyEQ(band, val); 
  };

  return (
    <div className="bg-zinc-950/95 backdrop-blur-3xl border border-zinc-900 p-8 rounded-[4rem] w-full max-w-[440px] flex flex-col gap-6 shadow-2xl relative border-t border-t-white/10 select-none">
      <div className={`absolute top-0 left-0 right-0 h-[4px] transition-all duration-1000 ${isPlaying ? (name === 'A' ? 'bg-emerald-500 shadow-[0_0_30px_#10b981]' : 'bg-cyan-500 shadow-[0_0_30px_#06b6d4]') : 'bg-zinc-800 opacity-20'}`}></div>

      <div className="flex justify-between items-center bg-black/60 p-5 rounded-[2.5rem] border border-white/5 shadow-inner">
        <h3 className="text-zinc-500 font-black uppercase text-[12px] tracking-[0.4em] flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? (name === 'A' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4]') : 'bg-zinc-800'}`}></div>
          Deck {name}
        </h3>
        <div className="bg-zinc-950 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3 shadow-inner">
           <Gauge size={14} className="text-orange-500" />
           <span className="text-[14px] font-mono font-black italic text-white/90">{(128 * pitch).toFixed(2)} <span className="text-[8px] text-zinc-600 not-italic ml-1 tracking-widest uppercase">BPM</span></span>
        </div>
      </div>

      <div className="flex gap-8 items-center">
         <div className="flex flex-col gap-6">
            <RotaryKnob label="HI" value={eq.high} onChange={(v) => handleEQChange('high', v)} min={-15} max={15} themeColor={name === 'A' ? '#10b981' : '#06b6d4'} />
            <RotaryKnob label="MID" value={eq.mid} onChange={(v) => handleEQChange('mid', v)} min={-15} max={15} themeColor={name === 'A' ? '#10b981' : '#06b6d4'} />
            <RotaryKnob label="LOW" value={eq.low} onChange={(v) => handleEQChange('low', v)} min={-15} max={15} themeColor={name === 'A' ? '#10b981' : '#06b6d4'} />
         </div>

         <div className="flex-1 flex flex-col gap-8">
            <div className="relative group">
               <div className={`w-40 h-40 rounded-full border-[10px] border-zinc-900 shadow-[0_30px_60px_rgba(0,0,0,1)] relative flex items-center justify-center overflow-hidden transition-all duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`} style={{ background: 'repeating-conic-gradient(from 0deg, #0d0f12 0deg 10deg, #181c20 10deg 20deg)' }}>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ animation: isPlaying ? 'spin 1.5s linear infinite' : 'none' }}>
                    <div className="w-[110%] h-[1.5px] bg-white/10 blur-[0.5px]"></div>
                  </div>
                  <button onClick={togglePlay} className="absolute inset-10 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] group-hover:border-white/30 transition-colors z-20">
                     {isPlaying ? <Pause size={24} className={name === 'A' ? 'text-emerald-500' : 'text-cyan-500'} /> : <Play size={24} className="text-zinc-700" fill="currentColor" />}
                  </button>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-center gap-6">
            <ProfessionalFader label="GAIN" value={localVolume} onChange={setLocalVolume} min={0} max={100} color={name === 'A' ? '#10b981' : '#06b6d4'} />
            <div className="h-12 w-2 bg-black rounded-full border border-white/5 overflow-hidden flex flex-col-reverse p-[1.5px] shadow-inner">
               <div className={`w-full transition-all duration-75 rounded-full ${name === 'A' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]'}`} style={{ height: `${Math.min(100, Math.pow(10, getLevel() / 20) * 110)}%` }}></div>
            </div>
         </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
         <div className="h-[45px] rounded-2xl bg-black/80 p-1 border border-white/5 shadow-inner overflow-hidden relative">
            <DJWaveform 
              url={audioUrl} 
              isPlaying={isPlaying} 
              color={name === 'A' ? '#10b981' : '#06b6d4'} 
              getTimeInfo={getTimeInfo} 
            />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80 shadow-[0_0_10px_#fff] z-10"></div>
         </div>
         <ProfessionalFader label="PITCH" value={pitch * 100} onChange={(v) => { setPitch(v/100); applyPitch(v/100); }} min={90} max={110} isHorizontal color={name === 'A' ? '#10b981' : '#06b6d4'} />
      </div>
    </div>
  );
};
