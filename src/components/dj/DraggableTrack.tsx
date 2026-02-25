import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { type Track, useDJStore } from '../../store/useDJStore';
import { GripVertical, Music } from 'lucide-react';

interface DraggableTrackProps {
  track: Track;
}

export const DraggableTrack: React.FC<DraggableTrackProps> = ({ track }) => {
  const addToPlaylist = useDJStore(state => state.addToPlaylist);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: track.id,
    data: track
  });

  const style = {
    transform: CSS.Translate.toString(transform),
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
        style={style} 
        {...listeners} 
        {...attributes}
        onDoubleClick={() => addToPlaylist(track)}
        title="Double-click to add to playlist"
        className={`bg-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-2 rounded-sm flex items-center justify-between border border-zinc-800 hover:border-zinc-600 cursor-grab active:cursor-grabbing mb-1.5 transition-all group ${isDragging ? 'opacity-50 ring-2 ring-orange-500/50' : ''}`}
    >
        <div className="flex items-center gap-3 min-w-0 flex-1">
            <GripVertical className="text-zinc-800 group-hover:text-zinc-600 transition-colors" size={14} />
            
            {/* Artwork Thumbnail */}
            {track.artwork ? (
                <div className="w-8 h-8 rounded-sm overflow-hidden bg-zinc-800 border border-zinc-700 flex-shrink-0">
                    <img src={track.artwork} alt={track.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                </div>
            ) : (
                <div className="w-8 h-8 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                    <Music size={12} className="text-zinc-700" />
                </div>
            )}

            <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 truncate">{track.title}</span>
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono truncate">{track.artist}</span>
            </div>
        </div>

        {/* Metadata: Duration */}
        <div className="text-[10px] font-mono text-zinc-700 group-hover:text-orange-500/50 transition-colors px-2">
            {formatDuration(track.duration)}
        </div>
    </div>
  );
};
