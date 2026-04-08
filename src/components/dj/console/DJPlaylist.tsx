import React, { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Music, Plus, Database, Loader2 } from 'lucide-react';
import { useDJStore, type Track } from '../../../store/useDJStore';
import { saveTrackBlob } from '../../../utils/indexedDB';

interface Props {
  selectedTrackId: string | null;
  onSelect: (track: Track) => void;
  deckAId?: string;
  deckBId?: string;
}

export const DJPlaylist: React.FC<Props> = ({ selectedTrackId, onSelect }) => {
  const { playlist, sharedCrate, addToPlaylist, fetchSharedCrate, isLoadingShared, analyzingTrackIds } = useDJStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch Shared Crate on mount
  useEffect(() => {
    fetchSharedCrate();
  }, [fetchSharedCrate]);

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const trackId = Math.random().toString(36).substr(2, 9);
      const track: Track = {
        id: trackId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: 'Local File',
        timestamp: Date.now(),
        audioUrl: URL.createObjectURL(file) 
      };
      
      try {
        // Guardar el blob inmediatamente para asegurar persistencia
        await saveTrackBlob({ id: trackId, blob: file, name: track.title, type: file.type });
      } catch (err) {
        console.error("Local save failed:", err);
      }
      
      addToPlaylist(track);
    }
  };

  const currentTracks = [...playlist, ...sharedCrate].sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className="w-full h-full flex flex-col font-sans">
      {/* Playlist Header */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Music size={16} className="text-emerald-500" />
                </div>
                <div className="flex items-center gap-4">
                        <div className="flex flex-col landscape:hidden sm:landscape:hidden md:landscape:flex">
                            <h3 className="text-xs font-black text-white/90 uppercase tracking-[0.3em]">Master Crate</h3>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{playlist.length + sharedCrate.length} Total Tracks</p>
                        </div>
                    {currentTracks.length > 0 && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(new CustomEvent('radio-play-track', { detail: currentTracks[0] }));
                            }}
                            className="flex items-center gap-2 px-3 py-2 md:px-6 md:py-2.5 bg-emerald-500 text-black rounded-full shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-105 active:scale-95 transition-all outline-none border-none border-0 landscape:hidden sm:landscape:hidden md:landscape:flex"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-black">
                                <span className="hidden md:inline">PLAY CRATE ON RADIO</span>
                                <span className="md:hidden">PLAY</span>
                            </span>
                            <span className="text-lg pb-0.5">▶</span>
                        </button>
                    )}
                </div>
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
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 hover:border-emerald-500/50 text-white/70 hover:text-white text-[10px] font-black rounded-full transition-all hover:scale-105 shadow-xl uppercase tracking-wider group landscape:hidden sm:landscape:hidden md:landscape:flex"
        >
            <Plus size={14} className="text-emerald-500 group-hover:scale-125 transition-transform" /> Import Tracks
        </button>
      </div>

      {/* Playlist Content (Table) */}
      <div className="flex-1 overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 landscape:hidden sm:landscape:hidden md:landscape:table-header-group">
            <tr className="border-b border-white/5">
              <th className="px-2 md:px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest w-10 text-center">#</th>
              <th className="px-2 md:px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Canción</th>
              <th className="px-2 md:px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center hidden sm:table-cell">BPM</th>
            </tr>
          </thead>
          <tbody>
            {currentTracks.length === 0 ? (
                <tr>
                    <td colSpan={3} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-10">
                            <Database size={60} />
                            <p className="text-[12px] font-black uppercase tracking-[0.8em]">Library Syncing...</p>
                        </div>
                    </td>
                </tr>
            ) : (
              currentTracks.map((track, idx) => {
                const isAnalyzing = analyzingTrackIds.has(track.id);
                const isSelected = selectedTrackId === track.id;
                return (
                    <tr 
                      key={track.id} 
                      onClick={() => onSelect(track)}
                      className={`border-b border-white/[0.02] transition-all cursor-pointer ${isSelected ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500' : 'hover:bg-white/[0.03]'}`}
                    >
                        <td className={`px-2 md:px-4 py-3 text-[10px] font-mono text-center ${isSelected ? 'text-emerald-500 font-black' : 'text-zinc-700 font-bold'}`}>
                           {(idx + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-2 md:px-4 py-3">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg bg-zinc-900 flex items-center justify-center border shrink-0 transition-all ${isSelected ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-white/5'}`}>
                                    {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover rounded-lg" alt="" /> : <Music size={14} className={isSelected ? 'text-emerald-500' : 'text-zinc-700'} />}
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate ${isSelected ? 'text-emerald-400' : 'text-white/90'}`}>{track.title}</span>
                                    <span className={`text-[8px] md:text-[9px] font-bold uppercase italic ${isSelected ? 'text-emerald-500/70' : 'text-zinc-500'}`}>{track.artist || 'Unknown Artist'}</span>
                                    {/* LOAD BUTTONS — always visible for mobile */}
                                    <div className="flex gap-2 mt-1" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={async () => {
                                                // Unlock iOS audio session (switches from ambient to playback mode)
                                                const PULSE = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";
                                                const unblocker = new Audio(PULSE);
                                                unblocker.play().catch(() => {});
                                                await Tone.start();
                                                await Tone.context.resume();
                                                Tone.Destination.mute = false;
                                                window.dispatchEvent(new CustomEvent('dj-load-deck-a', { detail: track }));
                                            }}
                                            className="px-2 py-0.5 md:px-2.5 md:py-1 bg-emerald-500 text-black text-[7px] md:text-[8px] font-black rounded-md active:scale-95 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                        >
                                            LOAD A
                                        </button>
                                        <button
                                            onClick={async () => {
                                                // Unlock iOS audio session (switches from ambient to playback mode)
                                                const PULSE = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";
                                                const unblocker = new Audio(PULSE);
                                                unblocker.play().catch(() => {});
                                                await Tone.start();
                                                await Tone.context.resume();
                                                Tone.Destination.mute = false;
                                                window.dispatchEvent(new CustomEvent('dj-load-deck-b', { detail: track }));
                                            }}
                                            className="px-2 py-0.5 md:px-2.5 md:py-1 bg-orange-500 text-black text-[7px] md:text-[8px] font-black rounded-md active:scale-95 transition-transform shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                                        >
                                            LOAD B
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-2 md:px-4 py-3 text-center">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center gap-1">
                                    <Loader2 size={10} className="text-orange-500 animate-spin" />
                                    <span className="text-[6px] text-orange-500/50 font-bold uppercase">WAIT</span>
                                </div>
                            ) : track.bpm ? (
                                <div className="text-[8px] font-black text-emerald-500 group-hover:scale-110 transition-transform">ANALYZED</div>
                            ) : (
                                <div className="text-[8px] font-black text-zinc-800">QUEUED</div>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                            <span className={`text-[11px] font-black font-mono ${isSelected ? 'text-emerald-400' : 'text-emerald-500/80'}`}>
                                {track.bpm ? track.bpm.toFixed(1) : '---'}
                            </span>
                        </td>
                    </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Status */}
      <div className="px-8 py-3 bg-zinc-950/90 border-t border-white/5 flex justify-between items-center backdrop-blur-xl landscape:hidden sm:landscape:hidden md:landscape:flex">
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
          <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] italic">TecnoBit Advanced Media Engine v1.5.40</p>
      </div>
    </div>
  );
};
