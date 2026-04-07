import React from 'react';
import { motion } from 'framer-motion';
import { Power } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center text-center p-4"
    >
      <div className="max-w-md w-full space-y-8">
        <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold tracking-widest text-zinc-100">
                tecno<span className="text-orange-500">Bit</span>
            </h1>
            <p className="text-zinc-500 font-mono text-sm">ANALOG_DIGITAL_HYBRID_SYSTEM</p>
        </div>

        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="group relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-sm font-medium rounded-lg group bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-500 hover:to-red-400 focus:ring-4 focus:outline-none focus:ring-orange-800 text-white"
        >
             <span className="relative px-8 py-4 transition-all ease-in duration-75 bg-black rounded-md group-hover:bg-opacity-0 flex items-center gap-3">
                <Power size={24} />
                <span className="text-lg tracking-widest font-bold">ENTER MASTER CRATE</span>
             </span>
        </motion.button>

        <p className="text-zinc-600 text-xs max-w-xs mx-auto">
            Interactive audio experience. Click to enable audio engine and autoplay.
        </p>
      </div>
    </motion.div>
  );
};
