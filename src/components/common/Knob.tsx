import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  size?: number;
  label?: string;
  onInteraction?: () => void;
}

export const Knob: React.FC<KnobProps> = ({ value, min, max, onChange, size = 64, label, onInteraction }) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Directly derive angle from value (-135 to 135 degrees)
  const percentage = max !== min ? (value - min) / (max - min) : 0;
  const angle = -135 + (percentage * 270);

  useEffect(() => {
    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const sensitivity = 0.006;
      let dy = e.movementY;
      let dx = e.movementX;

      // Fallback for touch screens (iOS/Android) where movementX/movementY can be 0 or undefined
      if (lastPointerRef.current && (dy === undefined || dx === undefined || (dy === 0 && dx === 0))) {
        dy = e.clientY - lastPointerRef.current.y;
        dx = e.clientX - lastPointerRef.current.x;
      }
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      const delta = (-(dy || 0) + (dx || 0)) * sensitivity;
      const newValue = Math.min(max, Math.max(min, value + delta));
      
      if (newValue !== value) {
        onChange(newValue);
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      lastPointerRef.current = null;
      document.body.style.cursor = '';
      
      // Explicitly release capture if possible
      try {
        const target = e.target as HTMLElement;
        if (target && target.releasePointerCapture) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore capture errors on unsupported platforms
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handleWindowPointerMove);
      window.addEventListener('pointerup', handleWindowPointerUp);
      window.addEventListener('pointercancel', handleWindowPointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [isDragging, value, min, max, onChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (onInteraction) {
      onInteraction();
    }
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture errors on unsupported platforms
    }
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };

  const handleWheel = (e: React.WheelEvent) => {
    const step = 0.05;
    const delta = e.deltaY > 0 ? -step : step;
    let newValue = value + delta;
    newValue = Math.min(Math.max(newValue, min), max);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center gap-2 group/knob">
      <div className="relative">
          <motion.div 
            ref={knobRef}
            className={`relative rounded-full bg-zinc-800 shadow-xl border-2 border-zinc-700 touch-none transition-shadow ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ 
              width: size, 
              height: size,
              rotate: angle 
            }}
            onPointerDown={handlePointerDown}
            onWheel={handleWheel}
            whileHover={{ 
              scale: 1.05, 
              borderColor: '#f97316',
              boxShadow: "0 0 20px rgba(249, 115, 22, 0.2)"
            }}
            whileTap={{ scale: 0.95 }}
            title="Drag up/down or Scroll to adjust"
          >
            {/* Indicator Line */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1/2 origin-bottom">
                <div className="w-full h-1/3 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
            </div>
            
            {/* Texture/Grip */}
            <div className="absolute inset-0 rounded-full bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 pointer-events-none"></div>
            
            {/* Inner Shadow for depth */}
            <div className="absolute inset-1 rounded-full border border-black/20 pointer-events-none"></div>
          </motion.div>
          
          {/* Value Tooltip on Hover */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-orange-500 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover/knob:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {Math.round(((value - min) / (max - min)) * 100)}%
          </div>
      </div>
      {label && <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{label}</span>}
    </div>
  );
};
