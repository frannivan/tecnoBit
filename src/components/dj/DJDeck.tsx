import React, { useEffect, useRef, useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useDJStore } from '../../store/useDJStore';
import { DraggableTrack } from './DraggableTrack';
import { Playlist } from './Playlist';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, History as HistoryIcon, Globe, Loader2, Music } from 'lucide-react';

export const DJDeck: React.FC = () => {
  const { 
    history, 
    playlist, 
    addToPlaylist, 
    sharedCrate, 
    isLoadingShared, 
    fetchSharedCrate, 
    uploadToSharedCrate 
  } = useDJStore();

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSharedCrate();
  }, [fetchSharedCrate]);

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
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
        for (const file of Array.from(files)) {
            if (!file.type.startsWith('audio/')) {
                console.warn(`File ${file.name} is not an audio file.`);
                continue;
            }
            await uploadToSharedCrate(file, {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'Shared User'
            });
        }
    } catch (e) {
        console.error("Upload failed:", e);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
        <div className="w-full max-w-6xl mx-auto p-4 mt-8 flex flex-col lg:flex-row gap-8">
            
            {/* Left: Track Pool (History & Shared Crate) */}
            <motion.div 
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="lg:w-1/3 flex flex-col gap-4 order-2 lg:order-1"
            >
                {/* Shared Crate / Upload Zone */}
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                    onDragLeave={() => setIsDraggingFile(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFile(false);
                        handleFileUpload(e.dataTransfer.files);
                    }}
                    className={`bg-zinc-900 rounded-lg p-6 border-2 border-dashed transition-all flex flex-col order-2 lg:order-1 relative min-h-[350px] ${isDraggingFile ? 'border-orange-500 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-zinc-800'}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-zinc-400 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                            <Globe size={14} className="text-orange-500" />
                            Shared Crate
                        </h3>
                        <div className="flex gap-2">
                            {isLoadingShared && <Loader2 size={14} className="animate-spin text-zinc-500" />}
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-orange-500 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Upload Shared Songs"
                            >
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            </button>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={(e) => handleFileUpload(e.target.files)}
                            accept="audio/*" 
                            multiple 
                            className="hidden" 
                        />
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {sharedCrate.length === 0 && !isLoadingShared ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center border border-zinc-800/50 rounded bg-black/20 py-12"
                                >
                                    <Upload className="text-zinc-700 mb-2" size={32} />
                                    <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Share music with the world</p>
                                    <p className="text-[9px] text-zinc-800 mt-1">DROP MP3s HERE</p>
                                </motion.div>
                            ) : (
                                sharedCrate.map(track => (
                                    <motion.div 
                                        layout
                                        key={track.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative group/shared"
                                    >
                                        <DraggableTrack track={track} />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/shared:opacity-100 p-1 text-orange-500/50 pointer-events-none">
                                            <Music size={12} />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                            <Loader2 className="animate-spin text-orange-500 mb-2" size={32} />
                            <p className="text-xs font-bold text-orange-500 uppercase tracking-tighter">Uploading to Cloud...</p>
                        </div>
                    )}
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
