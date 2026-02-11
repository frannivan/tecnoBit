import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { type Track } from '../../store/useDJStore';
import { Trash2 } from 'lucide-react';
import { useDJPlaylist } from '../../hooks/useDJPlaylist';

interface PlaylistProps {
    tracks: Track[];
}

export const Playlist: React.FC<PlaylistProps> = ({ tracks }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'playlist-drop-zone',
  });
  
  const { removeFromPlaylist } = useDJPlaylist();

  return (
    <div 
        ref={setNodeRef} 
        className={`flex-1 min-h-[300px] bg-black/40 rounded border-2 border-dashed p-4 transition-colors relative overflow-y-auto ${isOver ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-700'}`}
    >
        {tracks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 pointer-events-none">
                <p className="text-center">
                    <span className="block text-lg font-bold">DROP TRACKS HERE</span>
                    <span className="text-xs">Build your set</span>
                </p>
            </div>
        ) : (
            <div className="space-y-2">
                {tracks.map((track, index) => (
                    <div key={track.id} className="bg-zinc-900 p-3 rounded flex items-center justify-between border-l-4 border-orange-500 group">
                        <div className="flex items-center gap-4">
                            <span className="text-zinc-600 font-mono text-xs w-4">{index + 1}</span>
                            <div>
                                <div className="text-sm font-bold text-orange-50">{track.title}</div>
                                <div className="text-xs text-orange-500/60">{track.artist}</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => removeFromPlaylist(track.id)}
                            className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
