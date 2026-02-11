import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30 overflow-x-hidden">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-black z-0 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col min-h-screen">
            <header className="p-6 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-sm flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(249,115,22,0.6)]">TB</div>
                    <h1 className="text-xl font-bold tracking-widest text-zinc-300">tecno<span className="text-orange-500">Bit</span></h1>
                </div>
                <div className="text-xs font-mono text-zinc-500">v1.0.0 // ANALOG_DIGITAL_HYBRID</div>
            </header>
            
            <main className="flex-1 p-4 md:p-8 flex flex-col gap-8">
                {children}
            </main>

            <footer className="p-4 text-center text-xs text-zinc-600 font-mono border-t border-white/5">
                ENGINEERED FOR AUDIO PURISTS
            </footer>
        </div>
    </div>
  );
};
