import React from 'react';
import { useRadioStore } from '../../store/useRadioStore';
import { Knob } from '../common/Knob';
import { Tuner } from './Tuner';
import { stations } from '../../data/stations';
import { motion } from 'framer-motion';
import { Power, Volume2, VolumeX } from 'lucide-react';

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
        className="relative chrome-frame rounded-xl p-8 overflow-hidden border-4 border-zinc-500"
      >
        {/* Horizontal Grill Texture Background */}
        <div className="absolute inset-0 chrome-grill opacity-90 pointer-events-none z-0"></div>
        
        {/* Dark overlay for readability over grill */}
        <div className="absolute inset-0 bg-black/60 pointer-events-none z-0"></div>
        
        {/* Power LED */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors duration-500 ${isPlaying ? 'bg-green-500 text-green-500' : 'bg-red-900/30 text-red-900'}`}></div>
            <span className="text-[10px] font-mono text-zinc-500">{isPlaying ? 'LIVE' : 'OFF'}</span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
            
             {/* Left Controls (Volume) */}
            <div className="flex flex-col items-center gap-4 w-24">
                <div className="relative group">
                    <Knob 
                        value={volume} 
                        min={0} 
                        max={1} 
                        onChange={setVolume} 
                        label="Volume" 
                    />
                     {/* Tooltip for Knob */}
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-orange-500 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-zinc-700">
                        {Math.round(volume * 100)}%
                    </div>
                </div>
                
                {/* Discrete Volume Buttons */}
                <div className="flex items-center gap-2">
                     <button 
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            setVolume(Math.max(0, volume - 0.1));
                        }}
                        className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 active:scale-90 transition-all cursor-pointer shadow-md touch-manipulation"
                        title="Volume Down"
                     >
                        <span className="text-xl md:text-base pointer-events-none select-none">-</span>
                     </button>
                    <button 
                      type="button"
                      onPointerDown={(e) => {
                          e.preventDefault();
                          toggleMute();
                      }}
                      title={isMuted ? "Unmute" : "Mute"}
                      className={`w-10 h-10 md:w-8 md:h-8 rounded-full transition-all border flex items-center justify-center cursor-pointer shadow-md touch-manipulation ${isMuted ? 'bg-red-900/40 border-red-500 text-red-500' : 'bg-zinc-800 border-zinc-700 text-green-500 hover:border-green-500 active:scale-90'}`}
                    >
                        <div className="pointer-events-none select-none">
                            {isMuted ? <VolumeX size={18} className="md:w-3.5 md:h-3.5" /> : <Volume2 size={18} className="md:w-3.5 md:h-3.5" />}
                        </div>
                    </button>
                     <button 
                        type="button"
                        onPointerDown={(e) => {
                            e.preventDefault();
                            setVolume(Math.min(1, volume + 0.1));
                        }}
                        className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 active:scale-90 transition-all cursor-pointer shadow-md touch-manipulation"
                        title="Volume Up"
                     >
                        <span className="text-xl md:text-base pointer-events-none select-none">+</span>
                     </button>
                </div>
            </div>

            {/* Center Display (Frequency & Info) */}
            <div className={`flex-1 w-full bg-black rounded-sm border-4 border-zinc-600 shadow-inner p-4 relative overflow-hidden min-h-[160px] flex flex-col justify-center items-center group transition-all duration-1000 ${isPlaying ? 'shadow-[inset_0_0_20px_rgba(249,115,22,0.1)]' : 'opacity-80'}`}>
                 {/* Glass Reflection */}
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none z-20"></div>
                 
                 {/* LCD Content */}
                 <div className={`font-mono text-center z-10 w-full flex flex-col items-center transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-25 grayscale brightness-75'}`}>
                    {(isLoading && isPlaying) ? (
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
                                <span className="text-xs text-orange-500/80 tracking-widest transition-colors duration-1000">{isPlaying ? "ON AIR" : "OFFLINE"}</span>
                            </div>

                            <motion.h2 
                                key={currentStation?.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-2xl md:text-3xl font-bold tracking-wider transition-all duration-1000 ${isPlaying ? 'text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'text-zinc-500 shadow-none'}`}
                            >
                                {currentStation?.name || "NO SIGNAL"}
                            </motion.h2>

                            <motion.div
                                key={currentStation?.genre}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-zinc-500 mt-1 text-xs uppercase tracking-widest flex flex-col items-center gap-2"
                            >
                                <span className={isPlaying ? 'text-orange-300/60' : 'text-zinc-600'}>{currentStation?.genre}</span>
                                <Visualizer isPlaying={isPlaying} />
                            </motion.div>
                        </>
                    )}
                 </div>

                 {/* Retro Grid Lines */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] mix-blend-hard-light bg-[length:100%_4px,3px_1px] pointer-events-none"></div>
            </div>

            {/* Right Controls (Power / Play) */}
            <div className="flex flex-col items-center gap-4 w-24">
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-600 shadow-lg flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-400 active:scale-95 transition-all"
                >
                    <Power size={32} className={isPlaying ? "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" : ""} />
                </button>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Power</div>
                <div className="h-8"></div> {/* Spacer to match volume buttons height */}
            </div>

        </div>
        
        {/* Tuning Dial Area */}
        <div className="mt-8 relative">
             <div className="mb-3 flex items-center justify-between relative px-2">
                <span className="text-[8px] md:text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">FM STEREO TUNER</span>
                
                {/* Compact Tactile Buttons - Integrated into Dial Frame */}
                <div className="flex items-center gap-[1px] bg-zinc-950 p-0.5 rounded-md border border-zinc-700 shadow-xl absolute left-1/2 -translate-x-1/2 -top-3 scale-90 md:scale-100 transition-all z-30">
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            const currentIndex = stations.findIndex(s => s.id === currentStation?.id);
                            const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
                            setStation(stations[prevIndex]);
                        }}
                        className="px-4 py-1.5 rounded-l-sm bg-gradient-to-b from-zinc-800 to-zinc-900 text-[10px] font-bold text-zinc-500 hover:text-orange-500 active:from-zinc-950 active:to-zinc-900 transition-all uppercase tracking-tighter border-r border-zinc-800"
                        title="Previous Station"
                    >
                        PREV
                    </button>
                    <button 
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            const currentIndex = stations.findIndex(s => s.id === currentStation?.id);
                            const nextIndex = (currentIndex + 1) % stations.length;
                            setStation(stations[nextIndex]);
                        }}
                        className="px-4 py-1.5 rounded-r-sm bg-gradient-to-b from-zinc-800 to-zinc-900 text-[10px] font-bold text-zinc-500 hover:text-orange-500 active:from-zinc-950 active:to-zinc-900 transition-all uppercase tracking-tighter"
                        title="Next Station"
                    >
                        NEXT
                    </button>
                </div>

                <span className={`text-[8px] md:text-[10px] font-mono uppercase tracking-[0.2em] ${isPlaying ? "text-red-500 animate-pulse" : "text-zinc-800"}`}>STEREO</span>
             </div>

             <Tuner 
                value={(Math.max(0, stations.findIndex(s => s.id === (currentStation?.id || stations[0].id))) / (stations.length - 1)) || 0}
                onChange={(val) => {
                    const idx = Math.round(val * (stations.length - 1));
                    const newStation = stations[idx];
                    if (newStation && newStation.id !== currentStation?.id) {
                         setStation(newStation);
                    }
                }}
             />
             
             <div className="flex justify-center mt-2">
                <span className="text-[9px] font-mono text-zinc-700 bg-zinc-900/30 px-2 py-0.5 rounded border border-zinc-800/30 uppercase tracking-[0.3em]">
                    Drag needle to tune
                </span>
             </div>
        </div>

      </motion.div>
    </div>
  );
};
