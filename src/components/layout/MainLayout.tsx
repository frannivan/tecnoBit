import React, { useEffect } from 'react';
import { useWakeLock } from '../../hooks/useWakeLock';
import { DebugConsole } from '../common/DebugConsole';
import { Toaster } from 'react-hot-toast';

const SILENCE_MP3_BASE64 = "SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZTU4LjEzNC4xMDAAAAAAAAAAAAAAAP/N0AAAAAAAbAEEAAABNIDZTAAAAAO76VnI77vn57/e/3v97/e/3v97/e/3v97/e/3v97/e/3v9/ff/f/3/9//f/3/9//f/3/9//f/3/9//f/3/9//f/3/9//f/3/9//f/3/9//f/3/9//f/3/9//f/3/9//f/w==";

interface Props {
  children: React.ReactNode;
}

export const MainLayout: React.FC<Props> = ({ children }) => {
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  useEffect(() => {
    const setupUnlocker = () => {
        const el = document.getElementById('global-unlocker') as HTMLAudioElement;
        if (el && !el.src) {
            try {
                const binary = atob(SILENCE_MP3_BASE64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) {
                    bytes[i] = binary.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/mpeg' });
                el.src = URL.createObjectURL(blob);
                el.load();
                console.log("Global Audio Unlocker: Blob Initialized");
            } catch (e) {
                console.error("Global Audio Unlocker: Blob Failed", e);
            }
        }
    };
    setupUnlocker();
    
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
                <div className="text-[10px] uppercase font-mono text-zinc-500 opacity-50">v1.5.52 (STABILITY_FIX) // MOBILE_SCAN_OFF</div>
            </header>
            
            <main className="flex-1 p-4 md:p-8 flex flex-col gap-8">
                <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
                {children}
            </main>
            <DebugConsole />
            
            {/* Hidden audio element for iOS hardware unlocking */}
            <audio id="global-unlocker" playsInline preload="auto" style={{ display: 'none' }} />

            <footer className="p-4 text-center text-xs text-zinc-600 font-mono border-t border-white/5">
                ENGINEERED FOR AUDIO PURISTS
            </footer>
        </div>
    </div>
  );
};
