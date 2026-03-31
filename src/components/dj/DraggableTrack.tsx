import React, { useRef, memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { type Track, useDJStore } from '../../store/useDJStore';
import { GripVertical, Music, Plus, type LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface DraggableTrackProps {
  track: Track;
  onPlay?: (track: Track) => void;
  extraActions?: React.ReactNode;
  hideAddButton?: boolean;
  addButtonIcon?: LucideIcon;
}

export const DraggableTrack: React.FC<DraggableTrackProps> = memo(({ track, onPlay, extraActions, hideAddButton, addButtonIcon: AddButtonIcon = Plus }) => {
  const addToPlaylist = useDJStore(state => state.addToPlaylist);
  const lastTapRef = useRef<number>(0);
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

  const handleDuplicate = () => {
      toast.error('Ya existe en la playlist', { id: `dup-${track.id}`, icon: 'ℹ️' });
      const el = document.getElementById(`playlist-track-${track.id}`);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-orange-500', 'bg-orange-500/20');
          setTimeout(() => el.classList.remove('ring-2', 'ring-orange-500', 'bg-orange-500/20'), 1000);
      }
  };

  const handleAction = () => {
    const added = addToPlaylist(track);
    if (added) {
        toast.success('Añadida a Master Playlist', { id: `add-${track.id}` });
    } else {
        handleDuplicate();
    }
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes}
        onPointerDown={() => {
            const now = Date.now();
            
            if (now - lastTapRef.current < 300) {
                // Double tap detected -> Trigger action
                handleAction();
                lastTapRef.current = 0; // Reset
            } else {
                lastTapRef.current = now;
            }
        }}
        title="Double-click to add to playlist"
        className={`bg-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-2 h-[52px] rounded-sm flex items-center justify-between border border-zinc-800 hover:border-zinc-600 cursor-grab active:cursor-grabbing mb-1.5 transition-all group ${isDragging ? 'opacity-50 ring-2 ring-orange-500/50' : ''}`}
    >
        <div className="flex items-center gap-3 min-w-0 flex-1">
            <GripVertical className="text-zinc-800 group-hover:text-zinc-600 transition-colors" size={14} />
            
            {/* Play Button Overlay on Artwork or just separate button */}
            <div className="relative group/play flex-shrink-0">
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
                
                {onPlay && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlay(track);
                        }}
                        className="absolute inset-0 bg-orange-500/80 text-black items-center justify-center hidden group-hover/play:flex transition-all rounded-sm"
                        title="Play Now"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex flex-col min-w-0 flex-1 relative group/text overflow-hidden justify-center">
                <div className="flex items-start">
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-zinc-200 truncate w-full leading-snug">
                        {track.title}
                    </span>
                </div>
                <div className="flex items-start">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono truncate w-full leading-tight opacity-80">
                        {track.artist}
                    </span>
                </div>
            </div>
        </div>

        {/* Metadata: Duration and Add Button */}
        <div className="flex items-center gap-1.5 px-1 ml-auto shrink-0">
            <div className="text-[10px] font-mono text-zinc-700 group-hover:text-orange-500/50 transition-colors hidden sm:block">
                {formatDuration(track.duration)}
            </div>
            {extraActions}
            {!hideAddButton && (
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        const added = addToPlaylist(track); 
                        if (added) {
                            toast.success('Añadida a Master Playlist', { id: `add-${track.id}` });
                        } else {
                            handleDuplicate();
                        }
                    }}
                    className="p-1 rounded bg-black/40 text-zinc-500 hover:text-orange-500 focus:text-orange-500 hover:bg-orange-500/10 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10 relative pointer-events-auto cursor-pointer"
                    title="Add to Playlist"
                >
                    <AddButtonIcon size={14} />
                </button>
            )}
        </div>
    </div>
  );
});

DraggableTrack.displayName = 'DraggableTrack';
