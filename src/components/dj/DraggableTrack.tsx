import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { type Track } from '../../store/useDJStore';
import { GripVertical, Music } from 'lucide-react';

interface DraggableTrackProps {
  track: Track;
}

export const DraggableTrack: React.FC<DraggableTrackProps> = ({ track }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: track.id,
    data: track
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...listeners} 
        {...attributes}
        className={`bg-zinc-800 p-3 rounded flex items-center justify-between border border-zinc-700 hover:border-zinc-500 cursor-grab active:cursor-grabbing mb-2 shadow-sm ${isDragging ? 'opacity-50' : ''}`}
    >
        <div className="flex items-center gap-3">
            <GripVertical className="text-zinc-600" size={16} />
            <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-200">{track.title}</span>
                <span className="text-xs text-zinc-500">{track.artist}</span>
            </div>
        </div>
        <Music size={16} className="text-zinc-600" />
    </div>
  );
};
