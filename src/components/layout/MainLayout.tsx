import React, { useEffect } from 'react';
import { useWakeLock } from '../../hooks/useWakeLock';
import { DebugConsole } from '../common/DebugConsole';
import { Toaster } from 'react-hot-toast';

export const SILENCE_WAV = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A/wD/";

interface Props {
  children: React.ReactNode;
}

export const MainLayout: React.FC<Props> = ({ children }) => {
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  useEffect(() => {
    requestWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, []);

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-orange-500/30 overflow-x-hidden relative">
        <div className="relative z-10 flex flex-col min-h-screen">
            <header className="p-6 flex justify-between items-center header-glass">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded flex items-center justify-center font-bold text-black shadow-[0_0_20px_rgba(249,115,22,0.4)] transform hover:rotate-12 transition-transform">TB</div>
                    <div>
                        <h1 className="text-xl font-bold tracking-widest text-zinc-100">tecno<span className="text-orange-500">Bit</span></h1>
                        <div className="h-0.5 w-full bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                    </div>
                </div>
                <div className="text-[10px] uppercase font-mono text-zinc-500 opacity-50">v1.5.57 (STABILITY_FIX) // PERSISTENT_SESSION</div>
            </header>
            
            <main className="flex-1 p-4 md:p-8 flex flex-col gap-8">
                <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
                {children}
            </main>
            <DebugConsole />
            
            {/* Hidden audio element for iOS hardware unlocking */}
            {/* HIDDEN BUT VISIBLE TO BROWSER (To avoid NotSupportedError on iOS) */}
            <audio 
                id="permanent-keeper" 
                preload="auto" 
                playsInline 
                loop
                muted={false}
                style={{ position: 'fixed', left: '-1000px', top: '-1000px', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px' }} 
            />

            <footer className="p-4 text-center text-xs text-zinc-600 font-mono border-t border-white/5">
                ENGINEERED FOR AUDIO PURISTS
            </footer>
        </div>
    </div>
  );
};
