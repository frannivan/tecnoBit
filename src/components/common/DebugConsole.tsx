import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Trash2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DebugConsole: React.FC = () => {
    const [logs, setLogs] = useState<{ type: 'log' | 'error' | 'warn', msg: string, time: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
            const msg = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            
            setLogs(prev => [...prev.slice(-49), { 
                type, 
                msg, 
                time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
            }]);
        };

        console.log = (...args) => {
            addLog('log', args);
            originalLog.apply(console, args);
        };
        console.error = (...args) => {
            addLog('error', args);
            originalError.apply(console, args);
        };
        console.warn = (...args) => {
            addLog('warn', args);
            originalWarn.apply(console, args);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    return (
        <>
            {/* FLOATING TOGGLE BUTTON */}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-[90vw] md:w-[400px] h-[300px] flex flex-col overflow-hidden pointer-events-auto mb-2"
                        >
                            <div className="bg-zinc-800 p-2 flex items-center justify-between border-b border-zinc-700">
                                <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold uppercase tracking-widest">
                                    <Terminal size={14} className="text-orange-500" />
                                    System Logs
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setLogs([])}
                                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                                        title="Clear Logs"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <div 
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 bg-black"
                            >
                                {logs.length === 0 ? (
                                    <div className="text-zinc-600 italic text-center py-4">No logs yet...</div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="flex gap-2 border-b border-white/5 pb-1">
                                            <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                                            <span className={
                                                log.type === 'error' ? 'text-red-400' :
                                                log.type === 'warn' ? 'text-yellow-400' :
                                                'text-zinc-300'
                                            }>
                                                {log.msg}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="self-end p-3 bg-zinc-800 border border-orange-500/30 text-orange-500 rounded-full shadow-lg hover:bg-zinc-700 transition-all pointer-events-auto active:scale-95 flex items-center gap-2"
                >
                    {isOpen ? <ChevronDown size={20} /> : <Terminal size={20} />}
                    <span className="text-[10px] font-bold uppercase">Logs</span>
                </button>
            </div>
        </>
    );
};
