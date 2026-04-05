import React, { useEffect, useState } from 'react';
import { useWakeLock } from '../../hooks/useWakeLock';
import { Toaster } from 'react-hot-toast';
import * as Tone from 'tone';

const AudioStatusIndicator: React.FC = () => {
    const [state, setState] = useState(Tone.context.state);
    
    useEffect(() => {
        const i = setInterval(() => setState(Tone.context.state), 500);
        return () => clearInterval(i);
    }, []);

    const handleManualReset = async () => {
        await Tone.start();
        await Tone.context.resume();
        const osc = new Tone.Oscillator().toDestination().start();
        osc.stop("+0.05");
    };

    return (
        <button 
            onClick={handleManualReset}
            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all tracking-tighter ${
                state === 'running' 
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' 
                : 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse'
            }`}
        >
            {state === 'running' ? '● AUDIO_LIVE' : '○ AUDIO_STUCK (RESET)'}
        </button>
    );
};

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
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
-                <div className="text-xs font-mono text-zinc-500">v1.2.5 (AUDIO_RESILIENCE) // ANALOG_DIGITAL_HYBRID</div>
+                <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
+                   <span>v1.2.6 (PRO_DIAGNOSTIC)</span>
+                   <AudioStatusIndicator />
+                </div>
            </header>
            
            <main className="flex-1 p-4 md:p-8 flex flex-col gap-8">
                <Toaster position="bottom-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
                {children}
            </main>

            <footer className="p-4 text-center text-xs text-zinc-600 font-mono border-t border-white/5">
                ENGINEERED FOR AUDIO PURISTS
            </footer>
        </div>
    </div>
  );
};
