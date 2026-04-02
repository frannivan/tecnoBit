import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDJStore, type Track } from '../../store/useDJStore';
import { DraggableTrack } from './DraggableTrack';
import { Playlist } from './Playlist';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Plus, History as HistoryIcon, Globe, Loader2, Music, Play, Pause, Trash2, Download } from 'lucide-react';
import { useRadioStore } from '../../store/useRadioStore';
import toast from 'react-hot-toast';

export const DJDeck: React.FC = () => {
  const { 
    history, 
    playlist, 
    addToPlaylist, 
    sharedCrate, 
    isLoadingShared, 
    fetchSharedCrate, 
    uploadMultipleToSharedCrate,
    offlineSets,
    initOfflineSets,
    saveCurrentPlaylistAsSet,
    loadOfflineSet,
    deleteOfflineSet,
    clearLocalCache,
    removeFromHistory,
    clearHistory,
    activeTrackId
  } = useDJStore();

  const { isPlaying, play, pause, setStation } = useRadioStore();

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingToLocal, setIsSavingToLocal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  const [uploadLabel, setUploadLabel] = useState('Scanning tracks...');
  const [savingLabel, setSavingLabel] = useState('Saving tracks...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSharedCrate();
    initOfflineSets();
  }, [fetchSharedCrate, initOfflineSets]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const items = Array.from(files).filter(f => f.type.startsWith('audio/'));
    if (items.length === 0) return;

    setIsUploading(true);

    try {
        const { extractMetadata, getAudioDuration } = await import('../../utils/extractMetadata');
        const uploadItems: { file: File, metadata: any }[] = [];
        const revocableUrls: string[] = [];

        for (const file of items) {
            const tempUrl = URL.createObjectURL(file);
            revocableUrls.push(tempUrl);

            setUploadLabel(`Scanning track ${uploadItems.length + 1} of ${items.length}...`);
            
            let metadata: any = {
                title: file.name.replace(/\.[^/.]+$/, ""),
                artist: 'Shared User'
            };

            try {
                const [tags, duration] = await Promise.all([
                    extractMetadata(file),
                    getAudioDuration(tempUrl)
                ]);
                
                metadata = {
                    ...metadata,
                    title: tags.title || metadata.title,
                    artist: tags.artist || metadata.artist,
                    artwork: tags.artwork,
                    duration: duration || 0
                };
            } catch (err) {
                console.warn("Metadata error for", file.name, err);
            }
            uploadItems.push({ file, metadata });
        }

        if (uploadItems.length > 0) {
            await uploadMultipleToSharedCrate(uploadItems, (current, total) => {
                setUploadLabel(`Uploading ${current}/${total}...`);
            });
        }

        revocableUrls.forEach(url => URL.revokeObjectURL(url));
    } catch (e) {
        console.error("Upload process failed:", e);
    } finally {
        setIsUploading(false);
        setUploadLabel('Scanning tracks...');
    }
  };

  const handleStandalonePlay = useCallback((track: Track) => {
    if (!track.audioUrl) return;
    
    useDJStore.getState().setActiveTrackId(track.id);

    setStation({
        id: track.id,
        name: track.title,
        streamUrl: track.audioUrl,
        genre: track.artist || 'Standalone',
        country: track.isShared ? 'Shared' : 'Local'
    });
    play();
  }, [setStation, play]);

  return (
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
                className={`bg-zinc-900 rounded-lg p-6 border-2 border-dashed transition-all flex flex-col order-1 lg:order-1 relative h-[450px] ${isDraggingFile ? 'border-orange-500 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-zinc-800'}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-400 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                        <Globe size={14} className="text-orange-500" />
                        Shared Crate
                    </h3>
                    <div className="flex gap-2 items-center">
                        {isLoadingShared && <Loader2 size={14} className="animate-spin text-zinc-500" />}
                        <button 
                            onPointerDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                            disabled={isUploading}
                            className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-orange-500 hover:bg-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Upload Shared Songs"
                        >
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
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
                                        className="relative group/shared mb-1.5"
                                    >
                                        <DraggableTrack 
                                            track={track} 
                                            onPlay={handleStandalonePlay} 
                                            addButtonIcon={Upload}
                                            extraActions={
                                                <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover/shared:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            try {
                                                                const url = new URL(track.audioUrl || '');
                                                                url.searchParams.set('download', `${track.title} - ${track.artist}.mp3`);
                                                                
                                                                const link = document.createElement('a');
                                                                link.href = url.toString();
                                                                link.setAttribute('download', `${track.title} - ${track.artist}.mp3`);
                                                                link.setAttribute('target', '_blank');
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                                
                                                                toast.success('Descargando a tu dispositivo...');
                                                            } catch (err) {
                                                                console.error("Download failed:", err);
                                                                window.open(track.audioUrl || '', '_blank');
                                                            }
                                                        }}
                                                        className="p-1 rounded bg-black/60 text-[#ccff00] hover:text-[#dfff4f] hover:bg-[#ccff00]/10 transition-colors pointer-events-auto"
                                                        title="Download track"
                                                    >
                                                        <Download size={12} />
                                                    </button>
                                                </div>
                                            }
                                        />
                                    </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>

                {isUploading && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
                            <p className="text-white font-medium">{uploadLabel}</p>
                            <p className="text-zinc-500 text-[10px] mt-2 italic uppercase tracking-widest opacity-60">High-fidelity processing...</p>
                        </div>
                    </div>
                )}
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex flex-col">
                        <h3 className="text-orange-500 uppercase tracking-widest text-lg font-bold glow-text">
                            Master Playlist
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <button
                                onClick={() => {
                                    setShowOffline(!showOffline);
                                    setShowHistory(false);
                                }}
                                className={`flex items-center gap-1.5 text-[10px] uppercase tracking-tighter font-bold transition-all px-2 py-0.5 rounded-full border ${showOffline ? 'bg-orange-500 border-orange-400 text-black' : 'text-zinc-500 border-zinc-800 hover:border-orange-500/50 hover:text-orange-400'}`}
                            >
                                <Music size={11} />
                                Offline
                            </button>
                            
                            <button
                                onClick={() => {
                                    setShowHistory(!showHistory);
                                    setShowOffline(false);
                                }}
                                className={`flex items-center gap-1.5 text-[10px] uppercase tracking-tighter font-bold transition-all px-2 py-0.5 rounded-full border ${showHistory ? 'bg-zinc-200 border-white text-black' : 'text-zinc-500 border-zinc-800 hover:border-zinc-400 hover:text-zinc-200'}`}
                            >
                                <HistoryIcon size={11} />
                                History
                            </button>

                            {playlist.length > 0 && (
                                <button
                                    onClick={async () => {
                                        const setName = prompt("Dale un nombre a tu Set Offline:", `Mi Set - ${new Date().toLocaleDateString()}`);
                                        if (!setName) return;

                                        setIsSavingToLocal(true);
                                        setSavingLabel('Procesando Set...');
                                        try {
                                            await saveCurrentPlaylistAsSet(setName);
                                        } finally {
                                            setIsSavingToLocal(false);
                                            setSavingLabel('Guardando tracks...');
                                        }
                                    }}
                                    disabled={isSavingToLocal || isUploading}
                                    className="flex items-center gap-1.5 text-[10px] text-[#ccff00] hover:text-[#dfff4f] transition-colors uppercase tracking-tighter font-bold group bg-black/40 px-2 py-0.5 rounded-full border border-zinc-800"
                                >
                                    <Download size={11} className="group-hover:animate-bounce" />
                                    Save Set
                                </button>
                            )}
                        </div>
                    </div>

                    {/* History Dropdown Overlay */}
                    <AnimatePresence>
                        {showHistory && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-20 right-6 left-6 bottom-24 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl z-40 p-4 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
                                    <h4 className="text-zinc-400 uppercase tracking-widest text-[10px] font-black flex items-center gap-2">
                                        <HistoryIcon size={12} className="text-orange-500" />
                                        Stream History
                                    </h4>
                                    <div className="flex gap-2">
                                        {history.length > 0 && (
                                            <button 
                                                onClick={() => clearHistory()}
                                                className="text-[9px] text-zinc-600 hover:text-red-500 uppercase tracking-tighter transition-colors font-bold"
                                            >
                                                Clear History
                                            </button>
                                        )}
                                        <button onClick={() => setShowHistory(false)} className="text-zinc-600 hover:text-white">
                                            <Plus size={14} className="rotate-45" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                                    {history.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-800 py-8">
                                            <HistoryIcon size={32} className="mb-2 opacity-20" />
                                            <p className="text-[10px] uppercase tracking-widest font-bold">No history yet</p>
                                        </div>
                                    ) : (
                                        history.map((track, idx) => (
                                            <div key={`${track.id}-${track.timestamp}-${idx}`}>
                                                <DraggableTrack 
                                                    track={track} 
                                                    onPlay={handleStandalonePlay} 
                                                    hideAddButton 
                                                    extraActions={
                                                        <button 
                                                            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); removeFromHistory(track.id); }}
                                                            onClick={(e) => { e.stopPropagation(); removeFromHistory(track.id); }}
                                                            className="p-1 rounded bg-black/40 text-zinc-500 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 relative z-10 pointer-events-auto"
                                                            title="Remove History"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    }
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Offline Crate Dropdown Overlay */}
                    <AnimatePresence>
                        {showOffline && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="absolute top-20 right-6 left-6 bottom-24 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl z-40 p-4 flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-4 border-b border-zinc-900 pb-2">
                                    <h4 className="text-zinc-500 uppercase tracking-widest text-[10px] font-black flex items-center gap-2">
                                        <Music size={12} className="text-orange-500" />
                                        Personal Crate (Offline)
                                    </h4>
                                    <div className="flex gap-2">
                                        {offlineSets.length > 0 && (
                                            <button 
                                                onClick={() => clearLocalCache()}
                                                className="text-[9px] text-zinc-600 hover:text-red-500 uppercase tracking-tighter transition-colors font-bold"
                                            >
                                                Clean Cache
                                            </button>
                                        )}
                                        <button onClick={() => setShowOffline(false)} className="text-zinc-600 hover:text-white">
                                            <Plus size={14} className="rotate-45" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                    {offlineSets.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-800">
                                            <Music size={32} className="mb-2 opacity-20" />
                                            <p className="text-[10px] uppercase tracking-widest font-bold">No saved sets</p>
                                        </div>
                                    ) : (
                                        offlineSets.map(set => (
                                            <div 
                                                key={set.id}
                                                className="bg-black/40 rounded-lg p-3 border border-zinc-800/50 hover:bg-zinc-900 transition-colors group/set"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <h5 className="font-bold text-zinc-200 text-sm">{set.name}</h5>
                                                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{set.tracks.length} tracks • {new Date(set.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover/set:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => loadOfflineSet(set.id)}
                                                            className="p-1.5 rounded bg-[#ccff00] text-black hover:bg-[#dfff4f] transition-colors"
                                                            title="Load Set into Playlist"
                                                        >
                                                            <Play size={12} className="fill-current" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if(confirm(`¿Eliminar set "${set.name}"?`)) {
                                                                    deleteOfflineSet(set.id);
                                                                }
                                                            }}
                                                            className="p-1.5 rounded bg-black/60 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                            title="Delete Set"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                {/* Mini track preview */}
                                                <div className="flex gap-1 overflow-hidden">
                                                    {set.tracks.slice(0, 5).map((_, i) => (
                                                        <div key={i} className="h-1 flex-1 bg-zinc-800/50 rounded-full"></div>
                                                    ))}
                                                    {set.tracks.length > 5 && <span className="text-[8px] text-zinc-600 font-bold ml-1">+{set.tracks.length - 5}</span>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                {isSavingToLocal && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-50">
                                        <div className="text-center">
                                            <Loader2 className="w-8 h-8 text-[#ccff00] animate-spin mx-auto mb-2" />
                                            <p className="text-[#ccff00] text-[10px] font-bold uppercase tracking-wider">{savingLabel}</p>
                                            <p className="text-zinc-600 text-[8px] mt-1 italic uppercase opacity-50">Local persistence...</p>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                
                <div className="flex items-center gap-4 sm:ml-auto">
                    {/* Hardware-style Transport Controls */}
                    <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5 shadow-inner">
                        <button 
                            onClick={() => pause()}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${!isPlaying ? 'bg-orange-600/20 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)] text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
                            title="Pause"
                        >
                            <Pause size={14} fill={!isPlaying ? "currentColor" : "none"} />
                        </button>
                        <button 
                            onClick={() => {
                                if (!isPlaying) {
                                    if (playlist.length > 0 && (!activeTrackId || useRadioStore.getState().currentStation?.id !== activeTrackId)) {
                                        handleStandalonePlay(playlist[0]);
                                    } else {
                                        play();
                                    }
                                }
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${isPlaying ? 'bg-orange-500 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.5)] text-black' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-orange-500/80'}`}
                            title="Play"
                        >
                            <Play size={18} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </div>

            <Playlist tracks={playlist} />
            
            <div className="mt-4 flex justify-between items-center text-zinc-600 font-mono text-xs">
                <span>AUTO-SYNC: ON</span>
                <span>QUANTIZE: 1/4</span>
            </div>
        </motion.div>
        
    </div>
  );
};
