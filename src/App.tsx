import { MainLayout } from './components/layout/MainLayout';
import { RadioUnit } from './components/radio/RadioUnit';
import { DJDeck } from './components/dj/DJDeck';
import { useAudioPlayer } from './hooks/useAudioPlayer';

function App() {
  // Initialize audio player logic
  useAudioPlayer();

  return (
    <MainLayout>
      <div className="flex flex-col gap-12">
        <section>
            <RadioUnit />
        </section>
        
        <section>
            <DJDeck />
        </section>
      </div>
    </MainLayout>
  );
}

export default App;
