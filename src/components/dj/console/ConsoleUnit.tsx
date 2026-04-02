import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, AudioLines } from 'lucide-react';
import { useDJAudio } from '../../../hooks/useDJAudio';
import { DJWaveform } from './DJWaveform';

interface Props {
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
      <div onMouseDown={handleMouseDown} className="w-6 h-6 rounded-full bg-zinc-900 border border-white/5 relative cursor-ns-resize shadow-lg overflow-hidden" style={{ background: 'conic-gradient(from 0deg, #111, #222, #111)' }}>
        <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75" style={{ transform: `rotate(${rotation}deg)` }}><div className="w-0.5 h-1.5 rounded-full -translate-y-2 bg-white shadow-[0_0_5px_white]"></div></div>
      </div>
      <span className="text-[5px] font-black uppercase text-zinc-600 tracking-tighter" style={{ color: isDragging ? themeColor : '' }}>{label}</span>
    </div>
  );
};

export const ProfessionalFader: React.FC<{ 
    value: number, onChange: (val: number) => void, min: number, max: number, label: string, isHorizontal?: boolean, color?: string 
}> = ({ value, onChange, min, max, label, isHorizontal = false, color = "#fff" }) => {
    const p = ((value - min) / (max - min)) * 100;
    return (
        <div className={`flex items-center justify-center ${isHorizontal ? 'flex-col-reverse w-32 h-8' : 'flex-row w-8 h-40'} gap-1 group relative`}>
            <div className={`relative ${isHorizontal ? 'w-full h-6' : 'h-full w-8'} bg-zinc-950 border border-white/10 rounded-sm shadow-inner flex items-center justify-center p-1 z-10`}>
                <input type="range" min={min} max={max} step={0.01} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`absolute ${isHorizontal ? 'w-full h-full' : 'w-40 h-8 -rotate-90 origin-center'} opacity-0 cursor-pointer z-30`} />
                <div className="absolute pointer-events-none z-20" style={{ width: isHorizontal ? '20px' : '24px', height: '10px', background: 'linear-gradient(to bottom, #444, #000, #444)', [isHorizontal ? 'left' : 'bottom']: `calc(${p}% - ${isHorizontal ? (20 * p / 100) : (10 * p / 100)}px)`, transition: 'all 0.05s ease-out' }}>
                    <div className={`absolute ${isHorizontal ? 'inset-y-0 left-1/2 w-[1px]' : 'inset-x-0 top-1/2 h-[1px]'}`} style={{ backgroundColor: color }}></div>
                </div>
            </div>
            <span className="text-[5px] font-black uppercase text-zinc-600 tracking-tighter font-mono p-0.5">{label}</span>
        </div>
    );
};

export const DJDeck: React.FC<Props> = ({ audioUrl, crossfadeValue }) => {
  const { isPlaying, togglePlay, applyVolume, applyEQ, applyPitch, getLevel, getTimeInfo } = useDJAudio(audioUrl);
  const [localVolume, setLocalVolume] = useState(100);
  const [eq, setEQ] = useState({ low: 0, mid: 0, high: 0 });
  const [pitch, setPitch] = useState(1.0);

  useEffect(() => {
    applyVolume((localVolume / 100) * (crossfadeValue / 100) * 100);
  }, [localVolume, crossfadeValue, applyVolume]);

  const handleEQChange = (band: 'low' | 'mid' | 'high', val: number) => { 
    setEQ(prev => ({ ...prev, [band]: val })); 
    applyEQ(band, val); 
  };

  return (
    <div className="bg-zinc-950 border-2 border-zinc-900 p-3 rounded-2xl w-full max-w-[360px] flex gap-3 shadow-xl relative select-none">
      <div className="flex flex-col items-center">
          <ProfessionalFader 
            label="PITCH" 
            value={pitch * 100} 
            onChange={(v) => { setPitch(v/100); applyPitch(v/100); }} 
            min={90} 
            max={110} 
            color="#0ea5e9" 
          />
      </div>

      <div className="flex-1 flex flex-col gap-2">
          <div className="bg-[#0c0c0c] p-2 rounded-lg border border-white/5 shadow-inner relative overflow-hidden flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-1"><AudioLines size={10} className="text-sky-400" /><span className="text-[8px] font-black text-white/50 truncate uppercase tracking-widest">WAVEFORM</span></div>
                <div className="text-[12px] font-black italic text-emerald-400 leading-none">{(128 * pitch).toFixed(1)}</div>
            </div>
            <div className="h-[30px] rounded bg-black/60 overflow-hidden relative border border-white/5">
               <DJWaveform 
                  url={audioUrl} 
                  color="#0ea5e9" 
                  getTimeInfo={getTimeInfo} 
               />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
             <div className="relative">
                <div className={`w-20 h-20 rounded-full border-4 border-zinc-900 shadow-xl relative flex items-center justify-center overflow-hidden`} style={{ background: 'repeating-conic-gradient(from 0deg, #0d0f12 0deg 10deg, #181c20 10deg 20deg)' }}>
                    <div className="absolute inset-0 flex items-center justify-center" style={{ animation: isPlaying ? 'spin 2s linear infinite' : 'none' }}>
                      <div className="w-[110%] h-[1px] bg-sky-400/20"></div>
                    </div>
                </div>
                <button onClick={togglePlay} className={`absolute inset-6 rounded-full border border-white/5 flex items-center justify-center shadow-2xl transition-all ${isPlaying ? 'bg-emerald-500/10' : 'bg-zinc-900'}`}>
                    {isPlaying ? <Pause size={12} className="text-emerald-500" /> : <Play size={12} className="text-white/40" fill="currentColor" />}
                </button>
             </div>

             <div className="flex flex-col gap-1">
                <RotaryKnob label="HI" value={eq.high} onChange={(v) => handleEQChange('high', v)} min={-15} max={15} themeColor="#0ea5e9" />
                <RotaryKnob label="MID" value={eq.mid} onChange={(v) => handleEQChange('mid', v)} min={-15} max={15} themeColor="#0ea5e9" />
                <RotaryKnob label="LOW" value={eq.low} onChange={(v) => handleEQChange('low', v)} min={-15} max={15} themeColor="#0ea5e9" />
             </div>
          </div>
      </div>

      <div className="w-8 flex flex-col justify-center items-center bg-zinc-900/40 p-1.5 rounded-xl border border-white/5 gap-2 shadow-inner">
          <RotaryKnob label="GAIN" value={localVolume} onChange={setLocalVolume} min={0} max={150} themeColor="#0ea5e9" />
          <div className="h-10 w-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden flex flex-col-reverse p-[1px]">
             <div className="w-full bg-emerald-500 shadow-[0_0_10px_#10b981]" style={{ height: `${Math.min(100, Math.pow(10, getLevel() / 20) * 110)}%` }}></div>
          </div>
      </div>
    </div>
  );
};
