import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  size?: number;
  label?: string;
}

export const Knob: React.FC<KnobProps> = ({ value, min, max, onChange, size = 64, label }) => {
  const [angle, setAngle] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);

  // Map value to angle (-135 to 135 degrees)
  useEffect(() => {
    const percentage = (value - min) / (max - min);
    const newAngle = -135 + (percentage * 270);
    setAngle(newAngle);
  }, [value, min, max]);

  const handleDrag = (_: any, info: any) => {
    // Simple vertical drag to change value
    const sensitivity = 0.5;
    const delta = -info.delta.y * sensitivity;
    
    let newValue = value + ((max - min) * (delta / 100));
    newValue = Math.min(Math.max(newValue, min), max);
    
    onChange(newValue);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div 
        ref={knobRef}
        className="relative rounded-full bg-zinc-800 shadow-xl border-2 border-zinc-700 cursor-grab active:cursor-grabbing"
        style={{ 
          width: size, 
          height: size,
          rotate: angle 
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDrag={handleDrag}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Indicator Line */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1/2 origin-bottom">
            <div className="w-full h-1/3 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
        </div>
        
        {/* Texture/Grip */}
        <div className="absolute inset-0 rounded-full bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-30 pointer-events-none"></div>
      </motion.div>
      {label && <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{label}</span>}
    </div>
  );
};
