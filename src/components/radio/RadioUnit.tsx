import React from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { Knob } from '../common/Knob';
import { Tuner } from './Tuner';
import { stations } from '../../data/stations';
import { motion } from 'framer-motion';
import { Power, Volume2 } from 'lucide-react';

import { Visualizer } from './Visualizer';

export const RadioUnit: React.FC = () => {
  const { 
    currentStation, 
    volume, 
    setVolume, 
    isMuted, 
    toggleMute, 
    isPlaying,
    togglePlay,
    isLoading,
    error,
    setStation
  } = useRadioStore();

  return (
    <div className="w-full max-w-4xl mx-auto p-4 perspective-1000">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative bg-zinc-900 rounded-lg shadow-2xl border-t border-zinc-700 border-b-4 border-b-zinc-950 p-8 overflow-hidden"
      >
        {/* Metallic Texture Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-950/80 pointer-events-none z-0 mix-blend-overlay"></div>
        
        {/* Power LED */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500 ${isPlaying ? 'bg-red-500 text-red-500' : 'bg-red-900/30 text-red-900'}`}></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
            
            {/* Left Controls (Volume) */}
            <div className="flex flex-col items-center gap-4">
                <Knob 
                    value={volume} 
                    min={0} 
                    max={1} 
                    onChange={setVolume} 
                    label="Volume" 
                />
                <button 
                  onClick={toggleMute}
                  className={`p-2 rounded-full ${isMuted ? 'bg-red-900/50 text-red-400' : 'bg-zinc-800 text-zinc-400'} hover:bg-zinc-700 transition-colors`}
                >
                    <Volume2 size={20} />
                </button>
            </div>

            {/* Center Display (Frequency & Info) */}
            <div className="flex-1 w-full bg-black rounded-sm border-4 border-zinc-600 shadow-inner p-4 relative overflow-hidden min-h-[160px] flex flex-col justify-center items-center group">
                 {/* Glass Reflection */}
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                 
                 {/* LCD Content */}
                 <div className="font-mono text-center z-10 w-full flex flex-col items-center">
                    {isLoading ? (
                         <motion.div 
                            animate={{ opacity: [0.4, 1, 0.4] }} 
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-orange-400 text-xl tracking-widest"
                         >
                            TUNING...
                         </motion.div>
                    ) : error ? (
                        <div className="text-red-500 font-bold animate-pulse">
                            SIGNAL LOST
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-2 mb-1">
                                {isPlaying && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>}
                                <span className="text-xs text-orange-500/80 tracking-widest">{isPlaying ? "ON AIR" : "STANDBY"}</span>
                            </div>

                            <motion.h2 
                                key={currentStation?.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl md:text-3xl font-bold text-orange-500 tracking-wider shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                            >
                                {currentStation?.name || "NO SIGNAL"}
                            </motion.h2>

                            <motion.div
                                key={currentStation?.genre}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-orange-300/60 mt-1 text-xs uppercase tracking-widest flex flex-col items-center gap-2"
                            >
                                <span>{currentStation?.genre}</span>
                                <Visualizer isPlaying={isPlaying} />
                            </motion.div>
                        </>
                    )}
                 </div>

                 {/* Retro Grid Lines */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] mix-blend-hard-light bg-[length:100%_4px,3px_1px] pointer-events-none"></div>
            </div>

            {/* Right Controls (Power / Play) */}
            <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-600 shadow-lg flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-400 active:scale-95 transition-all"
                >
                    <Power size={32} className={isPlaying ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" : ""} />
                </button>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Power</div>
            </div>

        </div>
        
        {/* Tuning Dial Area */}
        <div className="mt-8 relative">
             <div className="mb-2 text-xs font-mono text-zinc-500 uppercase flex justify-between">
                <span>FM STEREO TUNER</span>
                <span className={isPlaying ? "text-red-500 animate-pulse" : "text-zinc-700"}>STEREO</span>
             </div>
             <Tuner 
                value={(stations.indexOf(currentStation || stations[0]) / (stations.length - 1)) || 0}
                onChange={(val) => {
                    const idx = Math.round(val * (stations.length - 1));
                    const newStation = stations[idx];
                    if (newStation && newStation.id !== currentStation?.id) {
                        setStation(newStation);
                    }
                }}
             />
             <div className="flex justify-center mt-1">
                <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900/50 px-2 rounded border border-zinc-800">
                    &lt; DRAG RED NEEDLE TO TUNE &gt;
                </span>
             </div>
        </div>

      </motion.div>
    </div>
  );
};
