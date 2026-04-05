import React, { useState, useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useDJStore } from '../../../store/useDJStore';

interface Props {
  url: string;
  trackId?: string | null;
  audioData?: { rms: Float32Array; duration: number } | null;
  color: string;
  isOverview?: boolean;
  isPlaying?: boolean;
  resetTrigger?: number;
  getTimeInfo?: () => { current: number, duration: number };
}

export const DJWaveform: React.FC<Props> = ({ url, trackId, audioData, color, isOverview = false, isPlaying = false, resetTrigger = 0, getTimeInfo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Persistence check for mobile drawing
  const storedData = useDJStore(state => trackId ? state.audioData[trackId] : null);
  const activeData = audioData || (storedData ? { rms: new Float32Array(storedData.rms), duration: 0 } : null);

  // RESET needles on track change or reset trigger
  useEffect(() => {
    if (moverRef.current) moverRef.current.style.transform = 'translateX(0%)';
    if (needleRef.current) needleRef.current.style.left = '0%';
    if (wsRef.current && isReady) {
        try { wsRef.current.seekTo(0); } catch(e) {}
    }
  }, [resetTrigger, isReady, isPlaying]);

  // INITIALIZATION (CORE ESTABLE REVERTIDO)
  useEffect(() => {
    if (!containerRef.current) return;
    setIsReady(false);

    const h = isOverview ? 35 : 100;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const gradient = ctx!.createLinearGradient(0, 0, 0, h);
    
    // Gradiente dinámico basado en el color del Deck
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, '#ffffff'); 
    gradient.addColorStop(1, color);

    const config: any = {
      container: containerRef.current,
      waveColor: gradient, 
      progressColor: gradient,
      height: h,
      minPxPerSec: isOverview ? 0 : 350, 
      fillParent: true,
      normalize: false, 
      autoCenter: false, 
      hideScrollbar: true,
      interact: false,
    };

    if (isOverview) {
        config.renderFunction = (channels: any, ctx: any) => {
            const { width, height } = ctx.canvas;
            const channel = channels[0];
            const length = channel.length;
            
            ctx.translate(0, height / 2);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();

            const step = 1; 
            const pointsPerPixel = Math.max(1, Math.floor(length / width));

            for (let i = 0; i < width; i += step) {
                const startIdx = Math.floor((i / width) * length);
                let sumSq = 0;
                let validPoints = 0;
                for (let j = 0; j < pointsPerPixel * step; j++) {
                    const idx = startIdx + j;
                    if (idx < length) {
                        const val = channel[idx] || 0;
                        sumSq += val * val;
                        validPoints++;
                    }
                }
                const rms = validPoints > 0 ? Math.sqrt(sumSq / validPoints) : 0;
                let displayVal = Math.pow(rms, 0.6) * 1.25; 
                if (displayVal > 0.85) displayVal = 0.85; 
                if (displayVal < 0.1 && rms > 0) displayVal = 0.1; 

                const barH = displayVal * (height / 2);
                ctx.moveTo(i, -barH);
                ctx.lineTo(i, barH);
            }
            ctx.stroke();
        };
    } else {
        config.normalize = true;
        config.barWidth = 2;
        config.barGap = 1;
        config.barHeight = 0.9;
    }

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      if (activeData) {
         const h = isOverview ? 35 : 100;
         const container = containerRef.current;
         if (container) {
            container.innerHTML = '';
            // CALCULATE DYNAMIC WIDTH FOR SCROLLING
            const duration = activeData.duration || 0;
            const scrollWidth = isOverview ? container.clientWidth : (duration * 350);
            if (!isOverview && moverRef.current) {
                moverRef.current.style.width = `${Math.ceil(scrollWidth)}px`;
            }

            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(scrollWidth);
            canvas.height = h;
            container.appendChild(canvas);
            const ctx = canvas.getContext('2d')!;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            const peaks = activeData.rms;
            for (let i = 0; i < canvas.width; i++) {
                const idx = Math.floor((i / canvas.width) * peaks.length);
                const val = peaks[idx] * (h / 2);
                ctx.moveTo(i, (h/2) - val);
                ctx.lineTo(i, (h/2) + val);
            }
            ctx.stroke();
         }
      }
      setIsReady(true);
      return;
    }
    const ws = WaveSurfer.create(config);
    ws.load(url);

    ws.on('ready', () => {
        if (!isOverview && moverRef.current) {
            const tot = ws.getDuration() * 350;
            moverRef.current.style.width = `${Math.ceil(tot)}px`;
        }
        setIsReady(true);
    });

    wsRef.current = ws;
    return () => ws.destroy();
  }, [url, activeData, isOverview, color]);

  useEffect(() => {
    let raf: number;
    const update = () => {
        if (isReady && getTimeInfo && (moverRef.current || needleRef.current)) {
            const { current, duration } = getTimeInfo();
            const prog = (current / (duration || 1)) * 100;
            if (isOverview) {
                if (needleRef.current) needleRef.current.style.left = `${prog}%`;
            } else {
                if (moverRef.current) {
                    moverRef.current.style.transform = `translateX(-${prog}%)`;
                }
            }
        }
        raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [isReady, isOverview, getTimeInfo]);

  return (
    <div className="w-full h-full relative flex items-center overflow-hidden bg-black">
      <div 
        ref={moverRef}
        className={`h-full ${isOverview ? 'w-full shadow-inner' : 'absolute left-1/2 flex items-center'}`}
        style={{ width: isOverview ? '100%' : '40000px', transform: 'translateX(0%)' }}
      >
          <div ref={containerRef} className="w-full h-full" />
      </div>

      {isOverview && isReady && (
          <div 
            ref={needleRef}
            className="absolute top-0 bottom-0 w-[1px] bg-white shadow-[0_0_6px_#fff] z-50"
            style={{ left: '0%' }}
          />
      )}

      {!isOverview && (
        <div className="absolute left-1/2 top-0 bottom-0 flex flex-col items-center z-[100] pointer-events-none">
            <div className="w-[1.5px] h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
            <div className="absolute -top-2 w-5 h-5 bg-white rotate-45 shadow-[0_0_10px_#fff]" />
            <div className="absolute -bottom-2 w-5 h-5 bg-white rotate-45 shadow-[0_0_10px_#fff]" />
        </div>
      )}

      {!isReady && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
            <div className="text-[10px] font-black italic animate-pulse text-white/30 uppercase tracking-[0.5em] font-mono">Decoding...</div>
         </div>
      )}
    </div>
  );
};
