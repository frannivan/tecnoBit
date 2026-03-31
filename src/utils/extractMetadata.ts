import jsmediatags from 'jsmediatags';

export interface TrackMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  artwork?: string; // Base64 data URL
  duration?: number;
}

export const extractMetadata = (source: string | File | Blob): Promise<TrackMetadata> => {
  return new Promise((resolve) => {
    jsmediatags.read(source, {
      onSuccess: (tag) => {
        const tags = tag.tags;
        let artwork: string | undefined;

        // Extract album artwork
        if (tags.picture) {
          const { data, format } = tags.picture;
          const base64String = data.reduce((acc: string, byte: number) => acc + String.fromCharCode(byte), '');
          artwork = `data:${format};base64,${btoa(base64String)}`;
        }

        resolve({
          title: tags.title,
          artist: tags.artist,
          album: tags.album,
          year: tags.year,
          artwork,
        });
      },
      onError: (error) => {
        console.warn('Failed to extract metadata:', error);
        resolve({}); // Return empty metadata on error
      },
    });
  });
};

// Helper to get duration from audio element
export const getAudioDuration = (audioUrl: string): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    
    // Safety timeout: if metadata doesn't load in 10s, give up
    const timeout = setTimeout(() => {
        audio.src = '';
        resolve(0);
    }, 10000);

    audio.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      resolve(Math.round(audio.duration));
    });
    audio.addEventListener('error', () => {
      clearTimeout(timeout);
      resolve(0);
    });
  });
};
