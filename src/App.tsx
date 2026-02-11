import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { RadioUnit } from './components/radio/RadioUnit';
import { DJDeck } from './components/dj/DJDeck';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { StartScreen } from './components/common/StartScreen';
import { HelpGuide } from './components/common/HelpGuide';
import { StationList } from './components/radio/StationList';
import { useRadioStore } from './store/useRadioStore';
import { HelpCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

function App() {
  // Initialize audio player logic
  useAudioPlayer();
  const { play } = useRadioStore();
  
  const [hasStarted, setHasStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleStart = () => {
    setHasStarted(true);
    play(); // Resume/Start audio context
    setShowHelp(true); // Auto-show help on first start
  };

  return (
    <MainLayout>
      <AnimatePresence>
        {!hasStarted && <StartScreen onStart={handleStart} />}
        {showHelp && <HelpGuide onClose={() => setShowHelp(false)} />}
      </AnimatePresence>

      <div className="flex flex-col gap-12 relative">
        <button 
            onClick={() => setShowHelp(true)}
            className="fixed bottom-6 right-6 z-40 bg-zinc-800 p-3 rounded-full shadow-lg border border-zinc-600 hover:bg-zinc-700 hover:border-orange-500 hover:text-orange-500 transition-all"
            title="Help Guide"
        >
            <HelpCircle size={24} />
        </button>

        <section>
            <RadioUnit />
            <StationList />
        </section>
        
        <section>
            <DJDeck />
        </section>
      </div>
    </MainLayout>
  );
}

export default App;
