import React, { useRef } from 'react';
import { motion } from 'framer-motion';

interface TunerProps {
  value: number; // 0 to 1
  onChange: (value: number) => void;
}

export const Tuner: React.FC<TunerProps> = ({ value, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newValue = Math.max(0, Math.min(1, x / rect.width));
      onChange(newValue);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (e.buttons !== 1 || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const newValue = Math.max(0, Math.min(1, x / rect.width));
      onChange(newValue);
  };

  return (
    <div 
        ref={containerRef}
        className="h-16 bg-zinc-800 rounded relative overflow-hidden cursor-crosshair border-t border-black shadow-inner"
        onPointerDown={handlePointerDown}
        onMouseMove={handleMouseMove}
    >
        {/* Glass Glare */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

        {/* Scale Marks */}
        <div className="absolute inset-x-0 h-full flex justify-between items-end px-4 pb-2 pointer-events-none">
            {[...Array(21)].map((_, i) => (
                <div 
                    key={i} 
                    className={`w-[2px] bg-zinc-500 ${i % 5 === 0 ? 'h-6 bg-zinc-300' : 'h-3 opacity-50'}`}
                ></div>
            ))}
        </div>

        {/* Center Line Guide */}
        <div className="absolute top-1/2 inset-x-0 h-[1px] bg-red-900/40 pointer-events-none"></div>

        {/* Needle */}
        <motion.div 
            className="absolute top-0 bottom-0 w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"
            initial={{ left: `${value * 100}%` }}
            animate={{ left: `${value * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-red-500/10 border-x border-red-500/20"></div>
        </motion.div>

        {/* Frequency Numbers (Mock) */}
        <div className="absolute bottom-1 w-full flex justify-between px-2 text-[10px] font-mono text-zinc-500 pointer-events-none select-none">
            <span>88</span>
            <span>92</span>
            <span>96</span>
            <span>100</span>
            <span>104</span>
            <span>108</span>
        </div>
    </div>
  );
};
