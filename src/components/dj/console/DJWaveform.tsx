import React, { useState, useEffect, useRef } from 'react';
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

/**
 * MASTER-WAVE v2.6.0: PRO-LANDSCAPE (RAZOR)
 * Definitive performance-optimized engine. 
 * - Instant cache-loading (No delay on LOAD).
 * - High-density Razor bars (3px).
 * - Adaptive vertical padding for landscape viewports.
 */
export const DJWaveform: React.FC<Props> = ({ 
  trackId, 
  audioData, 
  color, 
  isOverview = false, 
  getTimeInfo 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const needleRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // 1. DATA SOURCE: Prioritize Cache for Instant Load
  const storedData = useDJStore(state => trackId ? state.hdPeaks[trackId] : null);
  const isValidStore = storedData && storedData.rms && storedData.rms.length >= 8000;
  
  // CRITICAL: If we have peaks in the Store, we use them IMMEDIATELY.
  const activeData = (isValidStore && !audioData) 
    ? { rms: new Float32Array(storedData.rms), duration: storedData.duration || 0 }
    : audioData;

  // 2. Cleanup & Canvas Init
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    container.appendChild(canvas);
    if (activeData) setIsReady(true);
  }, [trackId, isOverview]);

  // 3. MASTER RENDER ENGINE (v2.6.0)
  useEffect(() => {
    let raf: number;
    
    // -- CONFIGURACION RAZOR (3px) --
    const BAR_WIDTH = isOverview ? 2.5 : 3.0; 
    const GAP = 0.2; 
    const STEP = BAR_WIDTH + GAP;
    const SCROLL_SPEED = 350;

    const drawEngine = (
        ctx: CanvasRenderingContext2D, 
        w: number, 
        h: number, 
        current: number, 
        duration: number,
        peaks: Float32Array
    ) => {
        const mid = h / 2;
        const totalSamples = peaks.length;
        
        // PADDING VERTICAL: No tocar los bordes (v2.6.0 Landscape optimization)
        const verticalPadding = h > 50 ? 5 : 2; 
        const usableHalfHeight = mid - verticalPadding;

        ctx.fillStyle = color;

        if (isOverview) {
            const density = Math.floor(w / STEP);
            const samplesPerPillar = totalSamples / density;
            let maxP = 0;
            for (let i = 0; i < totalSamples; i++) if (peaks[i] > maxP) maxP = peaks[i];
            const multiplier = maxP > 0 ? (0.92 / maxP) : 1;

            for (let i = 0; i < density; i++) {
                const x = Math.floor(i * STEP);
                const startIdx = Math.floor(i * samplesPerPillar);
                const endIdx = Math.floor((i + 1) * samplesPerPillar);
                let maxBlock = 0;
                for (let j = startIdx; j < endIdx; j++) if (peaks[j] > maxBlock) maxBlock = peaks[j];
                const v = Math.max(1.5, maxBlock * multiplier * usableHalfHeight);
                ctx.fillRect(x, mid - v, BAR_WIDTH, v * 2);
            }
        } else {
            // DECK MODO: BLOQUES DENSOS SHARP
            const startX = Math.floor(w / 2) % STEP;
            for (let x = startX - STEP; x < w + STEP; x += STEP) {
                const px = Math.floor(x);
                const timeAtX = current + (px - w/2) / SCROLL_SPEED;
                
                if (timeAtX < 0 || timeAtX > duration) continue;
                
                const sampleIdx = Math.floor((timeAtX / duration) * (totalSamples - 1));
                const peak = peaks[sampleIdx] || 0;
                const v = Math.max(1, peak * usableHalfHeight * 0.98);

                ctx.fillRect(px, mid - v, BAR_WIDTH, v * 2);
            }
        }
    };

    const update = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !activeData || !getTimeInfo) {
            raf = requestAnimationFrame(update);
            return;
        }

        const ctx = canvas.getContext('2d', { alpha: false })!;
        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        const h = container.clientHeight; // Use container height directly (for adaptive resizing)

        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
            canvas.width = Math.floor(w * dpr);
            canvas.height = Math.floor(h * dpr);
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.scale(dpr, dpr);
            setIsReady(true);
        }

        const { current, duration } = getTimeInfo();
        ctx.fillStyle = '#050505'; 
        ctx.fillRect(0, 0, w, h);

        drawEngine(ctx, w, h, current, duration, activeData.rms);

        if (isOverview && needleRef.current) {
            const prog = (current / (duration || 1)) * 100;
            needleRef.current.style.left = `${prog}%`;
        }
        raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [isReady, isOverview, getTimeInfo, activeData, color, trackId]);

  return (
    <div className="w-full h-full relative flex items-center overflow-hidden bg-black/80">
      <div ref={containerRef} className="w-full h-full relative z-10" />

      {isOverview && isReady && (
          <div 
            ref={needleRef}
            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#fff] z-50 transition-all duration-75"
            style={{ left: '0%' }}
          />
      )}

      {!isOverview && (
        <div className="absolute left-1/2 top-0 bottom-0 flex flex-col items-center z-[100] pointer-events-none">
            <div className="w-[1.5px] h-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)]" />
            <div className="absolute -top-1 w-0 h-0 border-l-[6.5px] border-r-[6.5px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
            <div className="absolute -bottom-1 w-0 h-0 border-l-[6.5px] border-r-[6.5px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
        </div>
      )}

      {(!activeData || !isReady) && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-xl z-30">
            <div className="flex flex-col items-center gap-2">
                <div className="text-[9px] font-black italic animate-pulse text-white/40 uppercase tracking-[0.8em] font-mono">Syncing Peaks...</div>
            </div>
         </div>
      )}
    </div>
  );
};
