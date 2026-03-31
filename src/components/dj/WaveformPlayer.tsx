import React, { useEffect, useState } from 'react';
import { useWaveform } from '../../hooks/useWaveform';
import { useDJStore } from '../../store/useDJStore';
import { useRadioStore } from '../../store/useRadioStore';
import { extractMetadata, getAudioDuration, type TrackMetadata } from '../../utils/extractMetadata';
import { Pause, Square, Music, Calendar, Disc } from 'lucide-react';

interface WaveformPlayerProps {
  trackId: string;
  compact?: boolean; // Compact mode for inline display
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({ trackId, compact = false }) => {
  const { currentStation, activeDeck, pause } = useRadioStore();
  
  // Decide which physical audio element to visualize
  const isCurrentlyPlaying = currentStation?.id === trackId;
  const targetDeck = isCurrentlyPlaying ? activeDeck : (activeDeck === 1 ? 2 : 1);
  const audio = document.getElementById(`global-audio-player-${targetDeck}`) as HTMLAudioElement;

  const { currentTime, duration, frequencies, seek } = useWaveform(audio);
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  
  const track = useDJStore(state => 
    state.playlist.find(t => t.id === trackId) || 
    state.history.find(t => t.id === trackId)
  );

  // Extract metadata when component mounts (only needed in full mode)
  useEffect(() => {
    if (compact) return;
    
    if (track?.audioUrl && !track.artwork) {
      Promise.all([
        extractMetadata(track.audioUrl),
        getAudioDuration(track.audioUrl)
      ]).then(([meta, dur]) => {
        setMetadata({ ...meta, duration: dur });
      });
    } else if (track) {
      setMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        year: track.year,
        artwork: track.artwork,
        duration: track.duration,
      });
    }
  }, [track, compact]);

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  const handlePause = () => {
    pause();
  };

  const handleStop = () => {
    pause();
    if (audio) {
      audio.currentTime = 0;
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Compact mode: Progress-synced waveform for playlist
  if (compact) {
    const barsCount = 40;
    const bars = Array.from(frequencies).slice(0, barsCount);

    return (
      <div className="flex flex-col gap-1 w-full max-w-[180px]">
        <div 
            className="group relative h-10 bg-black/40 rounded transition-all hover:bg-black/60 cursor-pointer overflow-hidden border border-white/5"
            onClick={handleSeek}
        >
          {/* Layer 1: Background Waves (Gray/Future) */}
          <div className="absolute inset-0 flex items-end gap-[1px] px-1 opacity-20">
            {bars.map((value, index) => {
              const height = Math.max(15, (value / 255) * 100);
              return (
                <div 
                  key={`bg-${index}`} 
                  className="flex-1 bg-zinc-500 rounded-t"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Layer 2: Foreground Waves (Orange/Past) - Clipped by Progress */}
          <div 
              className="absolute inset-0 flex items-end gap-[1px] px-1 transition-all duration-300 pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
          >
            {bars.map((value, index) => {
              const height = Math.max(15, (value / 255) * 100);
              return (
                <div 
                  key={`fg-${index}`} 
                  className="flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Progress Head Line */}
          <div 
            className="absolute top-0 bottom-0 w-[1px] bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] z-10 transition-all duration-100"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Mini Time Display */}
        <div className="flex justify-between px-1">
            <span className="text-[9px] font-mono text-orange-500/80">{formatTime(currentTime)}</span>
            <span className="text-[9px] font-mono text-zinc-600">{formatTime(duration)}</span>
        </div>
      </div>
    );
  }

  // Full mode: vertical layout (original)
  return (
    <div className="mt-3 space-y-3">
      {/* Track Info (Full View) */}
      {!compact && metadata && (
        <div className="flex gap-4 p-4 bg-black/40 rounded-lg border border-white/5">
          <div className="w-24 h-24 bg-zinc-800 rounded shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/10 group-hover:border-orange-500/50 transition-colors">
            {metadata.artwork ? (
              <img src={metadata.artwork} alt="Artwork" className="w-full h-full object-cover" />
            ) : (
              <Disc className="w-12 h-12 text-zinc-600 animate-[spin_10s_linear_infinite]" />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-white truncate group-hover:text-orange-400 transition-colors">
              {metadata.title || 'Unknown Track'}
            </h3>
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Music size={14} className="text-orange-500" />
                <span className="truncate">{metadata.artist || 'Unknown Artist'}</span>
              </div>
              {metadata.album && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <Disc size={12} />
                  <span className="truncate">{metadata.album}</span>
                </div>
              )}
              {metadata.year && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <Calendar size={12} />
                  <span>{metadata.year}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex gap-2">
        <button
          onClick={handlePause}
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm"
          title="Pause"
        >
          <Pause size={14} fill="currentColor" />
          Pause
        </button>
        <button
          onClick={handleStop}
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm"
          title="Stop"
        >
          <Square size={12} fill="currentColor" />
          Stop
        </button>
      </div>

      {/* Waveform Visualization */}
      <div className="h-16 bg-black/40 rounded flex items-end gap-[2px] px-2 overflow-hidden">
        {Array.from(frequencies).map((value, index) => {
          const height = (value / 255) * 100;
          return (
            <div 
              key={index} 
              className="flex-1 bg-gradient-to-t from-orange-500 to-orange-300 rounded-t transition-all duration-75"
              style={{ height: `${height}%`, minHeight: '2px' }}
            />
          );
        })}
      </div>

      {/* Progress Timeline */}
      <div className="space-y-1">
        <div 
          onClick={handleSeek}
          className="h-2 bg-zinc-800 rounded-full overflow-hidden cursor-pointer group relative"
        >
          <div 
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          {/* Playhead */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-[10px] font-mono text-zinc-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
