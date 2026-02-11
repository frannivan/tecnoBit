import React from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useDJPlaylist } from '../../hooks/useDJPlaylist';
import { DraggableTrack } from './DraggableTrack';
import { Playlist } from './Playlist';
import { motion } from 'framer-motion';

export const DJDeck: React.FC = () => {
  const { history, playlist, addToPlaylist } = useDJPlaylist();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'playlist-drop-zone') {
        const track = active.data.current as any; // Cast to Track
        if (track) {
            addToPlaylist(track);
        }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
        <div className="w-full max-w-6xl mx-auto p-4 mt-8 flex flex-col lg:flex-row gap-8">
            
            {/* Left: Track History (Pool) */}
            <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:w-1/3 bg-zinc-900 rounded-lg p-6 border-t border-zinc-700 shadow-xl max-h-[500px] flex flex-col"
            >
                <h3 className="text-zinc-400 uppercase tracking-widest text-sm font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    History / Crates
                </h3>
                <div className="overflow-y-auto pr-2 space-y-2 flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {history.map(track => (
                        <DraggableTrack key={track.id} track={track} />
                    ))}
                </div>
            </motion.div>

            {/* Right: DJ Controller / Playlist */}
            <motion.div 
                 initial={{ x: 50, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="flex-1 bg-zinc-950 rounded-lg p-6 border-2 border-zinc-800 shadow-2xl relative"
            >
                {/* Controller Decor */}
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-zinc-700"></div>
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-zinc-700"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-zinc-700"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-zinc-700"></div>

                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-orange-500 uppercase tracking-widest text-lg font-bold glow-text">
                        Master Playlist
                    </h3>
                    <div className="flex gap-2">
                        <div className="w-16 h-1 bg-orange-500/50 rounded"></div>
                        <div className="w-16 h-1 bg-red-500/50 rounded"></div>
                    </div>
                </div>

                <Playlist tracks={playlist} />
                
                <div className="mt-4 flex justify-between items-center text-zinc-600 font-mono text-xs">
                    <span>AUTO-SYNC: ON</span>
                    <span>QUANTIZE: 1/4</span>
                </div>
            </motion.div>
            
        </div>
    </DndContext>
  );
};
