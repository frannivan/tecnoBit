import React from 'react';
import { stations } from '../../data/stations';
import { useRadioStore } from '../../store/useRadioStore';
import { Play, BarChart3 } from 'lucide-react';

const StationListComponent: React.FC = () => {
    const { currentStation, setStation, isPlaying } = useRadioStore();

    return (
        <div className="grid grid-cols-2 md:grid-rows-2 md:grid-flow-col gap-3 md:gap-4 mt-4 md:mt-8 pb-4 overflow-x-auto md:overflow-x-auto snap-x snap-mandatory scrollbar-thin scrollbar-thumb-orange-500/20 scrollbar-track-transparent">
            {stations.map((station) => {
                const isActive = currentStation?.id === station.id;
                return (
                    <button
                        key={station.id}
                        onClick={() => setStation(station)}
                        className={`
                            flex-none w-full md:w-96
                            flex flex-col md:flex-row items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg border text-left transition-all group snap-start overflow-hidden
                            ${isActive 
                                ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_4_20px_rgba(249,115,22,0.1)]' 
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                            }
                        `}
                    >
                        {/* Station Image */}
                        {station.imageUrl && (
                            <div className="w-full aspect-square md:w-20 md:h-20 flex-shrink-0 rounded-md overflow-hidden border border-zinc-800">
                                <img src={station.imageUrl} alt={station.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            </div>
                        )}

                        <div className="flex-1 min-w-0 flex items-center gap-3">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                ${isActive ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'}
                            `}>
                                {isActive && isPlaying ? (
                                    <BarChart3 size={14} className="animate-pulse" />
                                ) : (
                                    <Play size={14} className="ml-0.5" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className={`font-bold truncate ${isActive ? 'text-orange-500' : 'text-zinc-300'}`}>
                                    {station.name}
                                </div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono truncate">
                                    {station.genre}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export const StationList = React.memo(StationListComponent);
