import React, { useRef, useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useDJStore } from '../../store/useDJStore';
import { saveTrackBlob } from '../../utils/indexedDB';
import { DraggableTrack } from './DraggableTrack';
import { Playlist } from './Playlist';
import { motion } from 'framer-motion';
import { Upload, Plus, Trash2, History as HistoryIcon, HardDrive } from 'lucide-react';

export const DJDeck: React.FC = () => {
  const { history, playlist, addToPlaylist, userCrate, addToUserCrate, removeFromUserCrate } = useDJStore();
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === 'playlist-drop-zone') {
        const track = active.data.current as any;
        if (track) {
            addToPlaylist(track);
        }
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
        if (!file.type.startsWith('audio/')) continue;

        const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const trackData = {
            id,
            blob: file,
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            type: file.type
        };

        try {
            await saveTrackBlob(trackData);
            
            addToUserCrate({
                id,
                title: trackData.name,
                artist: 'Local',
                timestamp: Date.now(),
                audioUrl: URL.createObjectURL(file),
                duration: 0
            });
        } catch (e) {
            console.error("Failed to save track:", e);
        }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
        <div className="w-full max-w-6xl mx-auto p-4 mt-8 flex flex-col lg:flex-row gap-8">
            
            {/* Left: Track Pool (History & Local Crate) */}
            <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="lg:w-1/3 flex flex-col gap-4 order-2 lg:order-1"
            >
                {/* Local Crate / Upload Zone */}
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        handleFileUpload(e.dataTransfer.files);
                    }}
                    className={`bg-zinc-900 rounded-lg p-6 border-2 border-dashed transition-all flex flex-col order-2 lg:order-1 ${isDraggingFile ? 'border-orange-500 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-zinc-800'}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-400 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                            <HardDrive size={14} className="text-orange-500" />
                            Personal Crate
                        </h3>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-orange-500 hover:bg-zinc-700 transition-all"
                            title="Upload Songs"
                        >
                            <Plus size={16} />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={(e) => handleFileUpload(e.target.files)}
                            accept="audio/*" 
                            multiple 
                            className="hidden" 
                        />
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {userCrate.length === 0 ? (
                            <div className="py-8 text-center border border-zinc-800/50 rounded bg-black/20">
                                <Upload className="mx-auto text-zinc-700 mb-2" size={24} />
                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Drop MP3s here</p>
                            </div>
                        ) : (
                            userCrate.map(track => (
                                <div key={track.id} className="relative group/local">
                                    <DraggableTrack track={track} />
                                    <button 
                                        onClick={() => removeFromUserCrate(track.id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/local:opacity-100 p-1 text-zinc-600 hover:text-red-500 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* History Block */}
                <div className="bg-zinc-900 rounded-lg p-6 border-t border-zinc-700 shadow-xl flex-1 flex flex-col min-h-[200px] order-1 lg:order-2">
                    <h3 className="text-zinc-400 uppercase tracking-widest text-xs font-bold mb-4 flex items-center gap-2">
                        <HistoryIcon size={14} className="text-zinc-600" />
                        Stream History
                    </h3>
                    <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar">
                        {history.map(track => (
                            <DraggableTrack key={track.id} track={track} />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Right: DJ Controller / Playlist */}
            <motion.div 
                 initial={{ x: 50, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="flex-1 bg-zinc-950 rounded-lg p-6 border-2 border-zinc-800 shadow-2xl relative order-1 lg:order-2"
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
