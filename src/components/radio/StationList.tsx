import React from 'react';
import { stations } from '../../data/stations';
import { useRadioStore } from '../../store/useRadioStore';
import { Play, BarChart3 } from 'lucide-react';

export const StationList: React.FC = () => {
    const { currentStation, setStation, isPlaying } = useRadioStore();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {stations.map((station) => {
                const isActive = currentStation?.id === station.id;
                return (
                    <button
                        key={station.id}
                        onClick={() => setStation(station)}
                        className={`
                            flex items-center gap-4 p-4 rounded-lg border text-left transition-all group
                            ${isActive 
                                ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]' 
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'
                            }
                        `}
                    >
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${isActive ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'}
                        `}>
                            {isActive && isPlaying ? (
                                <BarChart3 size={18} className="animate-pulse" />
                            ) : (
                                <Play size={18} className="ml-1" />
                            )}
                        </div>
                        <div>
                            <div className={`font-bold ${isActive ? 'text-orange-500' : 'text-zinc-300'}`}>
                                {station.name}
                            </div>
                            <div className="text-xs text-zinc-500 uppercase tracking-wider">
                                {station.genre}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
