import React, { useState, useRef, useEffect } from 'react';
import { Music, Plus, Globe, Clock, Database, Loader2 } from 'lucide-react';
import { useDJStore, type Track } from '../../../store/useDJStore';

interface Props {
  selectedTrackId: string | null;
  onSelect: (track: Track) => void;
  analyzingTrackIds: Set<string>;
  deckAId?: string;
  deckBId?: string;
}

export const DJPlaylist: React.FC<Props> = ({ selectedTrackId, onSelect, analyzingTrackIds, deckAId, deckBId }) => {
  const { playlist, sharedCrate, history, addToPlaylist, fetchSharedCrate, isLoadingShared } = useDJStore();
  const [activeTab, setActiveTab] = useState<'playlist' | 'shared'>('playlist');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch Shared Crate on mount
  useEffect(() => {
    fetchSharedCrate();
  }, [fetchSharedCrate]);

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Para la Master Playlist local
    files.forEach(file => {
      const track: Track = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        timestamp: Date.now(),
        audioUrl: URL.createObjectURL(file) 
      };
      addToPlaylist(track);
    });
  };

  const currentTracks = activeTab === 'playlist' ? playlist : sharedCrate;

  return (
    <div className="w-full h-full flex flex-col font-sans">
      {/* Playlist Header */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Music size={16} className="text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-xs font-black text-white/90 uppercase tracking-[0.3em]">Master Crate</h3>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{playlist.length + sharedCrate.length} Total Tracks</p>
                </div>
            </div>

            {/* Tab Selectors */}
            <div className="flex gap-1 bg-black/40 p-1 rounded-full border border-white/5 ml-4">
                <button 
                  onClick={() => setActiveTab('playlist')}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'playlist' ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                </button>
                <button 
                  onClick={() => setActiveTab('shared')}
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'shared' ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'text-zinc-500 hover:text-white'}`}
                >
                  <div className="flex items-center gap-2"><Globe size={12}/> Shared Crate</div>
                </button>
            </div>
        </div>
        
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAddFiles} 
            multiple 
            accept="audio/*" 
            className="hidden" 
        />
        
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 hover:border-emerald-500/50 text-white/70 hover:text-white text-[10px] font-black rounded-full transition-all hover:scale-105 shadow-xl uppercase tracking-wider group"
        >
            <Plus size={14} className="text-emerald-500 group-hover:scale-125 transition-transform" /> Import Tracks
        </button>
      </div>

      {/* Playlist Content (Table) */}
      <div className="flex-1 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10">
            <tr className="border-b border-white/5">
              <th className="px-8 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-12 text-center">Pos</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Metadata</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">BPM / Length</th>
              <th className="px-8 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentTracks.length === 0 ? (
                <tr>
                    <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-10">
                            <Database size={60} />
                            <p className="text-[12px] font-black uppercase tracking-[0.8em]">Library Syncing...</p>
                        </div>
                    </td>
                </tr>
            ) : (
              currentTracks.map((track, idx) => {
                const isSelected = selectedTrackId === track.id;
                const isAnalyzing = analyzingTrackIds.has(track.id);
                const isLoaded = deckAId === track.id || deckBId === track.id;
                const isPlayed = history.some(h => h.id === track.id);
                return (
                    <tr 
                      key={track.id} 
                      onClick={() => onSelect(track)}
                      className={`border-b border-white/[0.02] transition-all cursor-pointer group ${isSelected ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' : 'hover:bg-white/[0.03]'}`}
                    >
                        <td className={`px-8 py-4 text-[10px] font-mono transition-colors text-center ${isSelected ? 'text-emerald-500 font-black' : 'text-zinc-700 font-bold group-hover:text-emerald-500'}`}>
                          {isSelected ? '▶' : (idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-4 py-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border transition-all ${isSelected ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/5 shadow-inner'}`}>
                                    {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover rounded-lg" alt="" /> : <Music size={14} className={isSelected ? 'text-emerald-500' : 'text-zinc-700'} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-[11px] font-black transition-colors uppercase tracking-widest truncate max-w-[350px] ${isSelected ? 'text-emerald-400' : 'text-white/90 group-hover:text-white'}`}>{track.title}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-tighter italic ${isSelected ? 'text-emerald-500/70' : 'text-zinc-500'}`}>{track.artist || 'Unknown Artist'}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center">
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                        <Loader2 size={10} className="text-emerald-500 animate-spin" />
                                        <span className="text-[7px] font-black text-emerald-500/50 uppercase">Analysis...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className={`text-[11px] font-black font-mono ${isSelected ? 'text-emerald-400' : 'text-emerald-500/80'}`}>{track.bpm ? track.bpm.toFixed(2) : '---'}</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Clock size={8}/> {Math.floor((track.duration || 0) / 60)}:{(Math.round((track.duration || 0) % 60)).toString().padStart(2, '0')}</span>
                                    </>
                                )}
                            </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                            {isSelected ? (
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] animate-pulse">Ready to Load</span>
                            ) : isAnalyzing ? (
                                <span className="text-[9px] font-black text-emerald-400/30 uppercase tracking-[0.2em]">Processing</span>
                            ) : isPlayed ? (
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center justify-end gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div> Played</span>
                            ) : isLoaded ? (
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${deckAId === track.id ? 'text-emerald-500' : 'text-orange-500'}`}>On Air / Loaded</span>
                            ) : (
                                <span className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.2em] group-hover:text-zinc-600 transition-colors">{track.bpm ? 'Analyzed' : 'Idle'}</span>
                            )}
                        </td>
                    </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Status */}
      <div className="px-8 py-3 bg-zinc-950/90 border-t border-white/5 flex justify-between items-center backdrop-blur-xl">
          <div className="flex gap-6 items-center">
              <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLoadingShared ? 'bg-orange-500 animate-ping' : 'bg-emerald-500'}`}></div>
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono">{isLoadingShared ? 'Syncing...' : 'System Online'}</span>
              </div>
              <div className="h-4 w-px bg-white/5"></div>
              <div className="flex gap-2">
                  <div className="w-10 h-1 bg-emerald-500/20 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-emerald-500"></div></div>
                  <div className="w-10 h-1 bg-orange-500/20 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-orange-500"></div></div>
              </div>
          </div>
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] italic">TecnoBit Advanced Media Engine v2.0</p>
      </div>
    </div>
  );
};
