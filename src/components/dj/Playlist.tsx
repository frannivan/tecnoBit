import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { type Track, useDJStore } from '../../store/useDJStore';
import { Trash2, Play, Disc } from 'lucide-react';
import { useDJPlaylist } from '../../hooks/useDJPlaylist';
import { useRadioStore } from '../../store/useRadioStore';
import { motion } from 'framer-motion';
import { WaveformPlayer } from './WaveformPlayer';

interface PlaylistProps {
    tracks: Track[];
}

export const Playlist: React.FC<PlaylistProps> = ({ tracks }) => {
  const [selectedTrackId, setSelectedTrackId] = React.useState<string | null>(null);
  const { isOver, setNodeRef } = useDroppable({
    id: 'playlist-drop-zone',
  });
  
  const { removeFromPlaylist } = useDJPlaylist();
  const { setStation, currentStation, isPlaying } = useRadioStore();
  const setCurrentPlaylistIndex = useDJStore((state) => state.setCurrentPlaylistIndex);

  const handlePlayTrack = (track: Track, index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!track.audioUrl) return;
      
      setCurrentPlaylistIndex(index);
      setStation({
          id: track.id,
          name: track.title,
          streamUrl: track.audioUrl,
          genre: track.artist,
          country: 'Playlist'
      });
  };

  const formatDuration = (seconds?: number) => {
      if (!seconds) return '--:--';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
        ref={setNodeRef} 
        className={`flex-1 min-h-[300px] bg-black/40 rounded border-2 border-dashed p-4 transition-colors relative overflow-y-auto ${isOver ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700'}`}
    >
        {tracks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 pointer-events-none">
                <div className="text-center">
                    <Disc className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <span className="block text-lg font-bold">DROP TRACKS HERE</span>
                    <span className="text-xs">Build your set</span>
                </div>
            </div>
        ) : (
            <div className="space-y-1">
                {tracks.map((track, index) => {
                    const isTrackPlaying = currentStation?.id === track.id;
                    const isSelected = selectedTrackId === track.id || isTrackPlaying;

                    return (
                        <div 
                            key={track.id} 
                            onClick={() => setSelectedTrackId(track.id)}
                            className={`
                                rounded-sm border-l-2 transition-all overflow-hidden cursor-pointer group
                                ${isSelected 
                                    ? 'bg-zinc-800/90 border-orange-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]' 
                                    : 'bg-black/20 border-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/40'
                                }
                                ${isTrackPlaying && isPlaying ? 'ring-1 ring-orange-500/20' : ''}
                            `}
                        >
                            <div className={`flex items-center justify-between gap-3 transition-all ${isSelected ? 'p-3 md:p-4' : 'p-1.5 px-3'}`}>
                                {/* Track Info */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className={`font-mono text-[10px] w-5 flex-shrink-0 text-center ${isSelected ? 'text-orange-500 font-bold' : 'text-zinc-700'}`}>
                                        {(index + 1).toString().padStart(2, '0')}
                                    </span>
                                    
                                    {/* Artwork */}
                                    {isSelected && track.artwork && (
                                        <motion.div 
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded bg-zinc-800 overflow-hidden border border-zinc-700 shadow-lg"
                                        >
                                            <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
                                        </motion.div>
                                    )}

                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isSelected && (
                                                <button 
                                                    onClick={(e) => handlePlayTrack(track, index, e)}
                                                    className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${isTrackPlaying && isPlaying ? 'bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-zinc-700 text-zinc-300 hover:bg-orange-600 hover:text-white'}`}
                                                >
                                                    {isTrackPlaying && isPlaying ? (
                                                         <div className="space-x-[1px] flex items-end h-2.5">
                                                            <div className="w-0.5 bg-black h-full animate-[bounce_1s_infinite]"></div>
                                                            <div className="w-0.5 bg-black h-2/3 animate-[bounce_1.2s_infinite]"></div>
                                                            <div className="w-0.5 bg-black h-1/2 animate-[bounce_0.8s_infinite]"></div>
                                                         </div>
                                                    ) : (
                                                        <Play size={12} fill="currentColor" />
                                                    )}
                                                </button>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className={`text-sm font-bold truncate tracking-tight ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                                                    {track.title}
                                                </div>
                                                {isSelected && (
                                                    <div className="text-[10px] text-zinc-500 truncate uppercase tracking-widest font-mono">
                                                        {track.artist}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Duration - Always visible but styled differently */}
                                    <div className={`text-[10px] font-mono flex-shrink-0 text-right ${isSelected ? 'text-orange-400' : 'text-zinc-700'}`}>
                                        {formatDuration(track.duration)}
                                    </div>
                                </div>

                                {/* Right Side Actions: Waveform (only when playing) */}
                                <div className="flex items-center gap-2">
                                    {isSelected && isTrackPlaying && isPlaying && (
                                        <div className="w-32 hidden xl:block">
                                            <WaveformPlayer trackId={track.id} compact={true} />
                                        </div>
                                    )}
                                    
                                    {isSelected && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromPlaylist(track.id);
                                            }}
                                            className="text-zinc-700 hover:text-red-500 p-1.5 transition-colors"
                                            title="Remove"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
