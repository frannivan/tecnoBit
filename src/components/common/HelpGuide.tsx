import React from 'react';
import { X, Radio, Disc, MoveHorizontal, MousePointerClick } from 'lucide-react';
import { motion } from 'framer-motion';

interface HelpGuideProps {
    onClose: () => void;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ onClose }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-orange-500 mb-6 tracking-wide flex items-center gap-2">
                    <span className="w-2 h-8 bg-orange-500 rounded-sm"></span>
                    SYSTEM MANUAL
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-zinc-100 font-bold flex items-center gap-2 mb-2">
                                <Radio className="text-orange-500" size={20} />
                                Radio Tuning
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Use the <span className="text-zinc-200 font-mono bg-zinc-800 px-1 rounded">TUNER STRIP</span> to change stations. 
                                Drag the needle left or right to scan frequencies. 
                                Alternatively, select a station from the list below the radio unit.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-zinc-100 font-bold flex items-center gap-2 mb-2">
                                <Disc className="text-orange-500" size={20} />
                                DJ Mode
                            </h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Build your set by dragging tracks from the 
                                <span className="text-zinc-200 font-bold ml-1">HISTORY</span> crate 
                                into the <span className="text-zinc-200 font-bold">MASTER PLAYLIST</span> deck.
                            </p>
                        </section>
                    </div>

                    <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-white/5">
                        <h4 className="text-zinc-500 uppercase text-xs font-bold tracking-widest mb-2">Controls</h4>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <MoveHorizontal size={20} />
                            </div>
                            <span className="text-zinc-300 text-sm">Drag to tune / move tracks</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                                <MousePointerClick size={20} />
                            </div>
                            <span className="text-zinc-300 text-sm">Click controls / list items</span>
                        </div>

                        <div className="pt-4 border-t border-zinc-700">
                             <button
                                onClick={() => {
                                    const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
                                    const osc = ac.createOscillator();
                                    const gain = ac.createGain();
                                    osc.connect(gain);
                                    gain.connect(ac.destination);
                                    osc.frequency.setValueAtTime(440, ac.currentTime);
                                    gain.gain.setValueAtTime(0.1, ac.currentTime);
                                    osc.start();
                                    osc.stop(ac.currentTime + 0.5);
                                }}
                                className="w-full py-2 bg-red-900/30 border border-red-500/50 text-red-200 rounded hover:bg-red-900/50 transition-colors text-xs font-mono"
                             >
                                [DEBUG] PLAY TEST BEEP (440Hz)
                             </button>
                             <p className="text-[10px] text-zinc-500 mt-1">
                                Click this. If you don't hear a beep, your system audio is muted or the tab is blocked.
                             </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
                    <button 
                        onClick={onClose}
                        className="bg-orange-500 text-black font-bold py-2 px-8 rounded hover:bg-orange-400 transition-colors"
                    >
                        GOT IT
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
